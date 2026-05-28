"use client";

import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { useAuthContext } from "@/context/AuthContext";
import { StampCard } from "@/components/stamps/StampCard";
import { StampForm, type StampFormData } from "@/components/stamps/StampForm";
import { getUserStamps, addStamp, updateStamp, deleteStamp } from "@/lib/firestore/stamps";
import { compressImage } from "@/lib/utils";
import type { Stamp } from "@/types";

export default function InventoryPage() {
  const { firebaseUser, user } = useAuthContext();
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStamp, setEditingStamp] = useState<Stamp | null>(null);
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Stamp | null>(null);

  useEffect(() => {
    if (!firebaseUser) return;
    getUserStamps(firebaseUser.uid).then((data) => {
      setStamps(data);
      setLoading(false);
    });
  }, [firebaseUser]);

  const filtered = stamps.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.country.toLowerCase().includes(search.toLowerCase())
  );

  async function handleAdd(data: StampFormData, imageFile?: File) {
    if (!firebaseUser || !user) return;
    try {
      let imageURL = "";
      if (imageFile) {
        imageURL = await compressImage(imageFile);
      }
      const ownerName = user.displayName || firebaseUser.displayName || "Collector";
      const ownerPhotoURL = user.photoURL ?? firebaseUser.photoURL ?? null;
      const id = await addStamp(firebaseUser.uid, ownerName, ownerPhotoURL, {
        ...data,
        imageURL,
      });
      const newStamp: Stamp = {
        id,
        ownerId: firebaseUser.uid,
        ownerName,
        ownerPhotoURL,
        ...data,
        imageURL,
        createdAt: { toDate: () => new Date() } as never,
      };
      setStamps((prev) => [newStamp, ...prev]);
      toast.success("Stamp added!");
    } catch (err) {
      console.error("[addStamp error]", err);
      toast.error(`Failed to add stamp: ${(err as Error)?.message ?? "unknown error"}`);
      throw err;
    }
  }

  async function handleEdit(data: StampFormData, imageFile?: File) {
    if (!editingStamp || !firebaseUser) return;
    try {
      let imageURL = editingStamp.imageURL;
      if (imageFile) {
        imageURL = await compressImage(imageFile);
      }
      await updateStamp(editingStamp.id, { ...data, imageURL });
      setStamps((prev) =>
        prev.map((s) => (s.id === editingStamp.id ? { ...s, ...data, imageURL } : s))
      );
      toast.success("Stamp updated!");
    } catch (err) {
      console.error("[updateStamp error]", err);
      toast.error(`Failed to update stamp: ${(err as Error)?.message ?? "unknown error"}`);
      throw err;
    }
  }

  async function handleDelete(stamp: Stamp) {
    if (!firebaseUser) return;
    try {
      await deleteStamp(stamp.id, firebaseUser.uid);
      setStamps((prev) => prev.filter((s) => s.id !== stamp.id));
      toast.success("Stamp deleted.");
    } catch {
      toast.error("Failed to delete stamp.");
    } finally {
      setConfirmDelete(null);
    }
  }

  return (
    <div className="px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">My Inventory</h1>
          <p className="text-sm text-muted-foreground">{stamps.length} stamps</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-primary-500 text-white text-sm font-semibold rounded-xl shadow-sm active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      {/* Search */}
      {stamps.length > 0 && (
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search stamps..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          />
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-muted rounded-2xl aspect-square animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <span className="text-4xl mb-3">{stamps.length === 0 ? "📮" : "🔍"}</span>
          <p className="text-sm font-medium">
            {stamps.length === 0 ? "No stamps yet" : "No results found"}
          </p>
          {stamps.length === 0 && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-xl"
            >
              Add your first stamp
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 pb-4">
          {filtered.map((stamp) => (
            <StampCard
              key={stamp.id}
              stamp={stamp}
              isOwner
              onEdit={(s) => setEditingStamp(s)}
              onDelete={(s) => setConfirmDelete(s)}
            />
          ))}
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <StampForm
          title="Add Stamp"
          onSubmit={handleAdd}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Edit form */}
      {editingStamp && (
        <StampForm
          title="Edit Stamp"
          initial={editingStamp}
          onSubmit={handleEdit}
          onClose={() => setEditingStamp(null)}
        />
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl">
            <h3 className="font-semibold text-zinc-900 mb-1">Delete stamp?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              &quot;{confirmDelete.name}&quot; will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
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
