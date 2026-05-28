import {
  collection,
  doc,
  addDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Stamp } from "@/types";

export async function addStamp(
  uid: string,
  ownerName: string,
  ownerPhotoURL: string | null,
  data: Omit<Stamp, "id" | "ownerId" | "ownerName" | "ownerPhotoURL" | "createdAt">
): Promise<string> {
  const docRef = await addDoc(collection(db, "stamps"), {
    ...data,
    ownerId: uid,
    ownerName,
    ownerPhotoURL,
    createdAt: serverTimestamp(),
  });
  await setDoc(doc(db, "users", uid), { stampCount: increment(1) }, { merge: true });
  return docRef.id;
}

export async function updateStamp(
  stampId: string,
  data: Partial<Pick<Stamp, "name" | "country" | "year" | "condition" | "description" | "isPublic" | "imageURL">>
) {
  await updateDoc(doc(db, "stamps", stampId), data);
}

export async function deleteStamp(stampId: string, ownerId: string) {
  await deleteDoc(doc(db, "stamps", stampId));
  await setDoc(doc(db, "users", ownerId), { stampCount: increment(-1) }, { merge: true });
}

export async function getStamp(stampId: string): Promise<Stamp | null> {
  const snap = await getDoc(doc(db, "stamps", stampId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Stamp) : null;
}

export async function getUserStamps(uid: string): Promise<Stamp[]> {
  const q = query(
    collection(db, "stamps"),
    where("ownerId", "==", uid),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Stamp));
}

export async function getPublicUserStamps(uid: string): Promise<Stamp[]> {
  const q = query(
    collection(db, "stamps"),
    where("ownerId", "==", uid),
    where("isPublic", "==", true),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Stamp));
}
