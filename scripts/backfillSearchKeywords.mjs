// Migración única: agrega el campo searchKeywords a los productos que ya
// existen en Firestore (creados antes de este campo). Los productos nuevos
// ya lo reciben solos vía createProduct/updateProduct en productsService.ts.
//
// Uso: node --env-file=.env scripts/backfillSearchKeywords.mjs
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

// Mismo algoritmo que buildSearchKeywords en src/services/productsService.ts
// -- duplicado acá porque este script corre standalone con Node (no pasa
// por el bundler de Vite), no porque haya que mantenerlo sincronizado a
// mano: si cambia el de productsService.ts, actualizar también acá.
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

async function backfill() {
  await signInWithEmailAndPassword(
    auth,
    process.env.SEED_ADMIN_EMAIL,
    process.env.SEED_ADMIN_PASSWORD,
  );

  const snap = await getDocs(collection(db, "products"));
  const pending = snap.docs.filter((d) => {
    const data = d.data();
    return !Array.isArray(data.searchKeywords) || data.searchKeywords.length === 0;
  });

  if (pending.length === 0) {
    console.log("Todos los productos ya tienen searchKeywords. Nada que hacer.");
    process.exit(0);
  }

  // writeBatch soporta máximo 500 operaciones; el catálogo actual (~75
  // productos) entra en un solo batch, pero por si crece se parte en
  // grupos de 400 para no arriesgar el límite.
  const CHUNK = 400;
  for (let i = 0; i < pending.length; i += CHUNK) {
    const batch = writeBatch(db);
    for (const d of pending.slice(i, i + CHUNK)) {
      const name = d.data().name;
      batch.update(doc(db, "products", d.id), {
        searchKeywords: buildSearchKeywords(name),
      });
    }
    await batch.commit();
  }

  console.log(`Actualizados ${pending.length} productos con searchKeywords.`);
  process.exit(0);
}

backfill().catch((err) => {
  console.error(err);
  process.exit(1);
});
