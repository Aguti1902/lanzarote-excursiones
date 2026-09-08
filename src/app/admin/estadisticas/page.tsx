"use client";

import { useCallback, useEffect, useState } from "react";
import { formatPrice } from "@/lib/format";
import {
  DateRangeFilter,
  type DateField,
} from "@/components/admin/DateRangeFilter";
import { defaultLast7Days } from "@/lib/date-range";

type Stats = {
  totalBookings: number;
  revenue: number;
  cardCollected: number;
  cancelled: number;
  byType: { transfer: number };
  byPayment: {
    card: number;
    bizum: number;
  };
  topDestinations: { title: string; count: number; revenue: number }[];
  byMonth: { month: string; amount: number }[];
};

type InvoiceStats = {
  countInvoices: number;
  countCredits: number;
  invoicesSum: number;
  creditsSum: number;
  net: number;
};

export default function AdminEstadisticasPage() {
  const initial = defaultLast7Days();
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [dateField, setDateField] = useState<DateField>("booking");
  const [stats, setStats] = useState<Stats | null>(null);
  const [resultCount, setResultCount] = useState(0);
  const [inv, setInv] = useState<InvoiceStats | null>(null);

  const load = useCallback(async () => {
    const qs = new URLSearchParams();
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    qs.set("field", dateField);
    const [s, i] = await Promise.all([
      fetch(`/api/admin/stats?${qs}`).then((r) => r.json()),
      fetch("/api/invoices").then((r) => r.json()),
    ]);
    setStats(s.stats);
    setResultCount(s.meta?.total ?? 0);
    setInv(i.stats);
  }, [from, to, dateField]);

  useEffect(() => {
    load();
  }, [load]);

  if (!stats) {
    return <p className="text-ink-muted">Cargando estadísticas…</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-ink">Estadísticas</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Ingresos, pagos online y facturación · últimos 7 días por defecto
        </p>
      </div>

      <DateRangeFilter
        title="Calendario de estadísticas"
        hint={
          dateField === "booking"
            ? "Por defecto: últimos 7 días según día en que reservaron"
            : "Rango según día del servicio"
        }
        from={from}
        to={to}
        onFrom={setFrom}
        onTo={setTo}
        onClear={() => {
          setFrom("");
          setTo("");
        }}
        dateField={dateField}
        onDateField={setDateField}
        resultCount={resultCount}
        defaultPreset="7d"
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Ingresos cobrados", value: formatPrice(stats.revenue) },
          {
            label: "Cobrado online",
            value: formatPrice(stats.cardCollected || 0),
          },
          { label: "Reservas activas", value: String(stats.totalBookings) },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-lg bg-white p-5 ring-1 ring-sand-line"
          >
            <p className="text-xs text-ink-muted">{c.label}</p>
            <p className="mt-2 text-2xl font-bold">{c.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-5 ring-1 ring-sand-line">
          <h2 className="text-lg font-bold">Por tipo de servicio</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex justify-between">
              <span>Traslados</span>
              <b>{stats.byType.transfer}</b>
            </li>
            <li className="flex justify-between border-t border-sand-line pt-2">
              <span>Canceladas</span>
              <b>{stats.cancelled}</b>
            </li>
          </ul>
        </div>

        <div className="rounded-lg bg-white p-5 ring-1 ring-sand-line">
          <h2 className="text-lg font-bold">Por método de pago</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex justify-between">
              <span>Tarjeta</span>
              <b>{stats.byPayment.card}</b>
            </li>
            <li className="flex justify-between">
              <span>Bizum</span>
              <b>{stats.byPayment.bizum}</b>
            </li>
          </ul>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-5 ring-1 ring-sand-line">
          <h2 className="text-lg font-bold">Top destinos</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {(stats.topDestinations || []).length === 0 && (
              <li className="text-ink-muted">Sin datos en este rango</li>
            )}
            {(stats.topDestinations || []).map((t) => (
              <li key={t.title} className="flex justify-between gap-3">
                <span className="line-clamp-1">{t.title}</span>
                <span className="shrink-0 font-bold">
                  {t.count} · {formatPrice(t.revenue)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg bg-white p-5 ring-1 ring-sand-line">
          <h2 className="text-lg font-bold">Ingresos por mes</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {(stats.byMonth || []).length === 0 && (
              <li className="text-ink-muted">Sin datos en este rango</li>
            )}
            {(stats.byMonth || []).map((m) => (
              <li key={m.month} className="flex justify-between">
                <span>{m.month}</span>
                <b>{formatPrice(m.amount)}</b>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {inv && (
        <section className="rounded-lg bg-white p-5 ring-1 ring-sand-line">
          <h2 className="text-lg font-bold">Facturación</h2>
          <p className="mt-1 text-xs text-ink-muted">
            Totales de facturas (no filtrados por el calendario de reservas)
          </p>
          <div className="mt-4 grid gap-4 text-sm sm:grid-cols-4">
            <div>
              <p className="text-ink-muted">Facturas</p>
              <p className="text-xl font-bold">{inv.countInvoices}</p>
            </div>
            <div>
              <p className="text-ink-muted">Abonos</p>
              <p className="text-xl font-bold">{inv.countCredits}</p>
            </div>
            <div>
              <p className="text-ink-muted">Emitido</p>
              <p className="text-xl font-bold">{formatPrice(inv.invoicesSum)}</p>
            </div>
            <div>
              <p className="text-ink-muted">Neto</p>
              <p className="text-xl font-bold text-ocean">
                {formatPrice(inv.net)}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
