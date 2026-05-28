"use client";

import { useEffect, useState } from "react";
import { Plus, Loader2, ArrowLeftRight, Inbox, Send, List } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useAuthContext } from "@/context/AuthContext";
import { TradeOfferModal } from "@/components/trade/TradeOfferModal";
import {
  getOpenListings,
  getMyListings,
  getIncomingRequests,
  getOutgoingRequests,
  createListing,
  deleteListing,
  sendTradeRequest,
  acceptTradeRequest,
  declineTradeRequest,
} from "@/lib/firestore/trades";
import { getUserStamps, getStamp } from "@/lib/firestore/stamps";
import { cn } from "@/lib/utils";
import type { TradeListing, TradeRequest, Stamp } from "@/types";

type Tab = "listings" | "incoming" | "outgoing";

export default function TradePage() {
  const { firebaseUser, user } = useAuthContext();
  const [tab, setTab] = useState<Tab>("listings");
  const [listings, setListings] = useState<TradeListing[]>([]);
  const [incoming, setIncoming] = useState<TradeRequest[]>([]);
  const [outgoing, setOutgoing] = useState<TradeRequest[]>([]);
  const [myStamps, setMyStamps] = useState<Stamp[]>([]);
  const [stampCache, setStampCache] = useState<Record<string, Stamp>>({});
  const [loading, setLoading] = useState(true);
  const [showCreateListing, setShowCreateListing] = useState(false);
  const [offerTarget, setOfferTarget] = useState<Stamp | null>(null);
  const [offerListingId, setOfferListingId] = useState<string | undefined>();
  const [offerToUserId, setOfferToUserId] = useState<string>("");

  useEffect(() => {
    if (!firebaseUser) return;
    loadAll();
    getUserStamps(firebaseUser.uid).then(setMyStamps);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser]);

  async function loadAll() {
    if (!firebaseUser) return;
    setLoading(true);
    const [list, inc, out] = await Promise.all([
      getOpenListings(),
      getIncomingRequests(firebaseUser.uid),
      getOutgoingRequests(firebaseUser.uid),
    ]);
    setListings(list);
    setIncoming(inc);
    setOutgoing(out);

    // cache stamps referenced in listings + requests
    const ids = [
      ...list.map((l) => l.offeredStampId),
      ...inc.map((r) => [r.offeredStampId, r.requestedStampId]).flat(),
      ...out.map((r) => [r.offeredStampId, r.requestedStampId]).flat(),
    ];
    await cacheStamps([...new Set(ids)]);
    setLoading(false);
  }

  async function cacheStamps(ids: string[]) {
    const missing = ids.filter((id) => id && !stampCache[id]);
    if (missing.length === 0) return;
    const fetched = await Promise.all(missing.map(getStamp));
    const entries: Record<string, Stamp> = {};
    missing.forEach((id, i) => { if (fetched[i]) entries[id] = fetched[i]!; });
    setStampCache((prev) => ({ ...prev, ...entries }));
  }

  function stamp(id: string) { return stampCache[id]; }

  // ─── Create listing ────────────────────────────────────────────────────────
  const [listingForm, setListingForm] = useState({ offeredStampId: "", wantedDescription: "" });
  const [listingLoading, setListingLoading] = useState(false);

  async function handleCreateListing(e: React.FormEvent) {
    e.preventDefault();
    if (!firebaseUser || !user || !listingForm.offeredStampId || !listingForm.wantedDescription.trim()) return;
    setListingLoading(true);
    try {
      await createListing(
        firebaseUser.uid,
        user.displayName || firebaseUser.displayName || "Collector",
        user.photoURL ?? firebaseUser.photoURL ?? null,
        listingForm
      );
      toast.success("Listing posted!");
      setShowCreateListing(false);
      setListingForm({ offeredStampId: "", wantedDescription: "" });
      loadAll();
    } catch (err) {
      console.error(err);
      toast.error("Failed to post listing.");
    } finally {
      setListingLoading(false);
    }
  }

  // ─── Send offer ────────────────────────────────────────────────────────────
  async function handleSendOffer(offeredStampId: string, message: string) {
    if (!firebaseUser || !user || !offerTarget) return;
    await sendTradeRequest(
      firebaseUser.uid,
      user.displayName || firebaseUser.displayName || "Collector",
      user.photoURL ?? firebaseUser.photoURL ?? null,
      {
        toUserId: offerToUserId,
        offeredStampId,
        requestedStampId: offerTarget.id,
        listingId: offerListingId,
        message,
      }
    );
    toast.success("Offer sent!");
    loadAll();
  }

  // ─── Accept / Decline ──────────────────────────────────────────────────────
  async function handleAccept(req: TradeRequest) {
    try {
      await acceptTradeRequest(req.id, req.offeredStampId, req.requestedStampId, req.fromUserId, req.toUserId, req.listingId);
      toast.success("Trade accepted! Stamps swapped.");
      loadAll();
    } catch (err) {
      console.error(err);
      toast.error("Failed to accept trade.");
    }
  }

  async function handleDecline(req: TradeRequest) {
    await declineTradeRequest(req.id);
    setIncoming((prev) => prev.filter((r) => r.id !== req.id));
    toast.success("Request declined.");
  }

  const TABS: { key: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: "listings", label: "Listings", icon: <List className="w-4 h-4" /> },
    { key: "incoming", label: "Incoming", icon: <Inbox className="w-4 h-4" />, count: incoming.length },
    { key: "outgoing", label: "Outgoing", icon: <Send className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-zinc-900">Trade</h1>
        <button
          onClick={() => setShowCreateListing(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-primary-500 text-white text-sm font-semibold rounded-xl"
        >
          <Plus className="w-4 h-4" />
          List
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border bg-white">
        {TABS.map(({ key, label, icon, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors relative",
              tab === key ? "text-primary-500" : "text-muted-foreground"
            )}
          >
            {icon}
            {label}
            {count ? (
              <span className="absolute top-2 right-4 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {count}
              </span>
            ) : null}
            {tab === key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full" />}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        </div>
      ) : (
        <div className="px-4 py-4 space-y-3">

          {/* ── Listings tab ── */}
          {tab === "listings" && (
            listings.length === 0 ? (
              <Empty icon="🤝" text="No listings yet" sub="Be the first to post a trade!" />
            ) : (
              listings.map((listing) => {
                const s = stamp(listing.offeredStampId);
                const isOwn = listing.posterId === firebaseUser?.uid;
                return (
                  <div key={listing.id} className="bg-white rounded-2xl border border-border p-4">
                    <div className="flex gap-3">
                      {/* Stamp thumb */}
                      <div className="w-16 h-16 rounded-xl overflow-hidden relative bg-muted shrink-0">
                        {s?.imageURL ? (
                          <Image src={s.imageURL} alt={s.name} fill className="object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-2xl">📮</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-zinc-900 truncate">{s?.name ?? "—"}</p>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {listing.createdAt?.toDate ? formatDistanceToNow(listing.createdAt.toDate(), { addSuffix: true }) : ""}
                          </span>
                        </div>
                        <Link href={`/profile/${listing.posterId}`} className="text-xs text-muted-foreground mt-0.5 hover:text-primary-500">by {listing.posterName}</Link>
                        <p className="text-xs mt-1.5">
                          <span className="font-medium text-zinc-700">Looking for: </span>
                          <span className="text-zinc-600">{listing.wantedDescription}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      {isOwn ? (
                        <button
                          onClick={async () => { await deleteListing(listing.id); loadAll(); }}
                          className="flex-1 py-2 rounded-xl border border-border text-sm text-destructive font-medium"
                        >
                          Delete listing
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (!s) return;
                            setOfferTarget(s);
                            setOfferListingId(listing.id);
                            setOfferToUserId(listing.posterId);
                          }}
                          className="flex-1 py-2 rounded-xl bg-primary-500 text-white text-sm font-semibold flex items-center justify-center gap-1.5"
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                          Make Offer
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )
          )}

          {/* ── Incoming tab ── */}
          {tab === "incoming" && (
            incoming.length === 0 ? (
              <Empty icon="📬" text="No incoming requests" sub="When someone offers a trade, it'll show here." />
            ) : (
              incoming.map((req) => {
                const offered = stamp(req.offeredStampId);
                const requested = stamp(req.requestedStampId);
                return (
                  <div key={req.id} className="bg-white rounded-2xl border border-border p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      {req.fromUserPhotoURL ? (
                        <Image src={req.fromUserPhotoURL} alt={req.fromUserName} width={28} height={28} className="rounded-full" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-500">
                          {req.fromUserName[0]}
                        </div>
                      )}
                      <p className="text-sm font-medium text-zinc-900">{req.fromUserName}</p>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {req.createdAt?.toDate ? formatDistanceToNow(req.createdAt.toDate(), { addSuffix: true }) : ""}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <StampThumb stamp={offered} label="Offers" />
                      <ArrowLeftRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      <StampThumb stamp={requested} label="For your" />
                    </div>

                    {req.message && (
                      <p className="text-xs text-zinc-600 bg-muted rounded-xl px-3 py-2 italic">&ldquo;{req.message}&rdquo;</p>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDecline(req)}
                        className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-zinc-600"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleAccept(req)}
                        className="flex-1 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-semibold"
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                );
              })
            )
          )}

          {/* ── Outgoing tab ── */}
          {tab === "outgoing" && (
            outgoing.length === 0 ? (
              <Empty icon="📤" text="No outgoing requests" sub="Offers you've sent will appear here." />
            ) : (
              outgoing.map((req) => {
                const offered = stamp(req.offeredStampId);
                const requested = stamp(req.requestedStampId);
                const statusColor = req.status === "accepted"
                  ? "text-emerald-600 bg-emerald-50"
                  : req.status === "declined"
                  ? "text-red-600 bg-red-50"
                  : "text-amber-600 bg-amber-50";

                return (
                  <div key={req.id} className="bg-white rounded-2xl border border-border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-zinc-700">To: {req.toUserId.slice(0, 8)}…</p>
                      <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize", statusColor)}>
                        {req.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StampThumb stamp={offered} label="You offered" />
                      <ArrowLeftRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      <StampThumb stamp={requested} label="For" />
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>
      )}

      {/* Create listing modal */}
      {showCreateListing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-[480px] bg-white rounded-t-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-zinc-900">Post Trade Listing</h2>
              <button onClick={() => setShowCreateListing(false)} className="p-1 text-muted-foreground">✕</button>
            </div>
            <form onSubmit={handleCreateListing} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Stamp you&apos;re offering</label>
                {myStamps.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Add stamps to your inventory first.</p>
                ) : (
                  <select
                    required
                    value={listingForm.offeredStampId}
                    onChange={(e) => setListingForm((f) => ({ ...f, offeredStampId: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  >
                    <option value="">Select a stamp…</option>
                    {myStamps.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.country}, {s.year})</option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">What are you looking for?</label>
                <textarea
                  required
                  placeholder="e.g. Looking for a 1950s British Commonwealth stamp in Fine condition or better"
                  value={listingForm.wantedDescription}
                  onChange={(e) => setListingForm((f) => ({ ...f, wantedDescription: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={listingLoading || myStamps.length === 0}
                className="w-full py-3.5 rounded-xl bg-primary-500 text-white font-semibold text-sm disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {listingLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Post Listing
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Offer modal */}
      {offerTarget && (
        <TradeOfferModal
          requestedStamp={offerTarget}
          myStamps={myStamps.filter((s) => s.id !== offerTarget.id)}
          onSubmit={handleSendOffer}
          onClose={() => { setOfferTarget(null); setOfferListingId(undefined); }}
        />
      )}
    </div>
  );
}

function StampThumb({ stamp, label }: { stamp?: Stamp; label: string }) {
  return (
    <div className="flex-1 text-center">
      <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
      <div className="w-14 h-14 rounded-xl overflow-hidden relative bg-muted mx-auto">
        {stamp?.imageURL ? (
          <Image src={stamp.imageURL} alt={stamp.name} fill className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xl">📮</div>
        )}
      </div>
      <p className="text-xs font-medium text-zinc-800 mt-1 truncate">{stamp?.name ?? "—"}</p>
    </div>
  );
}

function Empty({ icon, text, sub }: { icon: string; text: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
      <span className="text-3xl mb-2">{icon}</span>
      <p className="text-sm font-medium text-zinc-700">{text}</p>
      <p className="text-xs mt-1">{sub}</p>
    </div>
  );
}
