"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Invoice } from "@/types";
import { formatDate, formatPrice } from "@/lib/format";
import { adminInput } from "@/components/admin/Field";
import { DateRangeFilter } from "@/components/admin/DateRangeFilter";
import { inDateRange } from "@/lib/date-range";
import {
  InvoicePreviewModal,
  downloadInvoiceHtml,
  openInvoicePreviewWindow,
  type InvoiceCompany,
} from "@/components/admin/InvoiceDocument";

export function FacturasClient() {
  const searchParams = useSearchParams();
  const focusId = searchParams.get("id");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState({
    countInvoices: 0,
    countCredits: 0,
    invoicesSum: 0,
    creditsSum: 0,
    net: 0,
  });
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "invoice" | "credit_note">(
    "all"
  );
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [company, setCompany] = useState<InvoiceCompany>({
    name: "Lanzarote Travels S.L.",
    taxId: "",
    address: "",
  });
  const [bookingPayments, setBookingPayments] = useState<
    Record<string, string>
  >({});

  const load = useCallback(async () => {
    setLoading(true);
    const [invRes, bookRes] = await Promise.all([
      fetch("/api/invoices"),
      fetch("/api/bookings"),
    ]);
    const data = await invRes.json();
    const books = await bookRes.json();
    setInvoices(data.invoices || []);
    if (data.stats) setStats(data.stats);
    const map: Record<string, string> = {};
    for (const b of books.bookings || []) {
      map[b.id] = b.paymentMethod;
    }
    setBookingPayments(map);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (!d.settings) return;
        setCompany({
          name:
            d.settings.companyLegalName ||
            d.settings.brandName ||
            "Lanzarote Travels S.L.",
          taxId: d.settings.companyTaxId || "",
          address:
            d.settings.companyAddress || d.settings.contactAddress || "",
          phone: d.settings.phone,
          email: d.settings.email,
          agencyId: d.settings.companyAgencyId,
        });
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!focusId || !invoices.length) return;
    const found = invoices.find((i) => i.id === focusId);
    if (found) setSelected(found);
  }, [focusId, invoices]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return invoices.filter((inv) => {
      if (typeFilter !== "all" && inv.type !== typeFilter) return false;
      if (!inDateRange(inv.createdAt, from, to)) return false;
      if (!q) return true;
      return (
        inv.id.toLowerCase().includes(q) ||
        inv.bookingId.toLowerCase().includes(q) ||
        inv.customer.name.toLowerCase().includes(q) ||
        inv.customer.email.toLowerCase().includes(q)
      );
    });
  }, [invoices, query, typeFilter, from, to]);

  const extras = selected
    ? {
        paymentMethod: bookingPayments[selected.bookingId],
        bookingId: selected.bookingId,
      }
    : undefined;

  return (
    <div className="space-y-6">
      <div className="admin-print-hide flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">Facturas</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Consulte, previsualice, imprima y descargue PDF de facturas y abonos
          </p>
        </div>
      </div>

      <div className="admin-print-hide grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Facturas", value: stats.countInvoices },
          { label: "Abonos", value: stats.countCredits },
          { label: "Emitido", value: formatPrice(stats.invoicesSum) },
          { label: "Neto", value: formatPrice(stats.net) },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-lg bg-white p-4 ring-1 ring-sand-line"
          >
            <p className="text-xs text-ink-muted">{c.label}</p>
            <p className="mt-1 text-2xl font-bold text-ink">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="admin-print-hide flex flex-wrap gap-3">
        <input
          className={`${adminInput} max-w-xs`}
          placeholder="Buscar nº, cliente, reserva…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className={`${adminInput} max-w-[180px]`}
          value={typeFilter}
          onChange={(e) =>
            setTypeFilter(e.target.value as "all" | "invoice" | "credit_note")
          }
        >
          <option value="all">Todos los tipos</option>
          <option value="invoice">Facturas</option>
          <option value="credit_note">Abonos</option>
        </select>
      </div>

      <div className="admin-print-hide">
        <DateRangeFilter
          title="Calendario de facturación"
          hint="Filtre facturas por fecha de emisión"
          from={from}
          to={to}
          onFrom={setFrom}
          onTo={setTo}
          onClear={() => {
            setFrom("");
            setTo("");
          }}
          showFieldSelect={false}
          defaultPreset="none"
          resultCount={filtered.length}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <div className="admin-print-hide overflow-x-auto rounded-lg bg-white ring-1 ring-sand-line">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-sand-line bg-sky-soft text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Nº</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Reserva</th>
                <th className="px-4 py-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-ink-muted"
                  >
                    Cargando…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-ink-muted"
                  >
                    No hay facturas con esos filtros
                  </td>
                </tr>
              )}
              {!loading &&
                filtered.map((inv) => (
                  <tr
                    key={inv.id}
                    className={`cursor-pointer border-b border-sand-line/70 hover:bg-sky-soft/50 ${
                      selected?.id === inv.id ? "bg-ocean/5" : ""
                    }`}
                    onClick={() => setSelected(inv)}
                  >
                    <td className="px-4 py-3 font-bold text-ocean">{inv.id}</td>
                    <td className="px-4 py-3">
                      {inv.type === "credit_note" ? "Abono" : "Factura"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatDate(inv.createdAt.slice(0, 10))}
                    </td>
                    <td className="px-4 py-3">{inv.customer.name}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/reservas?id=${inv.bookingId}`}
                        className="font-medium text-ocean hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {inv.bookingId}
                      </Link>
                    </td>
                    <td
                      className={`px-4 py-3 font-bold ${
                        inv.total < 0 ? "text-red-600" : "text-ink"
                      }`}
                    >
                      {formatPrice(inv.total)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <aside className="invoice-print-sheet h-fit rounded-lg bg-white p-5 ring-1 ring-sand-line">
          {selected ? (
            <div>
              <div>
                <p className="text-xs font-bold tracking-wide text-ocean uppercase">
                  {selected.type === "credit_note"
                    ? "Factura abono"
                    : "Factura"}
                </p>
                <p className="text-xl font-bold">{selected.id}</p>
                <p className="mt-1 text-xs text-ink-muted">
                  {new Date(selected.createdAt).toLocaleString("es-ES")}
                </p>
              </div>

              <div className="admin-print-hide mt-4 flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(true)}
                    className="rounded-md bg-ocean px-3 py-2 text-xs font-bold text-white"
                  >
                    Previsualizar
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      openInvoicePreviewWindow(selected, company, extras, false)
                    }
                    className="rounded-md border border-sand-line px-3 py-2 text-xs font-bold text-ink"
                  >
                    Abrir preview
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    openInvoicePreviewWindow(selected, company, extras, true)
                  }
                  className="rounded-md border border-sand-line px-3 py-2 text-xs font-bold text-ink"
                >
                  Imprimir
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewOpen(true);
                    setTimeout(() => {
                      openInvoicePreviewWindow(
                        selected,
                        company,
                        extras,
                        true
                      );
                    }, 150);
                  }}
                  className="rounded-md bg-ocean px-3 py-2.5 text-sm font-bold text-white hover:bg-ocean-deep"
                >
                  Descargar PDF
                </button>
                <button
                  type="button"
                  onClick={() =>
                    downloadInvoiceHtml(selected, company, extras)
                  }
                  className="rounded-md border border-sand-line px-3 py-2 text-xs font-bold text-ink"
                >
                  Descargar HTML
                </button>
                <p className="text-[11px] text-ink-muted">
                  En el diálogo de impresión, elija «Guardar como PDF». Si el
                  navegador bloquea la ventana, use Previsualizar o Descargar
                  HTML.
                </p>
              </div>

              <div className="mt-5 grid gap-4 border-t border-sand-line pt-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs text-ink-muted">Emisor</p>
                  <p className="font-bold text-ink">{company.name}</p>
                  <p className="text-ink-muted">{company.address}</p>
                  <p className="text-ink-muted">{company.taxId}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-muted">Cliente</p>
                  <p className="font-bold text-ink">{selected.customer.name}</p>
                  <p className="text-ink-muted">{selected.customer.email}</p>
                  {selected.customer.phone && (
                    <p className="text-ink-muted">{selected.customer.phone}</p>
                  )}
                </div>
              </div>

              <ul className="mt-4 space-y-2 border-t border-sand-line pt-3 text-sm">
                {selected.lines.map((l, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span>
                      {l.qty}× {l.description}
                    </span>
                    <span className="font-bold whitespace-nowrap">
                      {formatPrice(l.total)}
                    </span>
                  </li>
                ))}
              </ul>
              <dl className="mt-4 space-y-1 border-t border-sand-line pt-3 text-sm">
                <div className="flex justify-between">
                  <dt>Base imponible</dt>
                  <dd>{formatPrice(selected.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>IGIC ({selected.taxRate}%)</dt>
                  <dd>{formatPrice(selected.taxAmount)}</dd>
                </div>
                <div className="flex justify-between text-base font-bold">
                  <dt>Total</dt>
                  <dd
                    className={
                      selected.total < 0 ? "text-red-600" : "text-ocean"
                    }
                  >
                    {formatPrice(selected.total)}
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-ink-muted">
                Reserva{" "}
                <Link
                  href={`/admin/reservas?id=${selected.bookingId}`}
                  className="font-bold text-ocean hover:underline"
                >
                  {selected.bookingId}
                </Link>
              </p>
            </div>
          ) : (
            <p className="admin-print-hide text-sm text-ink-muted">
              Seleccione una factura para previsualizarla o descargar el PDF.
            </p>
          )}
        </aside>
      </div>

      {previewOpen && selected && (
        <InvoicePreviewModal
          invoice={selected}
          company={company}
          extras={extras}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </div>
  );
}
