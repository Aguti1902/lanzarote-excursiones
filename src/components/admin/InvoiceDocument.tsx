"use client";

import type { Invoice } from "@/types";
import { paymentLabel } from "@/lib/format";
import { formatESDate } from "@/lib/date-range";

export type InvoiceCompany = {
  name: string;
  taxId: string;
  address: string;
  phone?: string;
  email?: string;
  agencyId?: string;
};

export type InvoiceExtras = {
  paymentMethod?: string;
  bookingId?: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildInvoiceDocumentHtml(
  inv: Invoice,
  company: InvoiceCompany,
  extras: InvoiceExtras = {}
): string {
  const payment =
    extras.paymentMethod != null
      ? paymentLabel(extras.paymentMethod)
      : undefined;
  const bookingId = extras.bookingId || inv.bookingId;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<title>${escapeHtml(inv.id)}</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;font-family:system-ui,-apple-system,sans-serif;color:#1a1a1a;background:#fff}
  .sheet{max-width:820px;margin:0 auto;padding:28px 32px 40px}
  .accent{height:4px;background:#e85d04;margin:-28px -32px 24px}
  .head{display:flex;justify-content:space-between;gap:24px;align-items:flex-start}
  .logo{background:#123a5c;color:#fff;padding:14px 18px;font-weight:800;letter-spacing:.02em;min-width:180px}
  .logo small{display:block;font-weight:500;opacity:.85;margin-top:4px;font-size:11px}
  .meta{text-align:right}
  .meta .kind{color:#e85d04;font-size:12px;font-weight:700;letter-spacing:.08em}
  .meta h1{margin:4px 0 8px;font-size:28px}
  .meta p{margin:2px 0;font-size:13px;color:#555}
  .cols{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin:28px 0 8px}
  .cols h3{margin:0 0 8px;font-size:11px;letter-spacing:.08em;color:#888;font-weight:700}
  .cols p{margin:0;font-size:13px;line-height:1.55}
  table{width:100%;border-collapse:collapse;margin-top:22px}
  th{background:#f3f4f6;text-align:left;padding:10px 12px;font-size:11px;letter-spacing:.06em;color:#555}
  td{padding:12px;border-bottom:1px solid #e5e7eb;font-size:13px}
  th:last-child,td:last-child{text-align:right}
  .totals{margin-top:18px;margin-left:auto;width:260px;font-size:13px}
  .totals div{display:flex;justify-content:space-between;padding:4px 0}
  .totals .grand{border-top:2px solid #111;margin-top:8px;padding-top:10px;font-size:18px;font-weight:800}
  .foot{display:flex;justify-content:space-between;gap:16px;margin-top:36px;font-size:11px;color:#777}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.no-print{display:none!important}}
</style>
</head>
<body>
<div class="sheet">
  <div class="accent"></div>
  <div class="head">
    <div class="logo">${escapeHtml(company.name.split(" ")[0] || "LT")}<br/><small>${escapeHtml(company.name)}</small></div>
    <div class="meta">
      <div class="kind">${inv.type === "credit_note" ? "FACTURA ABONO" : "FACTURA"}</div>
      <h1>${escapeHtml(inv.id)}</h1>
      <p>Fecha: ${formatESDate(inv.createdAt)}</p>
      <p>Reserva: ${escapeHtml(bookingId)}</p>
    </div>
  </div>
  <div class="cols">
    <div>
      <h3>EMISOR</h3>
      <p><strong>${escapeHtml(company.name)}</strong><br/>
      ${escapeHtml(company.address || "")}<br/>
      ${company.taxId ? `NIF/CIF: ${escapeHtml(company.taxId)}<br/>` : ""}
      ${company.agencyId ? `Agencia Nº: ${escapeHtml(company.agencyId)}<br/>` : ""}
      ${[company.phone, company.email]
        .filter((v): v is string => Boolean(v))
        .map(escapeHtml)
        .join(" · ")}
      </p>
    </div>
    <div>
      <h3>CLIENTE</h3>
      <p><strong>${escapeHtml(inv.customer.name)}</strong><br/>
      ${escapeHtml(inv.customer.email || "")}<br/>
      ${inv.customer.phone ? `${escapeHtml(inv.customer.phone)}<br/>` : ""}
      ${inv.customer.taxId ? `NIF: ${escapeHtml(inv.customer.taxId)}<br/>` : ""}
      ${payment ? `Forma de pago: ${escapeHtml(payment)}` : ""}
      </p>
    </div>
  </div>
  <table>
    <thead>
      <tr><th>CONCEPTO</th><th>CANT.</th><th>PRECIO</th><th>IMPORTE</th></tr>
    </thead>
    <tbody>
      ${inv.lines
        .map(
          (l) => `<tr>
        <td>${escapeHtml(l.description)}</td>
        <td>${l.qty}</td>
        <td>${l.unitPrice.toFixed(2)} €</td>
        <td>${l.total.toFixed(2)} €</td>
      </tr>`
        )
        .join("")}
    </tbody>
  </table>
  <div class="totals">
    <div><span>Base imponible</span><span>${inv.subtotal.toFixed(2)} €</span></div>
    <div><span>IVA / IGIC (${inv.taxRate}%)</span><span>${inv.taxAmount.toFixed(2)} €</span></div>
    <div class="grand"><span>Total</span><span>${inv.total.toFixed(2)} €</span></div>
  </div>
  <div class="foot">
    <div>Documento fiscal emitido por ${escapeHtml(company.name)}.
    ${inv.taxRate > 0 ? "<br/>Impuesto aplicado según normativa vigente." : ""}
    ${inv.notes ? `<br/>${escapeHtml(inv.notes)}` : ""}
    </div>
    <div style="text-align:right">${escapeHtml(company.name)}
    ${company.agencyId ? `<br/>${escapeHtml(company.agencyId)}` : ""}
    </div>
  </div>
</div>
</body>
</html>`;
}

export function openInvoicePreviewWindow(
  inv: Invoice,
  company: InvoiceCompany,
  extras?: InvoiceExtras,
  autoPrint = false
) {
  const html = buildInvoiceDocumentHtml(inv, company, extras);
  const w = window.open("", "_blank", "noopener,noreferrer,width=900,height=1000");
  if (!w) {
    alert("Permita ventanas emergentes para previsualizar/descargar la factura.");
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  if (autoPrint) {
    w.focus();
    setTimeout(() => w.print(), 350);
  }
}

export function InvoicePreviewModal({
  invoice,
  company,
  extras,
  onClose,
}: {
  invoice: Invoice;
  company: InvoiceCompany;
  extras?: InvoiceExtras;
  onClose: () => void;
}) {
  const html = buildInvoiceDocumentHtml(invoice, company, extras);
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <iframe
          title={`Preview ${invoice.id}`}
          srcDoc={html}
          className="h-[min(70vh,720px)] w-full border-0 bg-white"
        />
        <div className="flex flex-wrap items-center justify-center gap-3 border-t border-sand-line bg-white px-4 py-4">
          <button
            type="button"
            onClick={() =>
              openInvoicePreviewWindow(invoice, company, extras, true)
            }
            className="rounded-md bg-ocean px-5 py-2.5 text-sm font-bold text-white hover:bg-ocean-deep"
          >
            Imprimir / Guardar PDF
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-sand-line px-5 py-2.5 text-sm font-bold text-ink"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
