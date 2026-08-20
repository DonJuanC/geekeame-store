import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  getDocs,
  query,
  updateDoc,
  where,
  doc,
} from "firebase/firestore";
import { db } from "./firebase";
import type { FavoriteList } from "../types/favoriteList";

const DEFAULT_LIST_NAME = "Mis favoritos";

export async function getOrCreateFavoriteList(userId: string): Promise<FavoriteList> {
  const q = query(collection(db, "favoriteLists"), where("userId", "==", userId));
  const snap = await getDocs(q);
  if (!snap.empty) {
    const lists = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as FavoriteList)
      .sort((a, b) => a.createdAt - b.createdAt);
    return lists[0];
  }

  const createdAt = Date.now();
  const ref = await addDoc(collection(db, "favoriteLists"), {
    userId,
    name: DEFAULT_LIST_NAME,
    productIds: [],
    createdAt,
  });
  return { id: ref.id, userId, name: DEFAULT_LIST_NAME, productIds: [], createdAt };
}

export async function addProductToList(listId: string, productId: string): Promise<void> {
  await updateDoc(doc(db, "favoriteLists", listId), {
    productIds: arrayUnion(productId),
    updatedAt: Date.now(),
  });
}

export async function removeProductFromList(listId: string, productId: string): Promise<void> {
  await updateDoc(doc(db, "favoriteLists", listId), {
    productIds: arrayRemove(productId),
    updatedAt: Date.now(),
  });
}
