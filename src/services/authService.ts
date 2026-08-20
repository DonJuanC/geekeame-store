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

export async function signInWithGoogle(): Promise<UserProfile> {
  try {
    const cred = await signInWithPopup(auth, new GoogleAuthProvider());
    return ensureUserProfile(cred.user.uid, cred.user.email ?? "");
  } catch (err) {
    console.error("[GoogleAuth] signInWithPopup falló:", err);
    throw err;
  }
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function fetchUserProfile(
  uid: string,
): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}
