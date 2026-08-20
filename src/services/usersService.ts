import { collection, doc, getDocs, orderBy, query, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { UserProfile, UserRole } from "../types/auth";

export async function listUsers(): Promise<UserProfile[]> {
  const q = query(collection(db, "users"), orderBy("email"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as UserProfile);
}

export async function updateUserRole(
  uid: string,
  role: UserRole,
): Promise<void> {
  await updateDoc(doc(db, "users", uid), { role });
}
