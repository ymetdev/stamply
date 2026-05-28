"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Send, Loader2, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useAuthContext } from "@/context/AuthContext";
import {
  getPost,
  getComments,
  addComment,
  deleteComment,
  likePost,
  unlikePost,
  isPostLiked,
} from "@/lib/firestore/posts";
import { cn } from "@/lib/utils";
import type { Post, Comment } from "@/types";

export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const router = useRouter();
  const { firebaseUser, user } = useAuthContext();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      if (!firebaseUser) return;
      const [postData, commentsData, likedStatus] = await Promise.all([
        getPost(postId),
        getComments(postId),
        isPostLiked(postId, firebaseUser.uid),
      ]);
      setPost(postData);
      setComments(commentsData);
      setLiked(likedStatus);
      setLoading(false);
    }
    load();
  }, [postId, firebaseUser]);

  async function handleLike() {
    if (!firebaseUser || !post) return;
    if (liked) {
      await unlikePost(post.id, firebaseUser.uid);
      setPost((p) => p ? { ...p, likesCount: p.likesCount - 1 } : p);
    } else {
      await likePost(post.id, firebaseUser.uid);
      setPost((p) => p ? { ...p, likesCount: p.likesCount + 1 } : p);
    }
    setLiked((v) => !v);
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || !firebaseUser || !user || !post) return;
    setSubmitting(true);
    try {
      const id = await addComment(post.id, firebaseUser.uid, user.displayName, user.photoURL, commentText.trim());
      const newComment: Comment = {
        id,
        postId: post.id,
        authorId: firebaseUser.uid,
        authorName: user.displayName,
        authorPhotoURL: user.photoURL,
        content: commentText.trim(),
        createdAt: { toDate: () => new Date() } as never,
      };
      setComments((prev) => [...prev, newComment]);
      setPost((p) => p ? { ...p, commentsCount: p.commentsCount + 1 } : p);
      setCommentText("");
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch {
      toast.error("Failed to post comment.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!post) return;
    await deleteComment(post.id, commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setPost((p) => p ? { ...p, commentsCount: p.commentsCount - 1 } : p);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground px-4">
        <p className="text-sm">Post not found.</p>
        <button onClick={() => router.back()} className="mt-3 text-primary-500 text-sm font-medium">Go back</button>
      </div>
    );
  }

  const createdAt = post.createdAt?.toDate?.() ?? new Date();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5 text-zinc-700" />
        </button>
        <h1 className="font-semibold text-zinc-900">Post</h1>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {/* Post header */}
        <div className="px-4 pt-4 pb-2 flex items-center gap-2.5">
          {post.authorPhotoURL ? (
            <Image src={post.authorPhotoURL} alt={post.authorName} width={40} height={40} className="rounded-full" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center font-semibold text-primary-500">
              {post.authorName[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-semibold text-sm text-zinc-900">{post.authorName}</p>
            <p className="text-xs text-muted-foreground">{formatDistanceToNow(createdAt, { addSuffix: true })}</p>
          </div>
        </div>

        {post.content && (
          <p className="px-4 pb-3 text-sm text-zinc-800 whitespace-pre-wrap">{post.content}</p>
        )}

        {post.imageURLs?.[0] && (
          <div className="relative w-full aspect-square bg-muted">
            <Image src={post.imageURLs[0]} alt="post" fill className="object-cover" sizes="480px" />
          </div>
        )}

        {/* Like row */}
        <div className="px-4 py-3 flex items-center gap-4 border-b border-border">
          <button onClick={handleLike} className="flex items-center gap-1.5">
            <Heart className={cn("w-5 h-5", liked ? "fill-red-500 text-red-500" : "text-zinc-400")} />
            <span className={cn("text-sm font-medium", liked ? "text-red-500" : "text-muted-foreground")}>
              {post.likesCount}
            </span>
          </button>
          <span className="text-sm text-muted-foreground">{post.commentsCount} comments</span>
        </div>

        {/* Comments */}
        <div className="divide-y divide-border">
          {comments.map((c) => {
            const cDate = c.createdAt?.toDate?.() ?? new Date();
            return (
              <div key={c.id} className="px-4 py-3 flex gap-2.5">
                {c.authorPhotoURL ? (
                  <Image src={c.authorPhotoURL} alt={c.authorName} width={32} height={32} className="rounded-full shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center font-semibold text-primary-500 text-xs shrink-0">
                    {c.authorName[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-zinc-900">{c.authorName}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] text-muted-foreground">{formatDistanceToNow(cDate, { addSuffix: true })}</p>
                      {c.authorId === firebaseUser?.uid && (
                        <button onClick={() => handleDeleteComment(c.id)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-zinc-700 mt-0.5 whitespace-pre-wrap">{c.content}</p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Comment input */}
      <form
        onSubmit={handleComment}
        className="fixed bottom-[72px] left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-border px-4 py-2.5 flex gap-2 items-center"
      >
        <input
          type="text"
          placeholder="Write a comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          className="flex-1 text-sm py-2 px-3 rounded-full border border-border focus:outline-none focus:ring-2 focus:ring-primary-500 bg-muted"
        />
        <button
          type="submit"
          disabled={!commentText.trim() || submitting}
          className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center disabled:opacity-40"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <Send className="w-4 h-4 text-white" />
          )}
        </button>
      </form>
    </div>
  );
}
