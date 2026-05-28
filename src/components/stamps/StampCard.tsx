"use client";

import Image from "next/image";
import { MoreVertical, Globe, Lock } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { Stamp } from "@/types";

const CONDITION_COLOR: Record<Stamp["condition"], string> = {
  Mint: "bg-emerald-100 text-emerald-700",
  "Near Mint": "bg-green-100 text-green-700",
  Fine: "bg-blue-100 text-blue-700",
  Good: "bg-yellow-100 text-yellow-700",
  Fair: "bg-orange-100 text-orange-700",
  Poor: "bg-red-100 text-red-700",
};

interface StampCardProps {
  stamp: Stamp;
  isOwner?: boolean;
  onEdit?: (stamp: Stamp) => void;
  onDelete?: (stamp: Stamp) => void;
  onTradeRequest?: (stamp: Stamp) => void;
  onClick?: (stamp: Stamp) => void;
}

export function StampCard({ stamp, isOwner, onEdit, onDelete, onTradeRequest, onClick }: StampCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm active:scale-[0.98] transition-transform"
      onClick={() => onClick?.(stamp)}
    >
      {/* Image */}
      <div className="relative w-full aspect-square bg-muted">
        {stamp.imageURL ? (
          <Image
            src={stamp.imageURL}
            alt={stamp.name}
            fill
            className="object-cover"
            sizes="(max-width: 480px) 50vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-3xl text-muted-foreground">
            📮
          </div>
        )}

        {/* Visibility badge */}
        <div className="absolute top-2 left-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
              stamp.isPublic ? "bg-white/90 text-zinc-600" : "bg-zinc-800/70 text-white"
            )}
          >
            {stamp.isPublic ? <Globe className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
            {stamp.isPublic ? "Public" : "Private"}
          </span>
        </div>

        {/* Owner menu */}
        {isOwner && (
          <div className="absolute top-2 right-2" ref={menuRef} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow-sm"
            >
              <MoreVertical className="w-3.5 h-3.5 text-zinc-700" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 bg-white border border-border rounded-xl shadow-lg z-10 min-w-[120px] overflow-hidden">
                <button
                  onClick={() => { onEdit?.(stamp); setMenuOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => { onDelete?.(stamp); setMenuOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-destructive hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}

        {/* Trade request button for non-owners */}
        {!isOwner && onTradeRequest && (
          <button
            onClick={(e) => { e.stopPropagation(); onTradeRequest(stamp); }}
            className="absolute bottom-2 right-2 px-2.5 py-1 bg-primary-500 text-white text-[10px] font-semibold rounded-lg shadow"
          >
            Trade
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="font-semibold text-zinc-900 text-sm truncate">{stamp.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {stamp.country} · {stamp.year}
        </p>
        <span className={cn("inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium", CONDITION_COLOR[stamp.condition])}>
          {stamp.condition}
        </span>
      </div>
    </div>
  );
}
