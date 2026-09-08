"use client";

import type { Booking, SiteSettings } from "@/types";
import { formatDate, formatPrice, paymentLabel } from "@/lib/format";
import { formatESDate } from "@/lib/date-range";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function directionLabel(booking: Booking): string {
  const d = booking.transfer?.direction;
  if (d === "airport_to_hotel") return "Aeropuerto → Hotel";
  if (d === "hotel_to_airport") return "Hotel → Aeropuerto";
  if (d === "return") return "Ida y vuelta";
  return "—";
}

export function buildVoucherHtml(
  booking: Booking,
  settings: Pick<
    SiteSettings,
    | "brandName"
    | "companyLegalName"
    | "companyAddress"
    | "companyTaxId"
    | "companyAgencyId"
    | "phone"
    | "email"
  >
): string {
  const company = settings.companyLegalName || settings.brandName;
  const rows: [string, string][] = [
    ["Cliente", booking.customer.name],
    ["Email", booking.customer.email],
    ["Teléfono", booking.customer.phone || "—"],
    ["Servicio", booking.tourTitle],
    [
      "Fecha de reserva",
      booking.createdAt ? formatESDate(booking.createdAt) : "—",
    ],
    ["Fecha del servicio", formatDate(booking.date)],
    ["Hora del servicio", booking.serviceTime || "—"],
    ["Fecha de regreso", booking.returnDate ? formatDate(booking.returnDate) : "—"],
    ["Hora de regreso", booking.returnTime || "—"],
    [
      "Personas",
      `${booking.adults} adulto${booking.adults === 1 ? "" : "s"}${
        booking.children
          ? ` · ${booking.children} niño${booking.children === 1 ? "" : "s"}`
          : ""
      }`,
    ],
    ["Estado", booking.status.toUpperCase()],
    ["Total", formatPrice(booking.amountTotal ?? booking.totalPrice)],
    ["Pago", paymentLabel(booking.paymentMethod)],
    ["Hotel / punto de recogida", booking.customer.hotel || "—"],
    ["Idioma", booking.language || "—"],
    ["Nº de vuelo", booking.customer.flightNumber || "—"],
    ["Tipo de traslado", directionLabel(booking)],
  ];
  if (booking.customer.notes) {
    rows.push(["Notas", booking.customer.notes]);
  }

  const lookupUrl = `/gestionar-reserva`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<title>Voucher ${escapeHtml(booking.id)}</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;font-family:system-ui,-apple-system,sans-serif;color:#1a1a1a;background:#f7f7f7}
  .wrap{max-width:820px;margin:24px auto;background:#fff;border-top:4px solid #2563a8;padding:28px 32px 40px;box-shadow:0 8px 30px rgba(0,0,0,.06)}
  .top{display:flex;justify-content:space-between;gap:24px;align-items:flex-start}
  .logo{background:#123a5c;color:#fff;padding:14px 16px;font-weight:800;min-width:160px}
  .logo small{display:block;font-weight:500;opacity:.85;margin-top:4px;font-size:11px;line-height:1.4}
  .qr{text-align:center;font-size:11px;color:#666}
  .qr .qr-box{display:block;width:110px;height:110px;border:2px solid #111;margin:0 auto 8px;background:
    repeating-linear-gradient(0deg,#111 0 4px,transparent 4px 8px),
    repeating-linear-gradient(90deg,#111 0 4px,transparent 4px 8px);opacity:.85}
  .brand{margin-top:22px;color:#2563a8;font-size:12px;font-weight:700;letter-spacing:.08em}
  h1{margin:6px 0 4px;font-size:28px}
  .hint{color:#666;font-size:13px;margin:0 0 16px}
  .loc{display:flex;justify-content:space-between;align-items:center;gap:12px;background:#eef5fb;border:1px solid #cfe0f0;padding:12px 16px;margin:12px 0 8px}
  .loc strong{color:#1d4f7a;font-size:22px}
  table{width:100%;border-collapse:collapse;margin-top:8px}
  td{padding:10px 4px;border-bottom:1px solid #e5e7eb;font-size:14px;vertical-align:top}
  td:first-child{color:#6b7280;width:42%}
  td:last-child{font-weight:600;text-align:right}
  .foot{display:flex;justify-content:space-between;gap:16px;margin-top:28px;font-size:12px;color:#666}
  .actions{text-align:center;margin-top:28px}
  .btn{display:inline-block;background:#2563a8;color:#fff;border:0;padding:12px 28px;font-weight:700;font-size:14px;cursor:pointer;border-radius:6px}
  @media print{body{background:#fff}.wrap{margin:0;box-shadow:none}.actions{display:none!important}}
</style>
</head>
<body>
<div class="wrap">
  <div class="top">
    <div>
      <div class="logo">${escapeHtml(settings.brandName)}<br/><small>${escapeHtml(company)}<br/>${escapeHtml(settings.companyAddress || "")}<br/>${settings.companyTaxId ? `CIF/NIF: ${escapeHtml(settings.companyTaxId)}` : ""}<br/>${escapeHtml(settings.phone || "")}</small></div>
    </div>
    <div class="qr">
      <div class="qr-box"></div>
      ESCANEÉ PARA VER LA RESERVA<br/><span style="font-size:10px">${escapeHtml(lookupUrl)}</span>
    </div>
  </div>
  <p class="brand">${escapeHtml((settings.companyLegalName || settings.brandName).toUpperCase())}</p>
  <h1>VOUCHER / CONFIRMACIÓN</h1>
  <p class="hint">Presente este documento el día del servicio</p>
  <div class="loc">
    <div>Localizador<br/><strong>${escapeHtml(booking.id)}</strong></div>
    <div style="text-align:right;font-size:13px;color:#555">Emitido ${booking.createdAt ? formatESDate(booking.createdAt) : "—"}</div>
  </div>
  <table>
    ${rows
      .map(
        ([k, v]) =>
          `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`
      )
      .join("")}
  </table>
  <div class="foot">
    <div>Presente este voucher el día del servicio. Conservamos su localizador en nuestros sistemas.<br/>${escapeHtml(settings.email || "")}</div>
    <div style="text-align:right">${settings.companyAgencyId ? `Agencia Nº: ${escapeHtml(settings.companyAgencyId)}` : ""}</div>
  </div>
  <div class="actions"><button class="btn" onclick="window.print()">IMPRIMIR</button></div>
</div>
</body>
</html>`;
}

export function openVoucherWindow(booking: Booking, settings: SiteSettings) {
  const html = buildVoucherHtml(booking, settings);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank");
  if (!w) {
    const a = document.createElement("a");
    a.href = url;
    a.download = `voucher-${booking.id}.html`;
    a.click();
    alert("Ventana bloqueada. Se descargó el voucher para abrirlo e imprimirlo.");
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function VoucherModal({
  booking,
  settings,
  onClose,
}: {
  booking: Booking;
  settings: SiteSettings;
  onClose: () => void;
}) {
  const html = buildVoucherHtml(booking, settings);
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[95vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <iframe
          id={`voucher-${booking.id}`}
          title={`Voucher ${booking.id}`}
          srcDoc={html}
          className="h-[min(75vh,800px)] w-full border-0 bg-white"
        />
        <div className="flex flex-wrap justify-center gap-3 border-t border-sand-line px-4 py-4">
          <button
            type="button"
            onClick={() => {
              const iframe = document.getElementById(
                `voucher-${booking.id}`
              ) as HTMLIFrameElement | null;
              iframe?.contentWindow?.print();
            }}
            className="rounded-md bg-ocean px-5 py-2.5 text-sm font-bold text-white"
          >
            Imprimir / Guardar PDF
          </button>
          <button
            type="button"
            onClick={() => openVoucherWindow(booking, settings)}
            className="rounded-md border border-sand-line px-5 py-2.5 text-sm font-bold"
          >
            Abrir voucher
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-sand-line px-5 py-2.5 text-sm font-bold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
