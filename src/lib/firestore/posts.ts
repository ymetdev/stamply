import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  increment,
  setDoc,
  deleteField,
  type DocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Post, Comment } from "@/types";

const PAGE_SIZE = 10;

export async function createPost(
  uid: string,
  authorName: string,
  authorPhotoURL: string | null,
  data: { content: string; imageURLs: string[]; attachedStampIds: string[] }
): Promise<string> {
  const ref = await addDoc(collection(db, "posts"), {
    ...data,
    authorId: uid,
    authorName,
    authorPhotoURL,
    likesCount: 0,
    commentsCount: 0,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deletePost(postId: string) {
  await deleteDoc(doc(db, "posts", postId));
}

export async function getPosts(cursor?: DocumentSnapshot): Promise<{ posts: Post[]; lastDoc: DocumentSnapshot | null }> {
  const constraints = cursor
    ? [orderBy("createdAt", "desc"), startAfter(cursor), limit(PAGE_SIZE)]
    : [orderBy("createdAt", "desc"), limit(PAGE_SIZE)];

  const q = query(collection(db, "posts"), ...constraints);
  const snap = await getDocs(q);
  const posts = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Post));
  const lastDoc = snap.docs[snap.docs.length - 1] ?? null;
  return { posts, lastDoc };
}

export async function getPost(postId: string): Promise<Post | null> {
  const snap = await getDoc(doc(db, "posts", postId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Post) : null;
}

// Likes — stored as subcollection posts/{id}/likes/{uid}
export async function likePost(postId: string, uid: string) {
  await setDoc(doc(db, "posts", postId, "likes", uid), { uid });
  await updateDoc(doc(db, "posts", postId), { likesCount: increment(1) });
}

export async function unlikePost(postId: string, uid: string) {
  await deleteDoc(doc(db, "posts", postId, "likes", uid));
  await updateDoc(doc(db, "posts", postId), { likesCount: increment(-1) });
}

export async function isPostLiked(postId: string, uid: string): Promise<boolean> {
  const snap = await getDoc(doc(db, "posts", postId, "likes", uid));
  return snap.exists();
}

export async function getLikedPostIds(postIds: string[], uid: string): Promise<Set<string>> {
  const checks = await Promise.all(
    postIds.map((id) => getDoc(doc(db, "posts", id, "likes", uid)))
  );
  return new Set(postIds.filter((_, i) => checks[i].exists()));
}

// Comments
export async function addComment(
  postId: string,
  uid: string,
  authorName: string,
  authorPhotoURL: string | null,
  content: string
): Promise<string> {
  const ref = await addDoc(collection(db, "posts", postId, "comments"), {
    postId,
    authorId: uid,
    authorName,
    authorPhotoURL,
    content,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, "posts", postId), { commentsCount: increment(1) });
  return ref.id;
}

export async function getComments(postId: string): Promise<Comment[]> {
  const q = query(
    collection(db, "posts", postId, "comments"),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Comment));
}

export async function deleteComment(postId: string, commentId: string) {
  await deleteDoc(doc(db, "posts", postId, "comments", commentId));
  await updateDoc(doc(db, "posts", postId), { commentsCount: increment(-1) });
}

// suppress unused import warning
void deleteField;
