"use client";

import { useEffect } from "react";

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Aceptar",
  cancelLabel = "Cancelar",
  loading = false,
  danger = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/45 p-4"
      role="presentation"
      onClick={() => {
        if (!loading) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="web-confirm-title"
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl ring-1 ring-sand-line"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="web-confirm-title"
          className="font-display text-xl text-ink"
        >
          {title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">{message}</p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="rounded-md border border-sand-line px-4 py-2.5 text-sm font-semibold text-ink hover:bg-bg disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`rounded-md px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 ${
              danger
                ? "bg-coral hover:bg-coral/90"
                : "bg-ocean hover:bg-ocean-deep"
            }`}
          >
            {loading ? "Procesando…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function NoticeBanner({
  message,
  variant = "info",
  onClose,
}: {
  message: string;
  variant?: "info" | "success" | "error";
  onClose?: () => void;
}) {
  const styles =
    variant === "error"
      ? "bg-rose-50 text-rose-800 ring-rose-200"
      : variant === "success"
        ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
        : "bg-sky-soft text-ocean-deep ring-sand-line";

  return (
    <div
      role="status"
      className={`flex items-start justify-between gap-3 rounded-lg px-4 py-3 text-sm ring-1 ${styles}`}
    >
      <p className="leading-relaxed">{message}</p>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-xs font-bold uppercase tracking-wide opacity-70 hover:opacity-100"
          aria-label="Cerrar"
        >
          Cerrar
        </button>
      )}
    </div>
  );
}
