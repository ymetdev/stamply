"use client";

import { useAuthContext } from "@/context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { LogOut, Settings } from "lucide-react";
import Image from "next/image";

export default function ProfilePage() {
  const { user, firebaseUser } = useAuthContext();
  const router = useRouter();

  async function handleSignOut() {
    await signOut(auth);
    router.replace("/login");
  }

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-zinc-900">Profile</h1>
        <button className="p-2 rounded-xl bg-white border border-border">
          <Settings className="w-5 h-5 text-zinc-700" />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-border p-5 flex items-center gap-4 mb-4">
        {firebaseUser?.photoURL ? (
          <Image
            src={firebaseUser.photoURL}
            alt="avatar"
            width={64}
            height={64}
            className="rounded-full"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-2xl font-bold text-primary-500">
            {user?.displayName?.[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        <div>
          <p className="font-semibold text-zinc-900">{user?.displayName ?? "Collector"}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          <p className="text-sm text-primary-500 font-medium mt-0.5">{user?.stampCount ?? 0} stamps</p>
        </div>
      </div>

      <button
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Sign out
      </button>
    </div>
  );
}
