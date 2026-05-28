"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getPublicUserStamps, getUserStamps } from "@/lib/firestore/stamps";
import { getUser } from "@/lib/firestore/users";
import { TradeOfferModal } from "@/components/trade/TradeOfferModal";
import { StampCard } from "@/components/stamps/StampCard";
import { useAuthContext } from "@/context/AuthContext";
import type { Stamp, User } from "@/types";

export default function UserInventoryPage() {
  const { uid } = useParams<{ uid: string }>();
  const router = useRouter();
  const { firebaseUser } = useAuthContext();
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [owner, setOwner] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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

  const isOwnProfile = firebaseUser?.uid === uid;
  const { user } = useAuthContext();

  const [offerTarget, setOfferTarget] = useState<Stamp | null>(null);
  const [myStamps, setMyStamps] = useState<Stamp[]>([]);

  useEffect(() => {
    if (firebaseUser) getUserStamps(firebaseUser.uid).then(setMyStamps);
  }, [firebaseUser]);

  async function handleSendOffer(offeredStampId: string, message: string) {
    if (!firebaseUser || !user) return;
    const { sendTradeRequest } = await import("@/lib/firestore/trades");
    await sendTradeRequest(
      firebaseUser.uid,
      user.displayName || firebaseUser.displayName || "Collector",
      user.photoURL ?? firebaseUser.photoURL ?? null,
      { toUserId: uid, offeredStampId, requestedStampId: offerTarget!.id, message }
    );
    const { toast } = await import("sonner");
    toast.success("Trade offer sent!");
    setOfferTarget(null);
  }

  return (
    <div className="px-4 pt-6">
      {/* Back */}
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Owner info */}
      {owner && (
        <div className="flex items-center gap-3 mb-5">
          {owner.photoURL ? (
            <Image src={owner.photoURL} alt={owner.displayName} width={48} height={48} className="rounded-full" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-500 text-lg">
              {owner.displayName[0].toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-semibold text-zinc-900">{owner.displayName}</p>
            <p className="text-sm text-muted-foreground">{stamps.length} public stamps</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-muted rounded-2xl aspect-square animate-pulse" />
          ))}
        </div>
      ) : stamps.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
          <span className="text-3xl mb-2">📭</span>
          <p className="text-sm">No public stamps yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 pb-4">
          {stamps.map((stamp) => (
            <StampCard
              key={stamp.id}
              stamp={stamp}
              isOwner={isOwnProfile}
              onTradeRequest={!isOwnProfile ? (s) => setOfferTarget(s) : undefined}
            />
          ))}
        </div>
      )}

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
