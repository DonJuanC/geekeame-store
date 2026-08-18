import {
  addDoc,
  collection,
  deleteDoc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Product } from "../types/product";

// Quita tildes/diacr\u00edticos para que "pokemon" matchee "Pok\u00e9mon".
function stripAccents(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Prefijos en min\u00fascula de cada palabra del nombre ("Llavero Alien" ->
// "l","ll","lla",...,"llavero","a","al","ali","alie","alien"). Permite
// buscar por cualquier palabra del nombre (no solo por el nombre completo
// desde el inicio) usando array-contains, que s\u00ed soporta substring/palabra
// parcial a diferencia del orderBy+startAt/endAt sobre nameLower que solo
// hac\u00eda match por prefijo del NOMBRE COMPLETO (buscar "Alien" no encontraba
// "Llavero Alien" porque el nombre no empieza por "alien").
export function buildSearchKeywords(name: string): string[] {
  const words = stripAccents(name.toLowerCase())
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  const keywords = new Set<string>();
  for (const word of words) {
    for (let i = 1; i <= word.length; i++) {
      keywords.add(word.slice(0, i));
    }
  }
  return Array.from(keywords);
}

// Token de b\u00fasqueda: array-contains solo soporta UN valor por query, as\u00ed
// que si el usuario escribe varias palabras ("Llavero Ali") tomamos la
// \u00faltima -- es la m\u00e1s espec\u00edfica mientras sigue escribiendo.
function searchToken(searchTerm: string): string | null {
  const words = stripAccents(searchTerm.toLowerCase())
    .replace(/[^a-z0-9\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return words.length ? words[words.length - 1] : null;
}

export interface ListProductsParams {
  categoryId?: string | null;
  searchTerm?: string;
  maxResults?: number;
}

export async function listProducts({
  categoryId,
  searchTerm,
  maxResults = 60,
}: ListProductsParams): Promise<Product[]> {
  const constraints = [];
  const token = searchTerm ? searchToken(searchTerm) : null;

  if (categoryId) {
    constraints.push(where("categoryId", "==", categoryId));
  }

  if (token) {
    constraints.push(where("searchKeywords", "array-contains", token));
    // Sin orderBy ac\u00e1: agregarlo junto con el where de categoryId dispara
    // otro \u00edndice compuesto distinto. El orden importa poco en resultados
    // de b\u00fasqueda de un cat\u00e1logo chico.
  } else {
    constraints.push(orderBy("createdAt", "desc"));
  }

  constraints.push(limit(maxResults));

  const q = query(collection(db, "products"), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product);
}

export async function getProductById(id: string): Promise<Product | null> {
  const snap = await getDoc(doc(db, "products", id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Product) : null;
}

// Listado para el panel admin: sin filtro de categoría/búsqueda (el admin
// necesita ver todo el catálogo, no lo que un cliente filtró) y ordenado
// por nombre en vez de por fecha de creación, que es más útil para
// gestionar/ubicar productos en una tabla. maxResults en 500 para no
// truncar el catálogo administrado.
export async function listAllProductsForAdmin(): Promise<Product[]> {
  const q = query(collection(db, "products"), orderBy("name"), limit(500));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product);
}

export type ProductInput = Omit<
  Product,
  "id" | "nameLower" | "searchKeywords" | "createdAt" | "updatedAt"
>;

export async function createProduct(input: ProductInput): Promise<string> {
  const docRef = await addDoc(collection(db, "products"), {
    ...input,
    nameLower: input.name.toLowerCase(),
    searchKeywords: buildSearchKeywords(input.name),
    createdAt: Date.now(),
  });
  return docRef.id;
}

export async function updateProduct(
  id: string,
  patch: Partial<ProductInput>,
): Promise<void> {
  const ref = doc(db, "products", id);
  await updateDoc(ref, {
    ...patch,
    ...(patch.name
      ? {
          nameLower: patch.name.toLowerCase(),
          searchKeywords: buildSearchKeywords(patch.name),
        }
      : {}),
    updatedAt: Date.now(),
  });
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, "products", id));
}
