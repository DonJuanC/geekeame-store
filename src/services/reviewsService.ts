import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Review, ReviewInput } from "../types/review";

// Id determinístico "productId_userId" en vez de uno autogenerado: un mismo
// usuario solo puede tener UNA review por producto, así que volver a
// calificar el mismo producto pisa (setDoc) la review anterior en vez de
// crear un duplicado. Evita tener que hacer una query extra para chequear
// "¿ya calificó este producto?" antes de escribir.
function reviewDocId(productId: string, userId: string): string {
  return `${productId}_${userId}`;
}

export async function upsertReview(
  productId: string,
  userId: string,
  userEmail: string,
  input: ReviewInput,
): Promise<void> {
  const ref = doc(db, "reviews", reviewDocId(productId, userId));
  await setDoc(ref, {
    productId,
    userId,
    userEmail,
    rating: input.rating,
    comment: input.comment.trim(),
    createdAt: Date.now(),
  });
}

export async function listReviewsForProduct(
  productId: string,
): Promise<Review[]> {
  const q = query(
    collection(db, "reviews"),
    where("productId", "==", productId),
    orderBy("createdAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Review);
}

export interface ReviewSummary {
  average: number;
  count: number;
}

// Promedio calculado en el cliente sobre la lista ya traída por
// listReviewsForProduct, en vez de mantener un contador agregado en el doc
// del producto: para el volumen de este catálogo (unas pocas reviews por
// producto) evita la complejidad de mantener ese agregado consistente con
// una transacción en cada create/update/delete de review.
export function summarizeReviews(reviews: Review[]): ReviewSummary {
  if (reviews.length === 0) return { average: 0, count: 0 };
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return { average: sum / reviews.length, count: reviews.length };
}
