"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import type { Booking } from "@/types";
import { formatPrice, paymentLabel } from "@/lib/format";
import { PageHero } from "@/components/PageHero";

const inputClass =
  "w-full rounded-lg border border-sand-line bg-white px-3 py-2.5 text-sm outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/20";

export function ManageBookingClient() {
  const [bookingId, setBookingId] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
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
              Número de reserva
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
          {error && <p className="text-sm text-coral">{error}</p>}
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
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">Servicio</dt>
                <dd className="text-right font-bold">{booking.tourTitle}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">Fecha</dt>
                <dd className="font-bold">{booking.date}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">Personas</dt>
                <dd className="font-bold">{booking.adults}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">Total</dt>
                <dd className="font-bold text-ocean">
                  {formatPrice(booking.amountTotal ?? booking.totalPrice)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">Estado</dt>
                <dd className="font-bold uppercase">{booking.status}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">Pago</dt>
                <dd className="font-bold">
                  {paymentLabel(booking.paymentMethod)}
                </dd>
              </div>
            </dl>
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
    </>
  );
}
