"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { Field, adminInput } from "@/components/admin/Field";

export function ImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al subir");
      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <Field label={label}>
      <div className="space-y-3">
        {value ? (
          <div className="relative overflow-hidden rounded-lg ring-1 ring-sand-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt=""
              className="h-40 w-full object-cover bg-sky-soft"
            />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute top-2 right-2 rounded-md bg-white/90 p-1.5 text-ink shadow ring-1 ring-sand-line hover:bg-white"
              title="Quitar imagen"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center rounded-lg bg-sky-soft/60 text-sm text-ink-muted ring-1 ring-dashed ring-sand-line">
            Sin imagen
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-md bg-ocean px-3 py-2 text-xs font-semibold text-white hover:bg-ocean-deep disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ImagePlus className="h-3.5 w-3.5" />
            )}
            {uploading ? "Subiendo…" : "Subir desde el ordenador"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>

        <input
          className={adminInput}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="/images/... o URL"
        />
        {error && <p className="text-xs text-coral">{error}</p>}
      </div>
    </Field>
  );
}
