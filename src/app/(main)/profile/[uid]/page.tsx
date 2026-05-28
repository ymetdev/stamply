"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Package, ArrowLeftRight } from "lucide-react";
import { getUser } from "@/lib/firestore/users";
import { getPublicUserStamps } from "@/lib/firestore/stamps";
import { StampCard } from "@/components/stamps/StampCard";
import { TradeOfferModal } from "@/components/trade/TradeOfferModal";
import { getUserStamps } from "@/lib/firestore/stamps";
import { useAuthContext } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import type { User, Stamp } from "@/types";

export default function PublicProfilePage() {
  const { uid } = useParams<{ uid: string }>();
  const router = useRouter();
  const { firebaseUser, user: currentUser } = useAuthContext();

  const [owner, setOwner] = useState<User | null>(null);
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [myStamps, setMyStamps] = useState<Stamp[]>([]);
  const [offerTarget, setOfferTarget] = useState<Stamp | null>(null);
  const [loading, setLoading] = useState(true);

  const isOwnProfile = firebaseUser?.uid === uid;

  useEffect(() => {
    async function load() {
      const [userData, stampsData] = await Promise.all([
        getUser(uid),
        getPublicUserStamps(uid),
      ]);
      setOwner(userData);
      setStamps(stampsData);
      setLoading(false);
    }
    load();
  }, [uid]);

  useEffect(() => {
    if (firebaseUser) getUserStamps(firebaseUser.uid).then(setMyStamps);
  }, [firebaseUser]);

  async function handleSendOffer(offeredStampId: string, message: string) {
    if (!firebaseUser || !currentUser || !offerTarget) return;
    const { sendTradeRequest } = await import("@/lib/firestore/trades");
    await sendTradeRequest(
      firebaseUser.uid,
      currentUser.displayName || firebaseUser.displayName || "Collector",
      currentUser.photoURL ?? firebaseUser.photoURL ?? null,
      { toUserId: uid, offeredStampId, requestedStampId: offerTarget.id, message }
    );
    const { toast } = await import("sonner");
    toast.success("Trade offer sent!");
    setOfferTarget(null);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!owner) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground px-4">
        <p className="text-sm">User not found.</p>
        <button onClick={() => router.back()} className="mt-3 text-primary-500 text-sm font-medium">Go back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5 text-zinc-700" />
        </button>
        <h1 className="font-semibold text-zinc-900 truncate">{owner.displayName}</h1>
      </div>

      <div className="px-4 pt-5">
        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-border p-5 flex items-center gap-4 mb-5">
          {owner.photoURL ? (
            <Image src={owner.photoURL} alt={owner.displayName ?? ""} width={64} height={64} className="rounded-full" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-2xl font-bold text-primary-500">
              {owner.displayName?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-zinc-900">{owner.displayName ?? "Collector"}</p>
            {owner.bio && <p className="text-sm text-muted-foreground mt-0.5 truncate">{owner.bio}</p>}
            <p className="text-sm text-primary-500 font-medium mt-1">{owner.stampCount ?? 0} stamps in collection</p>
          </div>
        </div>

        {/* Action buttons (for other users) */}
        {!isOwnProfile && (
          <div className="flex gap-2 mb-5">
            <Link
              href={`/inventory/${uid}`}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm font-medium text-zinc-700 hover:bg-muted transition-colors"
            >
              <Package className="w-4 h-4" />
              View Inventory
            </Link>
            <Link
              href={`/trade`}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-semibold"
            >
              <ArrowLeftRight className="w-4 h-4" />
              Trade
            </Link>
          </div>
        )}

        {/* Public stamps preview */}
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-zinc-900">Public Stamps</p>
          {stamps.length > 4 && (
            <Link href={`/inventory/${uid}`} className="text-xs text-primary-500 font-medium">
              See all {stamps.length}
            </Link>
          )}
        </div>

        {stamps.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <span className="text-2xl mb-1">📭</span>
            <p className="text-xs">No public stamps yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 pb-6">
            {stamps.slice(0, 6).map((stamp) => (
              <StampCard
                key={stamp.id}
                stamp={stamp}
                isOwner={isOwnProfile}
                onTradeRequest={!isOwnProfile ? (s) => setOfferTarget(s) : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {offerTarget && (
        <TradeOfferModal
          requestedStamp={offerTarget}
          myStamps={myStamps.filter((s) => s.id !== offerTarget.id)}
          onSubmit={handleSendOffer}
          onClose={() => setOfferTarget(null)}
        />
      )}
    </div>
  );
}
