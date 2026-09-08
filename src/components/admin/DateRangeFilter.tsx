"use client";

import { adminInput } from "@/components/admin/Field";
import { todayISO, daysAgoISO } from "@/lib/date-range";

export type DateField = "service" | "booking";

export function DateRangeFilter({
  title,
  hint,
  from,
  to,
  onFrom,
  onTo,
  onClear,
  dateField,
  onDateField,
  showFieldSelect = true,
  resultCount,
  defaultPreset = "7d",
}: {
  title: string;
  hint: string;
  from: string;
  to: string;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
  onClear: () => void;
  dateField?: DateField;
  onDateField?: (v: DateField) => void;
  showFieldSelect?: boolean;
  resultCount?: number;
  defaultPreset?: "7d" | "none";
}) {
  function applyPreset(days: number) {
    onFrom(daysAgoISO(days));
    onTo(todayISO());
  }

  return (
    <div className="space-y-3 rounded-lg bg-white p-4 ring-1 ring-sand-line">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {showFieldSelect && onDateField && (
            <select
              className={`${adminInput} max-w-[220px]`}
              value={dateField || "booking"}
              onChange={(e) => onDateField(e.target.value as DateField)}
            >
              <option value="booking">Filtrar por fecha reserva</option>
              <option value="service">Filtrar por fecha servicio</option>
            </select>
          )}
          {defaultPreset === "7d" && (
            <button
              type="button"
              onClick={() => applyPreset(7)}
              className="rounded-md bg-sky-soft px-3 py-2 text-xs font-bold text-ocean-deep ring-1 ring-sand-line"
            >
              Últimos 7 días
            </button>
          )}
          <button
            type="button"
            onClick={() => applyPreset(30)}
            className="rounded-md px-3 py-2 text-xs font-medium text-ink-muted hover:bg-sky-soft"
          >
            30 días
          </button>
        </div>
        {typeof resultCount === "number" && (
          <p className="text-xs text-ink-muted">{resultCount} resultados</p>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <p className="mb-1 text-xs font-bold text-ink">{title}</p>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs text-ink-muted">
              Desde
              <input
                type="date"
                className={`${adminInput} mt-1 min-w-[150px]`}
                value={from}
                onChange={(e) => onFrom(e.target.value)}
              />
            </label>
            <label className="text-xs text-ink-muted">
              Hasta
              <input
                type="date"
                className={`${adminInput} mt-1 min-w-[150px]`}
                value={to}
                onChange={(e) => onTo(e.target.value)}
              />
            </label>
            {(from || to) && (
              <button
                type="button"
                onClick={onClear}
                className="rounded-md px-3 py-2 text-xs font-bold text-ink-muted hover:bg-sky-soft"
              >
                Limpiar ✕
              </button>
            )}
          </div>
        </div>
        <p className="pb-2 text-xs text-ink-muted">{hint}</p>
      </div>
    </div>
  );
}

