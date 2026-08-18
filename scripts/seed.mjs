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

// Tres "mundos" temáticos, solo para organizar el pool de nombres acá abajo.
// No es un campo que se guarde en Firestore: el filtro del catálogo sigue
// siendo por categoryId (tipo de producto), no por franquicia.
const videojuegos = [
  "Super Mario", "Zelda", "Sonic", "Pokémon", "Kirby", "Undertale", "Minecraft",
  "Among Us", "Stardew Valley", "Portal", "Street Fighter", "Mega Man", "Metroid",
  "Chrono Trigger", "Final Fantasy", "Tetris", "Pac-Man", "Space Invaders",
  "Katamari Damacy", "Animal Crossing", "Splatoon", "The Last of Us",
  "Hollow Knight", "Cuphead", "Fortnite",
];

const anime = [
  "Naruto", "Dragon Ball", "One Piece", "Studio Ghibli", "Sailor Moon",
  "Death Note", "Demon Slayer", "Attack on Titan", "My Hero Academia",
  "Evangelion", "Fullmetal Alchemist", "Cowboy Bebop", "Jujutsu Kaisen",
  "Spy x Family", "Chainsaw Man", "Bleach", "Hunter x Hunter", "Tokyo Ghoul",
  "One Punch Man", "Inuyasha", "Sword Art Online", "Dr. Stone", "Haikyu",
  "Mob Psycho 100", "Violet Evergarden",
];

const peliculasYSeries = [
  "Star Wars", "Harry Potter", "Marvel", "Stranger Things", "Rick and Morty",
  "Volver al Futuro", "Jurassic Park", "Matrix", "Ghostbusters", "Toy Story",
  "Breaking Bad", "Game of Thrones", "El Señor de los Anillos", "Los Simpson",
  "South Park", "Star Trek", "Indiana Jones", "Alien", "Blade Runner", "E.T.",
  "Los Goonies", "Coco", "Shrek", "Los Increíbles", "La Familia Addams",
];

const categoryMeta = {
  "pines": { unit: "Pin", priceRange: [10000, 13000], desc: "Pin esmaltado, 3cm." },
  "stickers": { unit: "Sticker", priceRange: [5000, 8000], desc: "Sticker vinilo resistente al agua." },
  "posters": { unit: "Poster", priceRange: [15000, 25000], desc: "Poster impreso, tamaño A3." },
  "llaveros": { unit: "Llavero", priceRange: [8000, 12000], desc: "Llavero acrílico, 5cm." },
  "tazas": { unit: "Taza", priceRange: [25000, 35000], desc: "Taza cerámica, 11oz." },
};

// Interleave los 3 mundos (25 temas cada uno) en un solo pool de 75, y lo
// reparto round-robin entre las 5 categorías: cada categoría recibe 15 temas
// únicos, sin repetir ninguno con las demás, con mezcla pareja de los 3
// mundos dentro de cada una.
const worlds = [videojuegos, anime, peliculasYSeries];
const themePool = [];
for (let i = 0; i < 25; i++) {
  for (const world of worlds) themePool.push(world[i]);
}

const categoryIds = Object.keys(categoryMeta);
const themesByCategory = Object.fromEntries(categoryIds.map((id) => [id, []]));
themePool.forEach((theme, i) => {
  themesByCategory[categoryIds[i % categoryIds.length]].push(theme);
});

// Color determinístico por tema: el mismo string siempre produce el mismo
// color, así que si un tema llegara a repetirse se vería igual en cualquier
// categoría.
function hashHue(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x) => Math.round(255 * x).toString(16).padStart(2, "0");
  return `${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

function colorForTheme(theme) {
  return hslToHex(hashHue(theme), 65, 45);
}

const products = [];
for (const categoryId of categoryIds) {
  const meta = categoryMeta[categoryId];
  const [min, max] = meta.priceRange;
  themesByCategory[categoryId].forEach((theme, i) => {
    const name = `${meta.unit} ${theme}`;
    products.push({
      name,
      categoryId,
      price: min + ((i * 733) % (max - min)),
      stock: 5 + ((i * 7) % 40),
      description: meta.desc,
      imageUrl: `https://placehold.co/400x400/${colorForTheme(theme)}/FFFFFF?text=${encodeURIComponent(name)}`,
    });
  });
}

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

async function seed() {
  await signInWithEmailAndPassword(auth, process.env.SEED_ADMIN_EMAIL, process.env.SEED_ADMIN_PASSWORD);

  const batch = writeBatch(db);
  for (const p of products) {
    const ref = doc(collection(db, "products"));
    batch.set(ref, {
      ...p,
      nameLower: p.name.toLowerCase(),
      searchKeywords: buildSearchKeywords(p.name),
      createdAt: Date.now(),
    });
  }
  await batch.commit();
  console.log(`Sembrados ${products.length} productos.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
