import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { getBookings } from "@/lib/bookings";
import { formatDate, formatPrice, paymentLabel } from "@/lib/format";

export const metadata: Metadata = {
  title: "Reserva confirmada",
  description:
    "Confirmación y detalles de su traslado privado en Lanzarote Travels.",
};

type Props = { searchParams: Promise<{ id?: string }> };

export default async function ConfirmacionPage({ searchParams }: Props) {
  const { id } = await searchParams;
  const bookings = await getBookings();
  const booking = bookings.find(
    (b) => b.id.toUpperCase() === String(id || "").toUpperCase()
  );

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center md:px-6">
      <CheckCircle2 className="h-14 w-14 text-success" />
      <h1 className="mt-5 font-display text-3xl text-ink md:text-4xl">
        {booking ? "Reserva confirmada" : "Reserva no encontrada"}
      </h1>
      <p className="mt-3 text-ink-muted">
        {booking
          ? "Estos son los detalles de su traslado. Presente el voucher el día del servicio."
          : "No encontramos una reserva con ese localizador."}
      </p>

      {booking ? (
        <div className="mt-8 w-full rounded-xl bg-surface p-6 text-left ring-1 ring-sand-line">
          <p className="text-xs tracking-wide text-ink-muted uppercase">
            Localizador
          </p>
          <p className="font-display text-2xl text-ocean">{booking.id}</p>
          <p className="mt-1 text-xs font-bold uppercase text-ink-muted">
            {booking.status}
          </p>
          <dl className="mt-4 space-y-2 text-sm">
            <Row label="Cliente" value={booking.customer.name} />
            <Row label="Email" value={booking.customer.email} />
            <Row label="Teléfono" value={booking.customer.phone || "—"} />
            <Row label="Servicio" value={booking.tourTitle} />
            <Row label="Fecha del servicio" value={formatDate(booking.date)} />
            <Row label="Hora" value={booking.serviceTime || "—"} />
            {booking.returnDate && (
              <Row
                label="Regreso"
                value={`${formatDate(booking.returnDate)}${
                  booking.returnTime ? ` · ${booking.returnTime}` : ""
                }`}
              />
            )}
            <Row
              label="Personas"
              value={`${booking.adults} adulto${booking.adults === 1 ? "" : "s"}`}
            />
            <Row label="Hotel" value={booking.customer.hotel || "—"} />
            <Row
              label="Vuelo"
              value={booking.customer.flightNumber || "—"}
            />
            <Row label="Pago" value={paymentLabel(booking.paymentMethod)} />
            {booking.invoiceId && (
              <Row label="Factura" value={booking.invoiceId} />
            )}
            <div className="flex justify-between gap-4 border-t border-sand-line pt-2">
              <dt className="text-ink-muted">Total</dt>
              <dd className="text-lg font-bold">
                {formatPrice(booking.amountTotal ?? booking.totalPrice)}
              </dd>
            </div>
          </dl>
        </div>
      ) : (
        <p className="mt-6 text-sm text-ink-muted">
          Localizador: {id || "—"}
        </p>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/gestionar-reserva"
          className="rounded-md bg-ocean px-6 py-3 text-sm font-semibold text-white hover:bg-ocean-deep"
        >
          Gestionar reserva
        </Link>
        <Link
          href="/"
          className="rounded-md px-6 py-3 text-sm font-semibold text-ocean ring-1 ring-ocean/30 hover:bg-sky-soft"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-sand-line/60 py-1.5">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="max-w-[60%] text-right font-medium">{value}</dd>
    </div>
  );
}
