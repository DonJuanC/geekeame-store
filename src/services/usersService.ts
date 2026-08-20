import { collection, doc, getDocs, orderBy, query, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { UserProfile, UserRole } from "../types/auth";

// Listado para el panel admin de usuarios (/admin/users): sin filtro,
// ordenado por email para ubicar a alguien rápido en la tabla. Requiere
// que quien llama sea admin -- lo hace cumplir firestore.rules (users:
// allow read si es el dueño del doc o si el uid autenticado tiene
// role == "admin"), no esta función.
export async function listUsers(): Promise<UserProfile[]> {
  const q = query(collection(db, "users"), orderBy("email"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as UserProfile);
}

// Solo actualiza "role". firestore.rules exige exactamente eso -- un admin
// no puede tocar ningún otro campo del perfil de otro usuario, y la regla
// además bloquea que se cambie su propio rol desde acá (request.auth.uid
// != userId), para no auto-degradarse por error.
export async function updateUserRole(
  uid: string,
  role: UserRole,
): Promise<void> {
  await updateDoc(doc(db, "users", uid), { role });
}
