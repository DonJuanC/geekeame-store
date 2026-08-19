import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import type { UserProfile } from "../types/auth";

// Exportada: AuthContext la necesita para el listener de onAuthStateChanged
// (ver nota ahí) -- crea el perfil en Firestore si todavía no existe.
export async function ensureUserProfile(
  uid: string,
  email: string,
): Promise<UserProfile> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data() as UserProfile;

  const profile: UserProfile = {
    uid,
    email,
    role: "customer",
    createdAt: Date.now(),
  };
  await setDoc(ref, profile);
  return profile;
}

export async function signUp(
  email: string,
  password: string,
): Promise<UserProfile> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return ensureUserProfile(cred.user.uid, cred.user.email ?? email);
}

export async function signIn(
  email: string,
  password: string,
): Promise<UserProfile> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return ensureUserProfile(cred.user.uid, cred.user.email ?? email);
}

// Volvimos a signInWithPopup. El problema real de signInWithRedirect no era
// el 503 de Hosting (eso sí estaba roto y ya se arregló aparte) sino que,
// incluso con Hosting funcionando, getRedirectResult() siempre volvía null:
// el marcador "firebase:pendingRedirect" en sessionStorage SÍ sobrevivía el
// viaje completo a Google y de vuelta (confirmado con logs en vivo), pero
// el iframe oculto que Firebase usa para relacionar el resultado
// (geekeame-store.firebaseapp.com/__/auth/iframe) tira una excepción JS
// (iframe.js:576) -- ese es el eslabón roto. signInWithPopup usa un camino
// distinto (la ventana emergente se comunica directo con esta pestaña, sin
// depender de ese relevo cross-origin tras una navegación completa), así
// que evita el problema en vez de perseguirlo.
export async function signInWithGoogle(): Promise<UserProfile> {
  try {
    const cred = await signInWithPopup(auth, new GoogleAuthProvider());
    return ensureUserProfile(cred.user.uid, cred.user.email ?? "");
  } catch (err) {
    // Log completo (code/message), no solo el objeto -- así se puede
    // diagnosticar sin adivinar si vuelve a fallar (ej. auth/popup-blocked,
    // auth/popup-closed-by-user, auth/unauthorized-domain).
    console.error("[GoogleAuth] signInWithPopup falló:", err);
    throw err;
  }
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

// Firebase no distingue en la respuesta si el email tiene cuenta o no --
// eso evita que este formulario se use para enumerar cuentas registradas.
// El mensaje que ve el usuario en LoginPage es siempre el mismo, exista o
// no la cuenta.
export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function fetchUserProfile(
  uid: string,
): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}
