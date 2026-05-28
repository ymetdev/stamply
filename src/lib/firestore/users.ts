import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { User } from "@/types";

export async function getUser(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? ({ uid, ...snap.data() } as User) : null;
}

export async function createUser(
  uid: string,
  data: Pick<User, "displayName" | "photoURL" | "email">
) {
  await setDoc(doc(db, "users", uid), {
    ...data,
    bio: "",
    stampCount: 0,
    createdAt: serverTimestamp(),
  });
}

export async function updateUser(uid: string, data: Partial<Pick<User, "displayName" | "bio" | "photoURL">>) {
  await updateDoc(doc(db, "users", uid), data);
}
