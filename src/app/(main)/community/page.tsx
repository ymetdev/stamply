"use client";

import { useEffect, useState, useCallback } from "react";
import { PenSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuthContext } from "@/context/AuthContext";
import { PostCard } from "@/components/community/PostCard";
import { CreatePost } from "@/components/community/CreatePost";
import { getPosts, createPost, deletePost, getLikedPostIds } from "@/lib/firestore/posts";
import { compressImage } from "@/lib/utils";
import { getUserStamps, getStamp } from "@/lib/firestore/stamps";
import { useRouter } from "next/navigation";
import type { Post, Stamp } from "@/types";
import type { DocumentSnapshot } from "firebase/firestore";

export default function CommunityPage() {
  const { firebaseUser, user } = useAuthContext();
  const router = useRouter();

  const [posts, setPosts] = useState<Post[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [stampCache, setStampCache] = useState<Record<string, Stamp>>({});
  const [userStamps, setUserStamps] = useState<Stamp[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    if (!firebaseUser) return;
    setLoading(true);
    const { posts: fetched, lastDoc: last } = await getPosts();
    setPosts(fetched);
    setLastDoc(last);
    setHasMore(fetched.length === 10);

    // fetch liked status + attached stamps
    const liked = await getLikedPostIds(fetched.map((p) => p.id), firebaseUser.uid);
    setLikedIds(liked);
    await cacheStamps(fetched);
    setLoading(false);
  }, [firebaseUser]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    if (firebaseUser) {
      getUserStamps(firebaseUser.uid).then(setUserStamps);
    }
  }, [firebaseUser]);

  async function cacheStamps(newPosts: Post[]) {
    const ids = newPosts.flatMap((p) => p.attachedStampIds ?? []);
    const unique = [...new Set(ids)];
    const missing = unique.filter((id) => !stampCache[id]);
    if (missing.length === 0) return;
    const fetched = await Promise.all(missing.map(getStamp));
    const entries: Record<string, Stamp> = {};
    missing.forEach((id, i) => { if (fetched[i]) entries[id] = fetched[i]!; });
    setStampCache((prev) => ({ ...prev, ...entries }));
  }

  async function loadMore() {
    if (!lastDoc || loadingMore || !firebaseUser) return;
    setLoadingMore(true);
    const { posts: more, lastDoc: newLast } = await getPosts(lastDoc);
    setPosts((prev) => [...prev, ...more]);
    setLastDoc(newLast);
    setHasMore(more.length === 10);
    const liked = await getLikedPostIds(more.map((p) => p.id), firebaseUser.uid);
    setLikedIds((prev) => new Set([...prev, ...liked]));
    await cacheStamps(more);
    setLoadingMore(false);
  }

  async function handleCreate(data: { content: string; imageFiles: File[]; attachedStampIds: string[] }) {
    if (!firebaseUser || !user) return;
    try {
      const imageURLs = await Promise.all(
        data.imageFiles.map((f) => compressImage(f))
      );
      const authorName = user.displayName || firebaseUser.displayName || "Collector";
      const authorPhotoURL = user.photoURL ?? firebaseUser.photoURL ?? null;
      await createPost(firebaseUser.uid, authorName, authorPhotoURL, {
        content: data.content,
        imageURLs,
        attachedStampIds: data.attachedStampIds,
      });
      toast.success("Post shared!");
      loadPosts();
    } catch (err) {
      console.error("[createPost error]", err);
      toast.error("Failed to post. Please try again.");
    }
  }

  async function handleDelete(postId: string) {
    try {
      await deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      toast.success("Post deleted.");
    } catch {
      toast.error("Failed to delete post.");
    } finally {
      setConfirmDeleteId(null);
    }
  }

  function handleLikeToggle(postId: string, nowLiked: boolean) {
    setLikedIds((prev) => {
      const next = new Set(prev);
      nowLiked ? next.add(postId) : next.delete(postId);
      return next;
    });
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, likesCount: p.likesCount + (nowLiked ? 1 : -1) } : p
      )
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-zinc-900">Community</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-primary-500 text-white text-sm font-semibold rounded-xl"
        >
          <PenSquare className="w-4 h-4" />
          Post
        </button>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <span className="text-4xl mb-3">💬</span>
          <p className="text-sm font-medium">No posts yet</p>
          <p className="text-xs mt-1">Be the first to share something!</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-xl"
          >
            Create a post
          </button>
        </div>
      ) : (
        <div>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              liked={likedIds.has(post.id)}
              currentUid={firebaseUser?.uid ?? ""}
              attachedStamps={post.attachedStampIds?.map((id) => stampCache[id]).filter(Boolean) as Stamp[]}
              onLikeToggle={handleLikeToggle}
              onDelete={(id) => setConfirmDeleteId(id)}
              onCommentClick={(id) => router.push(`/community/${id}`)}
            />
          ))}

          {hasMore && (
            <div className="flex justify-center py-6">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-zinc-600 disabled:opacity-50"
              >
                {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
                Load more
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create post */}
      {showCreate && (
        <CreatePost
          userStamps={userStamps}
          onSubmit={handleCreate}
          onClose={() => setShowCreate(false)}
        />
      )}

      {/* Delete confirm */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl">
            <h3 className="font-semibold text-zinc-900 mb-1">Delete post?</h3>
            <p className="text-sm text-muted-foreground mb-4">This cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="flex-1 py-2.5 rounded-xl bg-destructive text-white text-sm font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
