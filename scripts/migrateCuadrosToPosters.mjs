// Migración única: los productos "cuadros-punto-cruz" ya sembrados en
// Firestore pasan a la categoría "posters". Cambiar el código (types,
// seed.mjs, etc.) no alcanza -- los docs ya existentes en Firestore
// siguen con categoryId/nombre viejo hasta que este script corre.
//
// Qué hace por cada producto con categoryId "cuadros-punto-cruz":
//   - categoryId -> "posters"
//   - description -> la nueva descripción de posters
//   - price -> recalculado con el mismo patrón que usa seed.mjs para el
//     rango de precio de posters (no tiene sentido mantener el precio de
//     "cuadro enmarcado" para un poster)
//   - name -> si empieza con "Cuadro Punto de Cruz " (el prefijo que puso
//     el seed), se reemplaza por "Poster "; si el nombre fue editado a
//     mano desde el admin y no matchea ese prefijo exacto, se deja el
//     nombre tal cual (no se adivina) y se avisa por consola para
//     revisarlo manualmente
//   - nameLower/searchKeywords se recalculan a partir del nombre final
//
// Uso: node --env-file=.env scripts/migrateCuadrosToPosters.mjs
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import {
  getFirestore,
  writeBatch,
  doc,
  collection,
  getDocs,
  query,
  where,
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

const OLD_PREFIX = "Cuadro Punto de Cruz ";
const POSTERS = {
  unit: "Poster",
  priceRange: [15000, 25000],
  desc: "Poster impreso, tamaño A3.",
};

// Mismo algoritmo que buildSearchKeywords en src/services/productsService.ts
// -- duplicado acá porque este script corre standalone con Node (no pasa
// por el bundler de Vite).
function buildSearchKeywords(name) {
  const words = name
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  const keywords = new Set();
  for (const word of words) {
    for (let i = 1; i <= word.length; i++) {
      keywords.add(word.slice(0, i));
    }
  }
  return Array.from(keywords);
}

async function migrate() {
  await signInWithEmailAndPassword(
    auth,
    process.env.SEED_ADMIN_EMAIL,
    process.env.SEED_ADMIN_PASSWORD,
  );

  const q = query(
    collection(db, "products"),
    where("categoryId", "==", "cuadros-punto-cruz"),
  );
  const snap = await getDocs(q);

  if (snap.empty) {
    console.log('No hay productos con categoryId "cuadros-punto-cruz". Nada que hacer.');
    process.exit(0);
  }

  const [min, max] = POSTERS.priceRange;
  const batch = writeBatch(db);
  let renamed = 0;
  let keptName = 0;

  snap.docs.forEach((d, i) => {
    const data = d.data();
    let name = data.name;

    if (name.startsWith(OLD_PREFIX)) {
      name = `${POSTERS.unit} ${name.slice(OLD_PREFIX.length)}`;
      renamed++;
    } else {
      keptName++;
      console.warn(
        `Aviso: "${data.name}" (id ${d.id}) no empieza con "${OLD_PREFIX}" -- se deja el nombre igual, revisar a mano si hace falta.`,
      );
    }

    batch.update(doc(db, "products", d.id), {
      categoryId: "posters",
      description: POSTERS.desc,
      price: min + ((i * 733) % (max - min)),
      name,
      nameLower: name.toLowerCase(),
      searchKeywords: buildSearchKeywords(name),
      updatedAt: Date.now(),
    });
  });

  await batch.commit();
  console.log(
    `Migrados ${snap.docs.length} productos a "posters" (${renamed} renombrados, ${keptName} con nombre sin tocar -- ver avisos arriba).`,
  );
  process.exit(0);
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
