"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, X } from "lucide-react";
import type {
  Booking,
  BookingStatus,
  PaymentMethod,
  TransferDestination,
} from "@/types";
import { formatDate, formatPrice, paymentLabel } from "@/lib/format";
import { adminInput, Field } from "@/components/admin/Field";

const statusOptions: { value: "all" | BookingStatus; label: string }[] = [
  { value: "all", label: "Todos los estados" },
  { value: "pending", label: "Pendientes" },
  { value: "confirmed", label: "Confirmadas" },
  { value: "completed", label: "Completadas" },
  { value: "cancelled", label: "Canceladas" },
];

export function AdminReservasClient() {
  const searchParams = useSearchParams();
  const focusId = searchParams.get("id");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [destinations, setDestinations] = useState<TransferDestination[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<Booking | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | BookingStatus>("all");
  const [destination, setDestination] = useState("all");
  const [payment, setPayment] = useState<"all" | "card" | "bizum">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [bRes, tRes] = await Promise.all([
      fetch("/api/bookings"),
      fetch("/api/transfers"),
    ]);
    const bData = await bRes.json();
    const tData = await tRes.json();
    setBookings(bData.bookings || []);
    setDestinations(tData.destinations || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!focusId || !bookings.length) return;
    const found = bookings.find((b) => b.id === focusId);
    if (found) setSelected(found);
  }, [focusId, bookings]);

  useEffect(() => {
    if (!selected?.id) return;
    const fresh = bookings.find((b) => b.id === selected.id);
    if (fresh) setSelected(fresh);
  }, [bookings, selected?.id]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookings.filter((b) => {
      if (status !== "all" && b.status !== status) return false;
      if (payment !== "all" && b.paymentMethod !== payment) return false;
      if (
        destination !== "all" &&
        (b.transfer?.destination || "") !== destination
      ) {
        return false;
      }
      if (dateFrom && b.date < dateFrom) return false;
      if (dateTo && b.date > dateTo) return false;
      if (!q) return true;
      const hay = [
        b.id,
        b.tourTitle,
        b.customer.name,
        b.customer.email,
        b.customer.phone,
        b.customer.hotel,
        b.customer.flightNumber,
        b.transfer?.destination,
        b.invoiceId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [bookings, query, status, payment, destination, dateFrom, dateTo]);

  async function setBookingStatus(id: string, next: BookingStatus) {
    setMessage("");
    const res = await fetch("/api/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: next }),
    });
    if (!res.ok) {
      setMessage("No se pudo actualizar el estado");
      return;
    }
    setMessage(
      next === "cancelled"
        ? "Reserva cancelada. Se ha generado abono si había factura."
        : "Estado actualizado"
    );
    await load();
  }

  async function issueInvoice(bookingId: string) {
    setMessage("");
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "No se pudo emitir la factura");
      return;
    }
    setMessage(`Factura emitida: ${data.invoice?.id || ""}`);
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">Reservas</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Filtre, consulte el detalle, emita facturas y gestione estados
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-md bg-ocean px-4 py-2 text-sm font-semibold text-white hover:bg-ocean-deep"
        >
          <Plus className="h-4 w-4" />
          Nueva reserva
        </button>
      </div>

      {message && (
        <p className="rounded-lg bg-sky-soft px-4 py-2 text-sm text-ocean-deep ring-1 ring-sand-line">
          {message}
        </p>
      )}

      <div className="grid gap-3 rounded-lg bg-white p-4 ring-1 ring-sand-line md:grid-cols-3 xl:grid-cols-6">
        <input
          className={`${adminInput} md:col-span-2 xl:col-span-2`}
          placeholder="Buscar ID, cliente, hotel, vuelo…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className={adminInput}
          value={status}
          onChange={(e) => setStatus(e.target.value as "all" | BookingStatus)}
        >
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          className={adminInput}
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        >
          <option value="all">Todos los destinos</option>
          {destinations.map((d) => (
            <option key={d.id} value={d.name}>
              {d.name}
            </option>
          ))}
        </select>
        <select
          className={adminInput}
          value={payment}
          onChange={(e) =>
            setPayment(e.target.value as "all" | "card" | "bizum")
          }
        >
          <option value="all">Todo pago</option>
          <option value="card">Tarjeta</option>
          <option value="bizum">Bizum</option>
        </select>
        <div className="grid grid-cols-2 gap-2 md:col-span-3 xl:col-span-1">
          <input
            type="date"
            className={adminInput}
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            title="Desde"
          />
          <input
            type="date"
            className={adminInput}
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            title="Hasta"
          />
        </div>
      </div>

      <p className="text-xs text-ink-muted">
        {filtered.length} de {bookings.length} reservas
      </p>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-sand-line">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b border-sand-line bg-sky-soft text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Servicio / Cliente</th>
                <th className="px-4 py-3 font-medium">Pago</th>
                <th className="px-4 py-3 font-medium">Importe</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-ink-muted">
                    Cargando…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-ink-muted">
                    No hay reservas con esos filtros
                  </td>
                </tr>
              )}
              {!loading &&
                filtered.map((b) => (
                  <tr
                    key={b.id}
                    className={`cursor-pointer border-b border-sand-line/70 align-top hover:bg-sky-soft/40 ${
                      selected?.id === b.id ? "bg-ocean/5" : ""
                    }`}
                    onClick={() => setSelected(b)}
                  >
                    <td className="px-4 py-3 font-bold text-ocean">{b.id}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatDate(b.date)}
                    </td>
                    <td className="max-w-[260px] px-4 py-3">
                      <p className="font-medium">{b.tourTitle}</p>
                      <p className="text-xs text-ink-muted">{b.customer.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p>{paymentLabel(b.paymentMethod)}</p>
                      {b.invoiceId && (
                        <Link
                          href={`/admin/facturas?id=${b.invoiceId}`}
                          className="text-xs font-bold text-ocean hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {b.invoiceId}
                        </Link>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold">
                      {formatPrice(b.amountTotal ?? b.totalPrice)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <aside className="h-fit rounded-lg bg-white p-5 ring-1 ring-sand-line">
          {selected ? (
            <BookingDetail
              booking={selected}
              onClose={() => setSelected(null)}
              onStatus={setBookingStatus}
              onInvoice={issueInvoice}
            />
          ) : (
            <p className="text-sm text-ink-muted">
              Seleccione una reserva para ver el detalle completo.
            </p>
          )}
        </aside>
      </div>

      {showCreate && (
        <CreateBookingModal
          destinations={destinations}
          onClose={() => setShowCreate(false)}
          onCreated={async (id) => {
            setShowCreate(false);
            setMessage(`Reserva creada: ${id}`);
            await load();
          }}
        />
      )}
    </div>
  );
}

function BookingDetail({
  booking,
  onClose,
  onStatus,
  onInvoice,
}: {
  booking: Booking;
  onClose: () => void;
  onStatus: (id: string, status: BookingStatus) => void;
  onInvoice: (id: string) => void;
}) {
  const directionLabel =
    booking.transfer?.direction === "airport_to_hotel"
      ? "Aeropuerto → Hotel"
      : booking.transfer?.direction === "hotel_to_airport"
        ? "Hotel → Aeropuerto"
        : booking.transfer?.direction === "return"
          ? "Ida y vuelta"
          : "—";

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-wide text-ocean uppercase">
            Reserva
          </p>
          <p className="text-xl font-bold">{booking.id}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-ink-muted hover:bg-sky-soft"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <dl className="mt-4 space-y-2 text-sm">
        <Row label="Servicio" value={booking.tourTitle} />
        <Row label="Fecha" value={formatDate(booking.date)} />
        <Row label="Destino" value={booking.transfer?.destination || "—"} />
        <Row label="Trayecto" value={directionLabel} />
        <Row label="Pasajeros" value={String(booking.adults)} />
        <Row label="Cliente" value={booking.customer.name} />
        <Row label="Email" value={booking.customer.email} />
        <Row label="Teléfono" value={booking.customer.phone || "—"} />
        <Row label="Hotel" value={booking.customer.hotel || "—"} />
        <Row label="Vuelo" value={booking.customer.flightNumber || "—"} />
        <Row label="Pago" value={paymentLabel(booking.paymentMethod)} />
        <Row
          label="Total"
          value={formatPrice(booking.amountTotal ?? booking.totalPrice)}
        />
        <Row label="Estado" value={booking.status} />
        <div className="flex justify-between gap-3 border-t border-sand-line pt-2">
          <dt className="text-ink-muted">Factura</dt>
          <dd className="text-right font-medium">
            {booking.invoiceId ? (
              <Link
                href={`/admin/facturas?id=${booking.invoiceId}`}
                className="font-bold text-ocean hover:underline"
              >
                Ver {booking.invoiceId}
              </Link>
            ) : (
              "—"
            )}
          </dd>
        </div>
        {booking.customer.notes && (
          <Row label="Notas" value={booking.customer.notes} />
        )}
      </dl>

      <div className="mt-5 flex flex-col gap-2 border-t border-sand-line pt-4">
        {!booking.invoiceId && booking.status !== "cancelled" && (
          <button
            type="button"
            onClick={() => onInvoice(booking.id)}
            className="rounded-md bg-ocean px-3 py-2 text-xs font-bold text-white"
          >
            Emitir factura
          </button>
        )}
        {booking.status !== "confirmed" && booking.status !== "cancelled" && (
          <button
            type="button"
            onClick={() => onStatus(booking.id, "confirmed")}
            className="rounded-md border border-sand-line px-3 py-2 text-xs font-bold"
          >
            Confirmar
          </button>
        )}
        {booking.status !== "completed" && booking.status !== "cancelled" && (
          <button
            type="button"
            onClick={() => onStatus(booking.id, "completed")}
            className="rounded-md border border-sand-line px-3 py-2 text-xs font-bold text-success"
          >
            Completar
          </button>
        )}
        {booking.status !== "cancelled" && (
          <button
            type="button"
            onClick={() => onStatus(booking.id, "cancelled")}
            className="rounded-md border border-red-200 px-3 py-2 text-xs font-bold text-red-600"
          >
            Cancelar (+ abono)
          </button>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="max-w-[60%] text-right font-medium">{value}</dd>
    </div>
  );
}

function CreateBookingModal({
  destinations,
  onClose,
  onCreated,
}: {
  destinations: TransferDestination[];
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [destinationId, setDestinationId] = useState(destinations[0]?.id || "");
  const [direction, setDirection] = useState<
    "airport_to_hotel" | "hotel_to_airport" | "return"
  >("airport_to_hotel");
  const [date, setDate] = useState("");
  const [adults, setAdults] = useState(2);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [hotel, setHotel] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const dest =
    destinations.find((d) => d.id === destinationId) || destinations[0];
  const total = dest
    ? direction === "return"
      ? dest.priceReturn
      : dest.priceOneWay
    : 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!dest || !date || !name || !email || !phone || !hotel) {
      setError("Complete los campos obligatorios");
      return;
    }
    setSaving(true);
    setError("");
    const dirLabel =
      direction === "airport_to_hotel"
        ? `Aeropuerto → ${dest.name}`
        : direction === "hotel_to_airport"
          ? `${dest.name} → Aeropuerto`
          : `Ida y vuelta Aeropuerto ↔ ${dest.name}`;

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "transfer",
          tourTitle: `Traslado ${dirLabel}`,
          date,
          adults,
          children: 0,
          totalPrice: total,
          paymentMethod,
          customer: { name, email, phone, hotel, flightNumber },
          transfer: { destination: dest.name, direction },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      onCreated(data.booking.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={submit}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Nueva reserva manual</h2>
          <button type="button" onClick={onClose}>
            <X className="h-5 w-5 text-ink-muted" />
          </button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Destino *" className="sm:col-span-2">
            <select
              className={adminInput}
              value={destinationId}
              onChange={(e) => setDestinationId(e.target.value)}
            >
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Trayecto *" className="sm:col-span-2">
            <select
              className={adminInput}
              value={direction}
              onChange={(e) =>
                setDirection(
                  e.target.value as
                    | "airport_to_hotel"
                    | "hotel_to_airport"
                    | "return"
                )
              }
            >
              <option value="airport_to_hotel">Aeropuerto → Hotel</option>
              <option value="hotel_to_airport">Hotel → Aeropuerto</option>
              <option value="return">Ida y vuelta</option>
            </select>
          </Field>
          <Field label="Fecha *">
            <input
              type="date"
              className={adminInput}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </Field>
          <Field label="Pasajeros">
            <input
              type="number"
              min={1}
              max={8}
              className={adminInput}
              value={adults}
              onChange={(e) => setAdults(Number(e.target.value))}
            />
          </Field>
          <Field label="Nombre *">
            <input
              className={adminInput}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Field>
          <Field label="Email *">
            <input
              type="email"
              className={adminInput}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
          <Field label="Teléfono *">
            <input
              className={adminInput}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </Field>
          <Field label="Vuelo">
            <input
              className={adminInput}
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value)}
            />
          </Field>
          <Field label="Hotel *" className="sm:col-span-2">
            <input
              className={adminInput}
              value={hotel}
              onChange={(e) => setHotel(e.target.value)}
              required
            />
          </Field>
          <Field label="Pago" className="sm:col-span-2">
            <select
              className={adminInput}
              value={paymentMethod}
              onChange={(e) =>
                setPaymentMethod(e.target.value as PaymentMethod)
              }
            >
              <option value="card">Tarjeta</option>
              <option value="bizum">Bizum</option>
            </select>
          </Field>
        </div>
        <p className="mt-4 text-sm">
          Total: <b>{formatPrice(total)}</b>
        </p>
        {error && <p className="mt-2 text-sm text-coral">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm font-semibold text-ink-muted"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-ocean px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Creando…" : "Crear reserva"}
          </button>
        </div>
      </form>
    </div>
  );
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const styles: Record<BookingStatus, string> = {
    pending: "bg-amber-100 text-amber-800",
    confirmed: "bg-emerald-100 text-emerald-800",
    completed: "bg-sky-100 text-sky-800",
    cancelled: "bg-rose-100 text-rose-800",
  };
  const labels: Record<BookingStatus, string> = {
    pending: "Pendiente",
    confirmed: "Confirmada",
    completed: "Completada",
    cancelled: "Cancelada",
  };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
