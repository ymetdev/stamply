"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUser, createUser, updateUser } from "@/lib/firestore/users";
import type { User } from "@/types";

export function useAuth() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        let profile = await getUser(fbUser.uid);
        if (!profile) {
          await createUser(fbUser.uid, {
            displayName: fbUser.displayName ?? "",
            photoURL: fbUser.photoURL,
            email: fbUser.email ?? "",
          });
          profile = await getUser(fbUser.uid);
        } else if (!profile.displayName && fbUser.displayName) {
          // Fix stale Firestore doc that was created before updateProfile completed
          await updateUser(fbUser.uid, {
            displayName: fbUser.displayName,
            photoURL: fbUser.photoURL,
          });
          profile = { ...profile, displayName: fbUser.displayName, photoURL: fbUser.photoURL };
        }
        setUser(profile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { firebaseUser, user, loading };
}
