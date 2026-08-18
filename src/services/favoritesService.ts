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

// Cada usuario tiene UNA sola lista de favoritos -- decisión explícita
// para simplificar la feature (nada de "crear/renombrar/eliminar listas").
// Se crea sola la primera vez que hace falta (primer click en el corazón,
// o primera visita a /favorites), sin ningún flujo de alta manual. Si por
// lo que sea hubiera más de un doc para el mismo userId (no debería pasar
// con este flujo, pero es un query sin unique constraint) se toma el más
// viejo y se ignoran los demás en vez de fallar.
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

// arrayUnion/arrayRemove en vez de leer+reescribir todo productIds: evita
// una condición de carrera si el mismo usuario togglea el mismo producto
// desde dos pestañas, y es una sola escritura atómica en Firestore.
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
