import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, writeBatch, doc, collection } from "firebase/firestore";

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

const themes = [
  "Katamari Damacy", "Portal Companion Cube", "Zelda Trifuerza", "Mario Champiñón",
  "Sonic Anillo", "Pac-Man", "Space Invaders", "Tetris Bloque", "Pokébola", "Kirby",
  "Mega Man", "Street Fighter Ryu", "Chrono Trigger", "Final Fantasy Moguri",
  "Metroid Samus", "Undertale Sans", "Stardew Valley", "Minecraft Creeper",
  "Among Us", "Cyberpunk Silhouette",
];

const categoryMeta = {
  "pines": { unit: "Pin", priceRange: [10000, 13000], desc: "Pin esmaltado, 3cm." },
  "stickers": { unit: "Sticker", priceRange: [5000, 8000], desc: "Sticker vinilo resistente al agua." },
  "cuadros-punto-cruz": { unit: "Cuadro Punto de Cruz", priceRange: [42000, 52000], desc: "Cuadro enmarcado, 15x15cm." },
};

const products = [];
for (const [categoryId, meta] of Object.entries(categoryMeta)) {
  themes.forEach((theme, i) => {
    const [min, max] = meta.priceRange;
    products.push({
      name: `${meta.unit} ${theme}`,
      categoryId,
      price: min + ((i * 733) % (max - min)),
      stock: 5 + ((i * 7) % 40),
      description: meta.desc,
      imageUrl: `https://picsum.photos/seed/${categoryId}-${i}/400`,
    });
  });
}

async function seed() {
  await signInWithEmailAndPassword(auth, process.env.SEED_ADMIN_EMAIL, process.env.SEED_ADMIN_PASSWORD);

  const batch = writeBatch(db);
  for (const p of products) {
    const ref = doc(collection(db, "products"));
    batch.set(ref, { ...p, nameLower: p.name.toLowerCase(), createdAt: Date.now() });
  }
  await batch.commit();
  console.log(`Sembrados ${products.length} productos.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
