import {
  addDoc,
  collection,
  deleteDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAt,
  endAt,
  updateDoc,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Product } from "../types/product";

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

  if (categoryId) {
    constraints.push(where("categoryId", "==", categoryId));
  }

  if (searchTerm) {
    const prefix = searchTerm.toLowerCase();
    constraints.push(orderBy("nameLower"));
    constraints.push(startAt(prefix));
    constraints.push(endAt(prefix + "\uf8ff"));
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
  "id" | "nameLower" | "createdAt" | "updatedAt"
>;

export async function createProduct(input: ProductInput): Promise<string> {
  const docRef = await addDoc(collection(db, "products"), {
    ...input,
    nameLower: input.name.toLowerCase(),
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
    ...(patch.name ? { nameLower: patch.name.toLowerCase() } : {}),
    updatedAt: Date.now(),
  });
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, "products", id));
}
