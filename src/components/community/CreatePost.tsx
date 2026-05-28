"use client";

import { useState, useRef } from "react";
import { X, ImagePlus, Stamp, Loader2, XCircle } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Stamp as StampType } from "@/types";

interface CreatePostProps {
  userStamps: StampType[];
  onSubmit: (data: { content: string; imageFiles: File[]; attachedStampIds: string[] }) => Promise<void>;
  onClose: () => void;
}

export function CreatePost({ userStamps, onSubmit, onClose }: CreatePostProps) {
  const [content, setContent] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedStampIds, setSelectedStampIds] = useState<string[]>([]);
  const [showStampPicker, setShowStampPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const valid = files.filter((f) => f.size <= 5 * 1024 * 1024).slice(0, 4 - imageFiles.length);
    setImageFiles((prev) => [...prev, ...valid]);
    setImagePreviews((prev) => [...prev, ...valid.map((f) => URL.createObjectURL(f))]);
  }

  function removeImage(i: number) {
    setImageFiles((prev) => prev.filter((_, idx) => idx !== i));
    setImagePreviews((prev) => prev.filter((_, idx) => idx !== i));
  }

  function toggleStamp(stampId: string) {
    setSelectedStampIds((prev) =>
      prev.includes(stampId) ? prev.filter((id) => id !== stampId) : [...prev, stampId]
    );
  }

  async function handleSubmit() {
    if (!content.trim() && imageFiles.length === 0 && selectedStampIds.length === 0) return;
    setLoading(true);
    try {
      await onSubmit({ content, imageFiles, attachedStampIds: selectedStampIds });
      onClose();
    } catch {
      // error already shown via toast in parent
    } finally {
      setLoading(false);
    }
  }

  const canPost = content.trim() || imageFiles.length > 0 || selectedStampIds.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-[480px] bg-white rounded-t-3xl max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border shrink-0">
          <button onClick={onClose} className="text-sm text-muted-foreground font-medium">Cancel</button>
          <h2 className="font-semibold text-zinc-900">New Post</h2>
          <button
            onClick={handleSubmit}
            disabled={!canPost || loading}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-primary-500 text-white text-sm font-semibold rounded-full disabled:opacity-40"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Post
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-4 py-4 space-y-4">
          {/* Text area */}
          <textarea
            autoFocus
            placeholder="What's on your mind? Share a stamp, a find, or a story..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="w-full text-sm text-zinc-900 placeholder:text-muted-foreground focus:outline-none resize-none"
          />

          {/* Image previews */}
          {imagePreviews.length > 0 && (
            <div className={cn("grid gap-2", imagePreviews.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
              {imagePreviews.map((src, i) => (
                <div key={i} className="relative rounded-xl overflow-hidden aspect-square bg-muted">
                  <Image src={src} alt="" fill className="object-cover" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-1.5 right-1.5 bg-black/60 rounded-full p-0.5"
                  >
                    <XCircle className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Attached stamps */}
          {selectedStampIds.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedStampIds.map((id) => {
                const stamp = userStamps.find((s) => s.id === id);
                if (!stamp) return null;
                return (
                  <div key={id} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 border border-primary-100 rounded-full">
                    <span className="text-xs font-medium text-primary-600">📮 {stamp.name}</span>
                    <button onClick={() => toggleStamp(id)}>
                      <X className="w-3 h-3 text-primary-400" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Stamp picker */}
          {showStampPicker && (
            <div className="border border-border rounded-2xl overflow-hidden">
              <div className="px-3 py-2 bg-muted text-xs font-semibold text-zinc-500">Select stamps to attach</div>
              {userStamps.length === 0 ? (
                <p className="px-3 py-4 text-sm text-muted-foreground text-center">No stamps in your inventory</p>
              ) : (
                <div className="max-h-48 overflow-y-auto divide-y divide-border">
                  {userStamps.map((stamp) => (
                    <button
                      key={stamp.id}
                      onClick={() => toggleStamp(stamp.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                        selectedStampIds.includes(stamp.id) ? "bg-primary-50" : "hover:bg-muted"
                      )}
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0 relative">
                        {stamp.imageURL ? (
                          <Image src={stamp.imageURL} alt={stamp.name} fill className="object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-lg">📮</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 truncate">{stamp.name}</p>
                        <p className="text-xs text-muted-foreground">{stamp.country} · {stamp.year}</p>
                      </div>
                      {selectedStampIds.includes(stamp.id) && (
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
          )}
        </div>

        {/* Bottom toolbar */}
        <div className="border-t border-border px-4 py-3 flex items-center gap-4 shrink-0 pb-safe">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={imageFiles.length >= 4}
            className="flex items-center gap-1.5 text-sm text-muted-foreground disabled:opacity-40"
          >
            <ImagePlus className="w-5 h-5" />
            <span className="text-xs">Photo</span>
          </button>
          <button
            onClick={() => setShowStampPicker((v) => !v)}
            className={cn("flex items-center gap-1.5 text-sm", showStampPicker ? "text-primary-500" : "text-muted-foreground")}
          >
            <Stamp className="w-5 h-5" />
            <span className="text-xs">Stamp</span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImages} />
        </div>
      </div>
    </div>
  );
}
