"use client";

import { useState, useRef } from "react";
import { X, Camera, Loader2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Stamp } from "@/types";

const CONDITIONS: Stamp["condition"][] = ["Mint", "Near Mint", "Fine", "Good", "Fair", "Poor"];

interface StampFormProps {
  initial?: Partial<Stamp>;
  onSubmit: (data: StampFormData, imageFile?: File) => Promise<void>;
  onClose: () => void;
  title: string;
}

export interface StampFormData {
  name: string;
  country: string;
  year: string;
  condition: Stamp["condition"];
  description: string;
  isPublic: boolean;
}

export function StampForm({ initial, onSubmit, onClose, title }: StampFormProps) {
  const [form, setForm] = useState<StampFormData>({
    name: initial?.name ?? "",
    country: initial?.country ?? "",
    year: initial?.year ?? "",
    condition: initial?.condition ?? "Fine",
    description: initial?.description ?? "",
    isPublic: initial?.isPublic ?? true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initial?.imageURL ?? null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof StampFormData, string>>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5MB");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.country.trim()) errs.country = "Country is required";
    if (!form.year.trim()) errs.year = "Year is required";
    else if (!/^\d{4}$/.test(form.year)) errs.year = "Enter a valid 4-digit year";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await onSubmit(form, imageFile ?? undefined);
      onClose();
    } catch {
      // error already shown via toast in parent
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-[480px] bg-white rounded-t-3xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-border px-4 py-4 flex items-center justify-between rounded-t-3xl">
          <h2 className="font-semibold text-zinc-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted transition-colors">
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 py-5 space-y-4 pb-8">
          {/* Image upload */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Photo</label>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full h-48 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center bg-muted hover:bg-zinc-100 transition-colors overflow-hidden relative"
            >
              {imagePreview ? (
                <Image src={imagePreview} alt="preview" fill className="object-cover" />
              ) : (
                <>
                  <Camera className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Tap to add photo</p>
                  <p className="text-xs text-muted-foreground mt-1">Max 5MB</p>
                </>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
          </div>

          {/* Name */}
          <Field label="Stamp name *" error={errors.name}>
            <input
              type="text"
              placeholder="e.g. Queen Elizabeth II 1d"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={inputClass(!!errors.name)}
            />
          </Field>

          {/* Country + Year */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Country *" error={errors.country}>
              <input
                type="text"
                placeholder="e.g. United Kingdom"
                value={form.country}
                onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                className={inputClass(!!errors.country)}
              />
            </Field>
            <Field label="Year *" error={errors.year}>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                placeholder="e.g. 1952"
                value={form.year}
                onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
                className={inputClass(!!errors.year)}
              />
            </Field>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Condition</label>
            <div className="flex flex-wrap gap-2">
              {CONDITIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, condition: c }))}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                    form.condition === c
                      ? "bg-primary-500 text-white border-primary-500"
                      : "bg-white text-zinc-600 border-border hover:border-primary-500"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <Field label="Description">
            <textarea
              placeholder="Additional notes about this stamp..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white resize-none"
            />
          </Field>

          {/* Visibility */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
            <div>
              <p className="text-sm font-medium text-zinc-900">Public stamp</p>
              <p className="text-xs text-muted-foreground mt-0.5">Others can see and request to trade</p>
            </div>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, isPublic: !f.isPublic }))}
              className={cn(
                "relative w-11 h-6 rounded-full transition-colors",
                form.isPublic ? "bg-primary-500" : "bg-zinc-300"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
                  form.isPublic ? "translate-x-5" : "translate-x-0.5"
                )}
              />
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-primary-500 text-white font-semibold text-sm hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Saving..." : title}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}

function inputClass(hasError: boolean) {
  return cn(
    "w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white",
    hasError ? "border-destructive" : "border-border"
  );
}
