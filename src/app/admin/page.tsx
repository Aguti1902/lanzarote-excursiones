"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Bus, CalendarCheck, FileText, TrendingUp } from "lucide-react";
import type { Booking } from "@/types";
import { formatDate, formatPrice, paymentLabel } from "@/lib/format";
import {
  DateRangeFilter,
  type DateField,
} from "@/components/admin/DateRangeFilter";
import { defaultLast7Days } from "@/lib/date-range";

type Stats = {
  totalBookings: number;
  revenue: number;
  cancelled: number;
  byPayment: {
    card: number;
    bizum: number;
  };
  upcoming: Booking[];
  recent: Booking[];
};

export default function AdminDashboard() {
  const initial = defaultLast7Days();
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [dateField, setDateField] = useState<DateField>("booking");
  const [stats, setStats] = useState<Stats | null>(null);
  const [resultCount, setResultCount] = useState(0);
  const [counts, setCounts] = useState({ transfers: 0, invoices: 0 });

  const load = useCallback(async () => {
    const qs = new URLSearchParams();
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    qs.set("field", dateField);
    const [statsData, transfersData, invData] = await Promise.all([
      fetch(`/api/admin/stats?${qs}`).then((r) => r.json()),
      fetch("/api/transfers").then((r) => r.json()),
      fetch("/api/invoices").then((r) => r.json()),
    ]);
    setStats(statsData.stats);
    setResultCount(statsData.meta?.total ?? 0);
    setCounts({
      transfers: transfersData.destinations?.length || 0,
      invoices: invData.invoices?.length || 0,
    });
  }, [from, to, dateField]);

  useEffect(() => {
    load();
  }, [load]);

  if (!stats) {
    return <p className="text-ink-muted">Cargando estadísticas…</p>;
  }

  const cards = [
    {
      label: "Reservas activas",
      value: String(stats.totalBookings),
      icon: CalendarCheck,
    },
    {
      label: "Ingresos cobrados",
      value: formatPrice(stats.revenue),
      icon: TrendingUp,
    },
    {
      label: "Pagos tarjeta",
      value: String(stats.byPayment?.card || 0),
      icon: FileText,
    },
    {
      label: "Pagos Bizum",
      value: String(stats.byPayment?.bizum || 0),
      icon: Bus,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-ink">Dashboard</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Resumen operativo de traslados (ajustable por fechas)
        </p>
      </div>

      <DateRangeFilter
        title="Calendario del dashboard"
        hint={
          dateField === "booking"
            ? "Por defecto: actividad según fecha de reserva"
            : "Filtrado según día del servicio"
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-lg bg-white p-5 ring-1 ring-sand-line"
          >
            <c.icon className="h-5 w-5 text-ocean" />
            <p className="mt-3 text-xs text-ink-muted">{c.label}</p>
            <p className="mt-1 text-2xl font-bold text-ink">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            href: "/admin/traslados",
            label: "Destinos",
            count: counts.transfers,
            icon: Bus,
          },
          {
            href: "/admin/facturas",
            label: "Facturas",
            count: counts.invoices,
            icon: FileText,
          },
          {
            href: "/admin/reservas",
            label: "Reservas",
            count: stats.totalBookings,
            icon: CalendarCheck,
          },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-lg bg-white p-4 ring-1 ring-sand-line hover:ring-ocean/40"
          >
            <item.icon className="h-5 w-5 text-ocean" />
            <div>
              <p className="font-bold">{item.label}</p>
              <p className="text-xs text-ink-muted">{item.count} registros</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg bg-white p-5 ring-1 ring-sand-line">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Próximos traslados</h2>
            <Link href="/admin/reservas" className="text-xs font-bold text-ocean">
              Ver reservas
            </Link>
          </div>
          <ul className="mt-4 space-y-3 text-sm">
            {stats.upcoming.length === 0 && (
              <li className="text-ink-muted">Sin traslados próximos</li>
            )}
            {stats.upcoming.map((b) => (
              <li
                key={b.id}
                className="flex justify-between gap-3 border-b border-sand-line pb-2"
              >
                <div>
                  <p className="font-medium">{b.tourTitle}</p>
                  <p className="text-xs text-ink-muted">
                    {b.customer.name} · {paymentLabel(b.paymentMethod)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatDate(b.date)}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg bg-white p-5 ring-1 ring-sand-line">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Actividad reciente</h2>
            <Link
              href="/admin/estadisticas"
              className="text-xs font-bold text-ocean"
            >
              Estadísticas
            </Link>
          </div>
          <ul className="mt-4 space-y-3 text-sm">
            {stats.recent.map((b) => (
              <li
                key={b.id}
                className="flex justify-between gap-3 border-b border-sand-line pb-2"
              >
                <div>
                  <p className="font-medium">{b.id}</p>
                  <p className="text-xs text-ink-muted">{b.customer.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">
                    {formatPrice(b.amountTotal ?? b.totalPrice)}
                  </p>
                  <p className="text-xs capitalize text-ink-muted">{b.status}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
