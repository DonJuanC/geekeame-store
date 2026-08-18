import {
  addDoc,
  collection,
  deleteDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  updateDoc,
  where,
  doc,
  getDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Product } from "../types/product";

// Quita tildes/diacríticos para que "pokemon" matchee "Pokémon".
function stripAccents(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Prefijos en minúscula de cada palabra del nombre ("Llavero Alien" ->
// "l","ll","lla",...,"llavero","a","al","ali","alie","alien"). Permite
// buscar por cualquier palabra del nombre (no solo por el nombre completo
// desde el inicio) usando array-contains, que sí soporta substring/palabra
// parcial a diferencia del orderBy+startAt/endAt sobre nameLower que solo
// hacía match por prefijo del NOMBRE COMPLETO (buscar "Alien" no encontraba
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

// Token de búsqueda: array-contains solo soporta UN valor por query, así
// que si el usuario escribe varias palabras ("Llavero Ali") tomamos la
// última -- es la más específica mientras sigue escribiendo.
function searchToken(searchTerm: string): string | null {
  const words = stripAccents(searchTerm.toLowerCase())
    .replace(/[^a-z0-9\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return words.length ? words[words.length - 1] : null;
}

export const PRODUCTS_PAGE_SIZE = 12;

export interface ListProductsParams {
  categoryId?: string | null;
  searchTerm?: string;
  pageSize?: number;
  // Cursor de Firestore (el último doc de la página anterior). Se pide
  // "cargar más" pasando el cursor devuelto por la llamada previa -- ver
  // ProductsContext.loadMore.
  cursor?: QueryDocumentSnapshot<DocumentData> | null;
}

export interface ListProductsResult {
  products: Product[];
  // null = no hay más páginas (o la búsqueda actual no soporta paginar,
  // ver nota más abajo). Se guarda tal cual el QueryDocumentSnapshot en
  // vez de solo el id/createdAt porque startAfter() de Firestore lo pide
  // así -- reconstruir un cursor equivalente a mano es más frágil.
  nextCursor: QueryDocumentSnapshot<DocumentData> | null;
}

export async function listProducts({
  categoryId,
  searchTerm,
  pageSize = PRODUCTS_PAGE_SIZE,
  cursor = null,
}: ListProductsParams): Promise<ListProductsResult> {
  const constraints = [];
  const token = searchTerm ? searchToken(searchTerm) : null;

  if (categoryId) {
    constraints.push(where("categoryId", "==", categoryId));
  }

  if (token) {
    constraints.push(where("searchKeywords", "array-contains", token));
    // Sin orderBy ni cursor acá: agregar orderBy junto al where de
    // categoryId + el array-contains pediría un tercer índice compuesto,
    // y sin un orden estable no hay forma correcta de paginar con
    // startAfter. Para un catálogo chico como este, devolver hasta
    // pageSize resultados de búsqueda sin "cargar más" es una limitación
    // aceptable -- ver nextCursor más abajo (siempre null si hay token).
  } else {
    constraints.push(orderBy("createdAt", "desc"));
    if (cursor) constraints.push(startAfter(cursor));
  }

  constraints.push(limit(pageSize));

  const q = query(collection(db, "products"), ...constraints);
  const snap = await getDocs(q);
  const products = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product);

  // Si la página vino completa (== pageSize) asumimos que puede haber más
  // y ofrecemos seguir paginando; si vino corta, ya no hay nada después.
  const nextCursor =
    !token && snap.docs.length === pageSize
      ? snap.docs[snap.docs.length - 1]
      : null;

  return { products, nextCursor };
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
