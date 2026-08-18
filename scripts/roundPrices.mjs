// Migración única: redondea el precio de todos los productos ya sembrados
// en Firestore a la centena más cercana (8796 -> 8800, 33796 -> 33800).
//
// Por qué: los precios que puso el seed original venían de
// min + ((i*733) % rango) sin redondear -- da números "exactos" como
// $28.665 o $8.796 que, aunque están bien calculados, se leen como precio
// de lista mayorista/costo (mucha precisión de más) en vez de un precio de
// vitrina retail. seed.mjs y el resto de generadores de precio ya se
// corrigieron para redondear desde el vamos; este script es solo para
// arreglar lo que ya está en la base.
//
// Uso: node --env-file=.env scripts/roundPrices.mjs
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import {
  getFirestore,
  writeBatch,
  doc,
  collection,
  getDocs,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function roundPrice(value) {
  return Math.round(value / 100) * 100;
}

async function migrate() {
  await signInWithEmailAndPassword(
    auth,
    process.env.SEED_ADMIN_EMAIL,
    process.env.SEED_ADMIN_PASSWORD,
  );

  const snap = await getDocs(collection(db, "products"));

  const toUpdate = snap.docs.filter((d) => {
    const price = d.data().price;
    return typeof price === "number" && roundPrice(price) !== price;
  });

  if (toUpdate.length === 0) {
    console.log("Todos los precios ya están redondeados a la centena. Nada que hacer.");
    process.exit(0);
  }

  const batch = writeBatch(db);
  toUpdate.forEach((d) => {
    const oldPrice = d.data().price;
    const newPrice = roundPrice(oldPrice);
    batch.update(doc(db, "products", d.id), {
      price: newPrice,
      updatedAt: Date.now(),
    });
    console.log(`"${d.data().name}": $${oldPrice} -> $${newPrice}`);
  });

  await batch.commit();
  console.log(`Redondeados ${toUpdate.length} de ${snap.docs.length} productos.`);
  process.exit(0);
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
