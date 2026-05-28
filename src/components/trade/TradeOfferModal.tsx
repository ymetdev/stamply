"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Loader2, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Stamp } from "@/types";

interface TradeOfferModalProps {
  requestedStamp: Stamp;
  myStamps: Stamp[];
  onSubmit: (offeredStampId: string, message: string) => Promise<void>;
  onClose: () => void;
}

export function TradeOfferModal({ requestedStamp, myStamps, onSubmit, onClose }: TradeOfferModalProps) {
  const [selectedStampId, setSelectedStampId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!selectedStampId) return;
    setLoading(true);
    try {
      await onSubmit(selectedStampId, message);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-[480px] bg-white rounded-t-3xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border shrink-0">
          <h2 className="font-semibold text-zinc-900">Send Trade Offer</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted">
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-4 py-4 space-y-5">
          {/* Trade visual */}
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-muted rounded-xl p-3 text-center">
              <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wide">You offer</p>
              {selectedStampId ? (
                (() => {
                  const s = myStamps.find((s) => s.id === selectedStampId);
                  return s ? (
                    <div>
                      <div className="w-16 h-16 rounded-lg overflow-hidden relative mx-auto mb-1">
                        {s.imageURL ? (
                          <Image src={s.imageURL} alt={s.name} fill className="object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-2xl bg-white">📮</div>
                        )}
                      </div>
                      <p className="text-xs font-medium text-zinc-900 truncate">{s.name}</p>
                    </div>
                  ) : null;
                })()
              ) : (
                <div className="w-16 h-16 rounded-lg bg-white border-2 border-dashed border-border mx-auto flex items-center justify-center text-muted-foreground text-2xl">
                  ?
                </div>
              )}
            </div>

            <ArrowLeftRight className="w-5 h-5 text-muted-foreground shrink-0" />

            <div className="flex-1 bg-primary-50 rounded-xl p-3 text-center border border-primary-100">
              <p className="text-[10px] font-semibold text-primary-500 mb-2 uppercase tracking-wide">They have</p>
              <div className="w-16 h-16 rounded-lg overflow-hidden relative mx-auto mb-1">
                {requestedStamp.imageURL ? (
                  <Image src={requestedStamp.imageURL} alt={requestedStamp.name} fill className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-2xl bg-white">📮</div>
                )}
              </div>
              <p className="text-xs font-medium text-zinc-900 truncate">{requestedStamp.name}</p>
            </div>
          </div>

          {/* Pick stamp */}
          <div>
            <p className="text-sm font-semibold text-zinc-900 mb-2">Choose a stamp to offer</p>
            {myStamps.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">You have no stamps to offer.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {myStamps.map((stamp) => (
                  <button
                    key={stamp.id}
                    onClick={() => setSelectedStampId(stamp.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-2.5 rounded-xl border transition-colors text-left",
                      selectedStampId === stamp.id
                        ? "border-primary-500 bg-primary-50"
                        : "border-border hover:bg-muted"
                    )}
                  >
                    <div className="w-11 h-11 rounded-lg overflow-hidden relative shrink-0 bg-muted">
                      {stamp.imageURL ? (
                        <Image src={stamp.imageURL} alt={stamp.name} fill className="object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-xl">📮</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 truncate">{stamp.name}</p>
                      <p className="text-xs text-muted-foreground">{stamp.country} · {stamp.year}</p>
                    </div>
                    {selectedStampId === stamp.id && (
                      <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center shrink-0">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Message */}
          <div>
            <p className="text-sm font-semibold text-zinc-900 mb-2">Message <span className="text-muted-foreground font-normal">(optional)</span></p>
            <textarea
              placeholder="Say something to the owner..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
        </div>

        <div className="px-4 pt-4 pb-[88px] border-t border-border shrink-0">
          <button
            onClick={handleSubmit}
            disabled={!selectedStampId || loading}
            className="w-full py-3.5 rounded-xl bg-primary-500 text-white font-semibold text-sm disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Send Offer
          </button>
        </div>
      </div>
    </div>
  );
}
