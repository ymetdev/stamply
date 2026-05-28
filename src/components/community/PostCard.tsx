"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, MessageCircle, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { likePost, unlikePost } from "@/lib/firestore/posts";
import type { Post, Stamp } from "@/types";

interface PostCardProps {
  post: Post;
  liked: boolean;
  currentUid: string;
  attachedStamps?: Stamp[];
  onLikeToggle: (postId: string, liked: boolean) => void;
  onDelete?: (postId: string) => void;
  onCommentClick: (postId: string) => void;
}

export function PostCard({
  post,
  liked,
  currentUid,
  attachedStamps = [],
  onLikeToggle,
  onDelete,
  onCommentClick,
}: PostCardProps) {
  const [likeLoading, setLikeLoading] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);

  const allImages = [
    ...post.imageURLs,
    ...attachedStamps.filter((s) => s.imageURL).map((s) => s.imageURL),
  ];

  async function handleLike() {
    if (likeLoading) return;
    setLikeLoading(true);
    try {
      if (liked) {
        await unlikePost(post.id, currentUid);
      } else {
        await likePost(post.id, currentUid);
      }
      onLikeToggle(post.id, !liked);
    } finally {
      setLikeLoading(false);
    }
  }

  const createdAt = post.createdAt?.toDate?.() ?? new Date();

  return (
    <div className="bg-white border-b border-border">
      {/* Author row */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <Link href={`/profile/${post.authorId}`} className="flex items-center gap-2.5">
          {post.authorPhotoURL ? (
            <Image
              src={post.authorPhotoURL}
              alt={post.authorName}
              width={36}
              height={36}
              className="rounded-full"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center font-semibold text-primary-500 text-sm">
              {post.authorName[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-zinc-900 leading-tight">{post.authorName}</p>
            <p className="text-[11px] text-muted-foreground">
              {formatDistanceToNow(createdAt, { addSuffix: true })}
            </p>
          </div>
        </Link>

        {post.authorId === currentUid && onDelete && (
          <button
            onClick={() => onDelete(post.id)}
            className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content */}
      {post.content && (
        <p className="px-4 pb-3 text-sm text-zinc-800 whitespace-pre-wrap">{post.content}</p>
      )}

      {/* Images carousel */}
      {allImages.length > 0 && (
        <div className="relative w-full aspect-square bg-muted overflow-hidden">
          <Image
            src={allImages[imgIndex]}
            alt="post image"
            fill
            className="object-cover"
            sizes="480px"
          />
          {allImages.length > 1 && (
            <>
              <button
                onClick={() => setImgIndex((i) => Math.max(0, i - 1))}
                disabled={imgIndex === 0}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={() => setImgIndex((i) => Math.min(allImages.length - 1, i + 1))}
                disabled={imgIndex === allImages.length - 1}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {allImages.map((_, i) => (
                  <div
                    key={i}
                    className={cn("w-1.5 h-1.5 rounded-full", i === imgIndex ? "bg-white" : "bg-white/50")}
                  />
                ))}
              </div>
            </>
          )}
          {/* Attached stamp badge */}
          {attachedStamps.length > 0 && (
            <div className="absolute top-2 left-2 bg-primary-500/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
              📮 {attachedStamps.length} stamp{attachedStamps.length > 1 ? "s" : ""}
            </div>
          )}
        </div>
      )}

      {/* Attached stamps (text-only, no image) */}
      {attachedStamps.length > 0 && allImages.length === 0 && (
        <div className="mx-4 mb-3 flex flex-wrap gap-2">
          {attachedStamps.map((s) => (
            <span key={s.id} className="px-2.5 py-1 bg-primary-50 text-primary-600 text-xs font-medium rounded-full border border-primary-100">
              📮 {s.name}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-5 px-4 py-3">
        <button
          onClick={handleLike}
          disabled={likeLoading}
          className="flex items-center gap-1.5 text-sm text-muted-foreground"
        >
          <Heart
            className={cn("w-5 h-5 transition-colors", liked ? "fill-red-500 text-red-500" : "text-zinc-400")}
          />
          <span className={cn("font-medium", liked ? "text-red-500" : "")}>{post.likesCount}</span>
        </button>
        <button
          onClick={() => onCommentClick(post.id)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground"
        >
          <MessageCircle className="w-5 h-5 text-zinc-400" />
          <span className="font-medium">{post.commentsCount}</span>
        </button>
      </div>
    </div>
  );
}
