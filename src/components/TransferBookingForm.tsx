"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/format";
import type { TransferDestination } from "@/types";

const inputClass =
  "w-full rounded-lg border border-sand-line bg-white px-3 py-2.5 text-sm outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/20";

const INCLUDED_PASSENGERS = 4;

type Direction = "airport_to_hotel" | "hotel_to_airport" | "return";

const directionOptions: { value: Direction; label: string }[] = [
  { value: "airport_to_hotel", label: "Aeropuerto al hotel" },
  { value: "hotel_to_airport", label: "Hotel al aeropuerto" },
  { value: "return", label: "Ida y Vuelta" },
];

function calcTotal(
  dest: TransferDestination,
  direction: Direction,
  passengers: number
): number {
  const base = direction === "return" ? dest.priceReturn : dest.priceOneWay;
  const extraRate = dest.priceExtraPerson ?? 0;
  const extras = Math.max(0, passengers - INCLUDED_PASSENGERS);
  return base + extras * extraRate;
}

/** Formulario de reserva (mismas casillas que en /traslados-aeropuerto-lanzarote). */
export function TransferBookingForm({
  destinations,
}: {
  destinations: TransferDestination[];
}) {
  const router = useRouter();
  const [destination, setDestination] = useState(destinations[0]?.id || "");
  const [direction, setDirection] = useState<Direction>("airport_to_hotel");
  const [date, setDate] = useState("");
  const [serviceTime, setServiceTime] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [returnTime, setReturnTime] = useState("");
  const [adults, setAdults] = useState(2);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [hotel, setHotel] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const dest =
    destinations.find((d) => d.id === destination) || destinations[0];

  const total = useMemo(() => {
    if (!dest) return 0;
    return calcTotal(dest, direction, adults);
  }, [dest, direction, adults]);

  if (!dest) {
    return (
      <p className="rounded-xl bg-surface p-6 text-ink-muted ring-1 ring-sand-line">
        No hay destinos disponibles.
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!date || !serviceTime || !name || !email || !phone || !hotel) {
      setError("Complete los campos obligatorios.");
      return;
    }
    if (direction === "return" && (!returnDate || !returnTime)) {
      setError("Indique fecha y hora de regreso.");
      return;
    }
    setLoading(true);
    try {
      const dirLabel =
        direction === "airport_to_hotel"
          ? `Aeropuerto → ${dest.name}`
          : direction === "hotel_to_airport"
            ? `${dest.name} → Aeropuerto`
            : `Ida y vuelta Aeropuerto ↔ ${dest.name}`;

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "transfer",
          tourTitle: `Traslado ${dirLabel}`,
          date,
          serviceTime,
          returnDate: direction === "return" ? returnDate : undefined,
          returnTime: direction === "return" ? returnTime : undefined,
          adults,
          children: 0,
          totalPrice: total,
          paymentMethod: "card",
          customer: { name, email, phone, hotel, flightNumber },
          transfer: { destination: dest.name, direction },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      router.push(`/reserva/confirmacion?id=${data.booking.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-sand-line"
    >
      <h3 className="text-xl font-bold text-ink">Reservar traslado</h3>
      <p className="mt-1 text-sm text-ink-muted">
        Privado · recibimiento con cartel con su nombre
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-semibold">
            Destino <span className="text-coral">*</span>
          </span>
          <select
            className={inputClass}
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          >
            {destinations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} — Desde {formatPrice(d.priceOneWay)}
              </option>
            ))}
          </select>
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-semibold">
            Trayecto <span className="text-coral">*</span>
          </span>
          <select
            className={inputClass}
            value={direction}
            onChange={(e) => setDirection(e.target.value as Direction)}
          >
            {directionOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold">
            Fecha <span className="text-coral">*</span>
          </span>
          <input
            type="date"
            className={inputClass}
            value={date}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">
            Hora del servicio <span className="text-coral">*</span>
          </span>
          <input
            type="time"
            className={inputClass}
            value={serviceTime}
            onChange={(e) => setServiceTime(e.target.value)}
            required
          />
        </label>

        {direction === "return" && (
          <>
            <label className="block">
              <span className="mb-1 block text-sm font-semibold">
                Fecha de regreso <span className="text-coral">*</span>
              </span>
              <input
                type="date"
                className={inputClass}
                value={returnDate}
                min={date || new Date().toISOString().slice(0, 10)}
                onChange={(e) => setReturnDate(e.target.value)}
                required
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-semibold">
                Hora de regreso <span className="text-coral">*</span>
              </span>
              <input
                type="time"
                className={inputClass}
                value={returnTime}
                onChange={(e) => setReturnTime(e.target.value)}
                required
              />
            </label>
          </>
        )}

        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Pasajeros</span>
          <input
            type="number"
            min={1}
            max={8}
            className={inputClass}
            value={adults}
            onChange={(e) => setAdults(Number(e.target.value) || 1)}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">
            Nombre completo <span className="text-coral">*</span>
          </span>
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold">
            Email <span className="text-coral">*</span>
          </span>
          <input
            type="email"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">
            Teléfono <span className="text-coral">*</span>
          </span>
          <input
            type="tel"
            className={inputClass}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-semibold">Nº de vuelo</span>
          <input
            className={inputClass}
            value={flightNumber}
            onChange={(e) => setFlightNumber(e.target.value)}
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-semibold">
            Hotel / dirección <span className="text-coral">*</span>
          </span>
          <input
            className={inputClass}
            value={hotel}
            onChange={(e) => setHotel(e.target.value)}
            required
          />
        </label>

        <div className="sm:col-span-2">
          <span className="mb-1 block text-sm font-semibold">Pago</span>
          <div className="rounded-lg border-2 border-ocean px-4 py-3 text-sm font-semibold text-ocean">
            Pago 100% online
          </div>
        </div>
      </div>

      <div className="mt-5 border-t border-sand-line pt-4">
        <p className="text-sm text-ink-muted">Total</p>
        <p className="text-3xl font-bold text-ink">{formatPrice(total)}</p>
        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full rounded-md bg-ocean py-3 text-sm font-bold text-white hover:bg-ocean-deep disabled:opacity-60"
        >
          {loading ? "Procesando…" : "Confirmar traslado"}
        </button>
        {error && <p className="mt-3 text-sm text-coral">{error}</p>}
      </div>
    </form>
  );
}
