import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { TradeListing, TradeRequest } from "@/types";

// ─── Trade Listings ────────────────────────────────────────────────────────────

export async function createListing(
  uid: string,
  posterName: string,
  posterPhotoURL: string | null,
  data: { offeredStampId: string; wantedDescription: string }
): Promise<string> {
  const ref = await addDoc(collection(db, "trade_listings"), {
    ...data,
    posterId: uid,
    posterName,
    posterPhotoURL,
    status: "open",
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function closeListing(listingId: string) {
  await updateDoc(doc(db, "trade_listings", listingId), { status: "closed" });
}

export async function deleteListing(listingId: string) {
  await deleteDoc(doc(db, "trade_listings", listingId));
}

export async function getOpenListings(): Promise<TradeListing[]> {
  const q = query(
    collection(db, "trade_listings"),
    where("status", "==", "open"),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as TradeListing));
}

export async function getMyListings(uid: string): Promise<TradeListing[]> {
  const q = query(
    collection(db, "trade_listings"),
    where("posterId", "==", uid),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as TradeListing));
}

// ─── Trade Requests ────────────────────────────────────────────────────────────

export async function sendTradeRequest(
  fromUserId: string,
  fromUserName: string,
  fromUserPhotoURL: string | null,
  data: {
    toUserId: string;
    offeredStampId: string;
    requestedStampId: string;
    listingId?: string;
    message?: string;
  }
): Promise<string> {
  const ref = await addDoc(collection(db, "trade_requests"), {
    ...data,
    fromUserId,
    fromUserName,
    fromUserPhotoURL,
    status: "pending",
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function acceptTradeRequest(
  requestId: string,
  offeredStampId: string,
  requestedStampId: string,
  fromUserId: string,
  toUserId: string,
  listingId?: string
) {
  // Swap ownership of both stamps atomically-ish
  await Promise.all([
    updateDoc(doc(db, "stamps", offeredStampId), { ownerId: toUserId }),
    updateDoc(doc(db, "stamps", requestedStampId), { ownerId: fromUserId }),
    updateDoc(doc(db, "trade_requests", requestId), { status: "accepted" }),
  ]);
  if (listingId) {
    await updateDoc(doc(db, "trade_listings", listingId), { status: "closed" });
  }
}

export async function declineTradeRequest(requestId: string) {
  await updateDoc(doc(db, "trade_requests", requestId), { status: "declined" });
}

export async function getIncomingRequests(uid: string): Promise<TradeRequest[]> {
  const q = query(
    collection(db, "trade_requests"),
    where("toUserId", "==", uid),
    where("status", "==", "pending"),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as TradeRequest));
}

export async function getOutgoingRequests(uid: string): Promise<TradeRequest[]> {
  const q = query(
    collection(db, "trade_requests"),
    where("fromUserId", "==", uid),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as TradeRequest));
}
