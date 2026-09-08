"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Invoice } from "@/types";
import { formatDate, formatPrice } from "@/lib/format";
import { adminInput } from "@/components/admin/Field";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildInvoiceHtml(
  inv: Invoice,
  company: { name: string; taxId: string; address: string }
): string {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>${escapeHtml(inv.id)}</title>
<style>
body{font-family:system-ui,sans-serif;max-width:720px;margin:40px auto;color:#16324a;padding:0 16px}
h1{font-size:24px;margin:4px 0 0}.muted{color:#5a7388;font-size:13px}
table{width:100%;border-collapse:collapse;margin-top:24px}
td,th{padding:10px 0;border-bottom:1px solid #d4e4f2;text-align:left;font-size:14px}
.total{font-size:20px;font-weight:700;color:#2563a8}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:28px}
</style></head><body>
<p class="muted">${inv.type === "credit_note" ? "FACTURA ABONO" : "FACTURA"}</p>
<h1>${escapeHtml(inv.id)}</h1>
<p class="muted">${new Date(inv.createdAt).toLocaleString("es-ES")}</p>
<div class="grid">
<div><p class="muted">Emisor</p><p><strong>${escapeHtml(company.name)}</strong><br>${escapeHtml(company.address)}<br>${escapeHtml(company.taxId)}</p></div>
<div><p class="muted">Cliente</p><p><strong>${escapeHtml(inv.customer.name)}</strong><br>${escapeHtml(inv.customer.email)}${inv.customer.phone ? `<br>${escapeHtml(inv.customer.phone)}` : ""}${inv.customer.taxId ? `<br>NIF: ${escapeHtml(inv.customer.taxId)}` : ""}</p></div>
</div>
<table><thead><tr><th>Concepto</th><th style="text-align:right">Importe</th></tr></thead><tbody>
${inv.lines
  .map(
    (l) =>
      `<tr><td>${l.qty}× ${escapeHtml(l.description)}</td><td style="text-align:right">${l.total.toFixed(2)} €</td></tr>`
  )
  .join("")}
</tbody></table>
<p style="margin-top:20px">Base: ${inv.subtotal.toFixed(2)} € · IVA (${inv.taxRate}%): ${inv.taxAmount.toFixed(2)} €</p>
<p class="total">Total: ${inv.total.toFixed(2)} €</p>
${inv.notes ? `<p class="muted">${escapeHtml(inv.notes)}</p>` : ""}
<p class="muted">Reserva ${escapeHtml(inv.bookingId)}${inv.relatedInvoiceId ? ` · Relacionada: ${escapeHtml(inv.relatedInvoiceId)}` : ""}</p>
</body></html>`;
}

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
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "invoice" | "credit_note">(
    "all"
  );
  const [company, setCompany] = useState({
    name: "Lanzarote Travels S.L.",
    taxId: "",
    address: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/invoices");
    const data = await res.json();
    setInvoices(data.invoices || []);
    if (data.stats) setStats(data.stats);
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
      if (!q) return true;
      return (
        inv.id.toLowerCase().includes(q) ||
        inv.bookingId.toLowerCase().includes(q) ||
        inv.customer.name.toLowerCase().includes(q) ||
        inv.customer.email.toLowerCase().includes(q)
      );
    });
  }, [invoices, query, typeFilter]);

  function downloadSelected() {
    if (!selected) return;
    const html = buildInvoiceHtml(selected, company);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selected.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="admin-print-hide flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">Facturas</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Consulte, descargue e imprima facturas y abonos
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
              <div className="flex items-start justify-between gap-3">
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
                <div className="flex gap-2 print:hidden">
                  <button
                    type="button"
                    onClick={downloadSelected}
                    className="rounded bg-ocean px-3 py-1.5 text-xs font-bold text-white"
                  >
                    Descargar
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="rounded border border-sand-line px-3 py-1.5 text-xs font-bold text-ink"
                  >
                    Imprimir
                  </button>
                </div>
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
                  {selected.customer.taxId && (
                    <p className="text-ink-muted">
                      NIF: {selected.customer.taxId}
                    </p>
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
                  <dt>Base</dt>
                  <dd>{formatPrice(selected.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>IVA ({selected.taxRate}%)</dt>
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
              {selected.notes && (
                <p className="mt-4 text-xs text-ink-muted">{selected.notes}</p>
              )}
              <p className="mt-3 text-xs text-ink-muted">
                Reserva{" "}
                <Link
                  href={`/admin/reservas?id=${selected.bookingId}`}
                  className="font-bold text-ocean hover:underline print:text-ink"
                >
                  {selected.bookingId}
                </Link>
                {selected.relatedInvoiceId
                  ? ` · Relacionada: ${selected.relatedInvoiceId}`
                  : ""}
              </p>
            </div>
          ) : (
            <p className="admin-print-hide text-sm text-ink-muted">
              Seleccione una factura para ver el detalle, descargarla o
              imprimirla.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
