"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import type { Booking, SiteSettings } from "@/types";
import { formatDate, formatPrice, paymentLabel } from "@/lib/format";
import { PageHero } from "@/components/PageHero";
import { VoucherModal } from "@/components/VoucherDocument";
import { ConfirmDialog, NoticeBanner } from "@/components/WebDialog";

const inputClass =
  "w-full rounded-lg border border-sand-line bg-white px-3 py-2.5 text-sm outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/20";

export function ManageBookingClient() {
  const [bookingId, setBookingId] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [showVoucher, setShowVoucher] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setSettings(d.settings || null))
      .catch(() => undefined);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setBooking(null);
    setLoading(true);
    try {
      const res = await fetch("/api/bookings/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: bookingId, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setBooking(data.booking as Booking);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function executeCancel() {
    if (!booking) return;
    setCancelling(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/bookings/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: booking.id,
          email,
          refund: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo cancelar");
      setBooking(data.booking as Booking);
      setMessage(data.message || "Reserva cancelada");
      setConfirmCancel(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setConfirmCancel(false);
    } finally {
      setCancelling(false);
    }
  }

  return (
    <>
      <PageHero
        image="/images/heroes/transfer.jpg"
        title="Gestionar su reserva"
        subtitle="Introduzca su número de reserva y el email con el que compró."
        compact
      />

      <section className="mx-auto max-w-xl px-4 py-14 md:px-6">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl bg-white p-6 ring-1 ring-sand-line"
        >
          <div>
            <label className="mb-1 block text-sm font-semibold">
              Localizador
            </label>
            <input
              className={inputClass}
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              placeholder="BK-1001"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Email</label>
            <input
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {error && (
            <NoticeBanner
              message={error}
              variant="error"
              onClose={() => setError("")}
            />
          )}
          {message && (
            <NoticeBanner
              message={message}
              variant="success"
              onClose={() => setMessage("")}
            />
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-ocean py-3 text-sm font-semibold text-white hover:bg-ocean-deep disabled:opacity-60"
          >
            {loading ? "Buscando…" : "Consultar reserva"}
          </button>
        </form>

        {booking && (
          <div className="mt-8 rounded-xl bg-white p-6 ring-1 ring-sand-line">
            <h2 className="text-xl font-bold text-ink">
              Localizador {booking.id}
            </h2>
            <dl className="mt-4 space-y-2 text-sm">
              <Row label="Actividad" value={booking.tourTitle} />
              <Row
                label="Fecha de reserva"
                value={
                  booking.createdAt
                    ? formatDate(booking.createdAt.slice(0, 10))
                    : "—"
                }
              />
              <Row label="Fecha del servicio" value={formatDate(booking.date)} />
              <Row label="Hora del servicio" value={booking.serviceTime || "—"} />
              <Row
                label="Fecha de regreso"
                value={
                  booking.returnDate ? formatDate(booking.returnDate) : "—"
                }
              />
              <Row label="Hora de regreso" value={booking.returnTime || "—"} />
              <Row
                label="Personas"
                value={`${booking.adults} adulto${booking.adults === 1 ? "" : "s"}`}
              />
              <Row
                label="Total"
                value={formatPrice(booking.amountTotal ?? booking.totalPrice)}
                highlight
              />
              <Row label="Estado" value={booking.status.toUpperCase()} />
              <Row
                label="Pago"
                value={
                  booking.paymentStatus === "refunded"
                    ? "Reembolsado"
                    : paymentLabel(booking.paymentMethod)
                }
              />
              {booking.invoiceId && (
                <Row label="Factura" value={booking.invoiceId} />
              )}
              {booking.creditNoteId && (
                <Row label="Abono" value={booking.creditNoteId} />
              )}
            </dl>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setShowVoucher(true)}
                className="flex-1 rounded-md bg-ocean px-4 py-2.5 text-sm font-bold text-white hover:bg-ocean-deep"
              >
                Ver voucher
              </button>
              {booking.status !== "cancelled" && (
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={() => setConfirmCancel(true)}
                  className="flex-1 rounded-md border border-ocean px-4 py-2.5 text-sm font-bold text-ocean hover:bg-sky-soft disabled:opacity-60"
                >
                  {cancelling
                    ? "Procesando…"
                    : "Cancelar reserva / Devolución"}
                </button>
              )}
            </div>

            <p className="mt-6 text-sm text-ink-muted">
              ¿Necesita cambios? Contáctenos.{" "}
              <Link
                href="/contacto"
                className="font-bold text-ocean hover:underline"
              >
                Contacto
              </Link>
            </p>
          </div>
        )}
      </section>

      {showVoucher && booking && settings && (
        <VoucherModal
          booking={booking}
          settings={settings}
          onClose={() => setShowVoucher(false)}
        />
      )}

      <ConfirmDialog
        open={confirmCancel}
        title="Cancelar reserva"
        message="¿Cancelar la reserva y solicitar la devolución del pago? Se emitirá factura abono."
        confirmLabel="Sí, cancelar"
        cancelLabel="Volver"
        danger
        loading={cancelling}
        onConfirm={executeCancel}
        onCancel={() => {
          if (!cancelling) setConfirmCancel(false);
        }}
      />
    </>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4 border-b border-sand-line/70 py-1.5">
      <dt className="text-ink-muted">{label}</dt>
      <dd
        className={`text-right font-bold ${highlight ? "text-ocean" : "text-ink"}`}
      >
        {value}
      </dd>
    </div>
  );
}
