import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAt,
  endAt,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Product } from "../types/product";

export interface ListProductsParams {
  categoryId?: string | null;
  searchTerm?: string;
}

export async function listProducts({
  categoryId,
  searchTerm,
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

  constraints.push(limit(60));

  const q = query(collection(db, "products"), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product);
}

export async function getProductById(id: string): Promise<Product | null> {
  const snap = await getDoc(doc(db, "products", id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Product) : null;
}
