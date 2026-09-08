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
import {
  DateRangeFilter,
  type DateField,
} from "@/components/admin/DateRangeFilter";
import { inDateRange, todayISO } from "@/lib/date-range";

type StatusTab =
  | "all"
  | "current"
  | "completed"
  | "incomplete"
  | "cancelled";

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
  const [tab, setTab] = useState<StatusTab>("all");
  const [destination, setDestination] = useState("all");
  const [payment, setPayment] = useState<"all" | "card" | "bizum">("all");
  const [dateField, setDateField] = useState<DateField>("service");
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

  const today = todayISO();

  const tabCounts = useMemo(() => {
    const current = bookings.filter(
      (b) =>
        (b.status === "confirmed" || b.status === "pending") && b.date >= today
    ).length;
    return {
      all: bookings.length,
      current,
      completed: bookings.filter((b) => b.status === "completed").length,
      incomplete: bookings.filter((b) => b.status === "pending").length,
      cancelled: bookings.filter((b) => b.status === "cancelled").length,
    };
  }, [bookings, today]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookings.filter((b) => {
      if (tab === "current") {
        if (
          !(
            (b.status === "confirmed" || b.status === "pending") &&
            b.date >= today
          )
        ) {
          return false;
        }
      } else if (tab === "completed" && b.status !== "completed") {
        return false;
      } else if (tab === "incomplete" && b.status !== "pending") {
        return false;
      } else if (tab === "cancelled" && b.status !== "cancelled") {
        return false;
      }

      if (payment !== "all" && b.paymentMethod !== payment) return false;
      if (
        destination !== "all" &&
        (b.transfer?.destination || "") !== destination
      ) {
        return false;
      }
      const dateValue =
        dateField === "service" ? b.date : (b.createdAt || "").slice(0, 10);
      if (!inDateRange(dateValue, dateFrom, dateTo)) return false;
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
  }, [
    bookings,
    query,
    tab,
    payment,
    destination,
    dateFrom,
    dateTo,
    dateField,
    today,
  ]);

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

  const tabs: { id: StatusTab; label: string; count: number }[] = [
    { id: "all", label: "Todos", count: tabCounts.all },
    { id: "current", label: "Reservas actuales", count: tabCounts.current },
    { id: "completed", label: "Realizadas", count: tabCounts.completed },
    {
      id: "incomplete",
      label: "Reservas sin completar",
      count: tabCounts.incomplete,
    },
    {
      id: "cancelled",
      label: "Reservas canceladas",
      count: tabCounts.cancelled,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">Reservas</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Pulse el localizador para ver todos los detalles · {bookings.length}{" "}
            en total
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

      <div className="flex flex-wrap gap-3">
        <input
          className={`${adminInput} min-w-[220px] max-w-sm flex-1`}
          placeholder="Buscar id, cliente, email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className={`${adminInput} max-w-[200px]`}
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
          className={`${adminInput} max-w-[160px]`}
          value={payment}
          onChange={(e) =>
            setPayment(e.target.value as "all" | "card" | "bizum")
          }
        >
          <option value="all">Todo pago</option>
          <option value="card">Tarjeta</option>
          <option value="bizum">Bizum</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-sand-line pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-t-md px-3 py-2 text-sm font-medium ${
              tab === t.id
                ? "bg-white text-ocean ring-1 ring-sand-line ring-b-white"
                : "text-ink-muted hover:bg-sky-soft/60"
            }`}
          >
            {t.label}{" "}
            <span className="font-bold">{t.count}</span>
          </button>
        ))}
      </div>

      <DateRangeFilter
        title="Calendario de clientes"
        hint={
          dateField === "service"
            ? "Rango según día del servicio"
            : "Rango según día de la reserva"
        }
        from={dateFrom}
        to={dateTo}
        onFrom={setDateFrom}
        onTo={setDateTo}
        onClear={() => {
          setDateFrom("");
          setDateTo("");
        }}
        dateField={dateField}
        onDateField={setDateField}
        resultCount={filtered.length}
        defaultPreset="none"
      />

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-sand-line">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="border-b border-sand-line bg-sky-soft text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Fecha servicio</th>
              <th className="px-4 py-3 font-medium">Fecha reserva</th>
              <th className="px-4 py-3 font-medium">Servicio / Cliente</th>
              <th className="px-4 py-3 font-medium">Pago</th>
              <th className="px-4 py-3 font-medium">Importes</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-ink-muted">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-ink-muted">
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
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-ink-muted">
                    {b.createdAt
                      ? formatDate(b.createdAt.slice(0, 10))
                      : "—"}
                  </td>
                  <td className="max-w-[260px] px-4 py-3">
                    <p className="font-medium">{b.tourTitle}</p>
                    <p className="text-xs text-ink-muted">{b.customer.name}</p>
                    <p className="text-xs text-ink-muted">{b.customer.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p>{paymentLabel(b.paymentMethod)}</p>
                    <PaymentBadge status={b.paymentStatus} />
                    {b.invoiceId && (
                      <Link
                        href={`/admin/facturas?id=${b.invoiceId}`}
                        className="mt-1 block text-xs font-bold text-ocean hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {b.invoiceId}
                      </Link>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <p>
                      Total:{" "}
                      <b>{formatPrice(b.amountTotal ?? b.totalPrice)}</b>
                    </p>
                    <p className="text-ink-muted">
                      Tarjeta: {formatPrice(b.amountPaidCard || 0)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1 text-xs font-bold text-ocean">
                      <button
                        type="button"
                        className="text-left hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(b);
                        }}
                      >
                        Detalles
                      </button>
                      {b.status !== "completed" &&
                        b.status !== "cancelled" && (
                          <button
                            type="button"
                            className="text-left hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setBookingStatus(b.id, "completed");
                            }}
                          >
                            Completar
                          </button>
                        )}
                      {b.status !== "cancelled" && (
                        <button
                          type="button"
                          className="text-left text-red-600 hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBookingStatus(b.id, "cancelled");
                          }}
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <BookingDetailModal
          booking={selected}
          onClose={() => setSelected(null)}
          onStatus={setBookingStatus}
          onInvoice={issueInvoice}
        />
      )}

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

function BookingDetailModal({
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-ink">Detalles de reserva</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={booking.status} />
              <p className="text-sm font-bold text-ocean">
                Localizador {booking.id}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-ink-muted hover:bg-sky-soft"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {booking.invoiceId ? (
            <Link
              href={`/admin/facturas?id=${booking.invoiceId}`}
              className="rounded-md border border-ocean px-3 py-1.5 text-xs font-bold text-ocean"
            >
              Factura {booking.invoiceId}
            </Link>
          ) : (
            booking.status !== "cancelled" && (
              <button
                type="button"
                onClick={() => onInvoice(booking.id)}
                className="rounded-md bg-ocean px-3 py-1.5 text-xs font-bold text-white"
              >
                Emitir factura
              </button>
            )
          )}
          {booking.status !== "cancelled" && (
            <button
              type="button"
              onClick={() => onStatus(booking.id, "cancelled")}
              className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-bold text-red-600"
            >
              Cancelar reserva
            </button>
          )}
          {booking.status !== "completed" && booking.status !== "cancelled" && (
            <button
              type="button"
              onClick={() => onStatus(booking.id, "completed")}
              className="rounded-md border border-sand-line px-3 py-1.5 text-xs font-bold"
            >
              Completar
            </button>
          )}
          {booking.status !== "confirmed" && booking.status !== "cancelled" && (
            <button
              type="button"
              onClick={() => onStatus(booking.id, "confirmed")}
              className="rounded-md border border-sand-line px-3 py-1.5 text-xs font-bold"
            >
              Confirmar
            </button>
          )}
        </div>

        <section className="mt-6">
          <h3 className="text-xs font-bold tracking-wide text-ink-muted uppercase">
            Detalles de la reserva
          </h3>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <Row label="Localizador" value={booking.id} />
            <Row
              label="Fecha reserva"
              value={
                booking.createdAt
                  ? formatDate(booking.createdAt.slice(0, 10))
                  : "—"
              }
            />
            <Row label="Fecha servicio" value={formatDate(booking.date)} />
            <Row label="Estado" value={booking.status} />
            <Row
              label="Total"
              value={formatPrice(booking.amountTotal ?? booking.totalPrice)}
            />
            <Row label="Pago" value={paymentLabel(booking.paymentMethod)} />
            <Row
              label="Pagado tarjeta"
              value={formatPrice(booking.amountPaidCard || 0)}
            />
            <Row
              label="Estado pago"
              value={booking.paymentStatus === "paid" ? "PAGADO" : booking.paymentStatus}
            />
          </dl>
        </section>

        <section className="mt-6">
          <h3 className="text-xs font-bold tracking-wide text-ink-muted uppercase">
            Detalles del cliente
          </h3>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <Row label="Nombre" value={booking.customer.name} />
            <Row label="Email" value={booking.customer.email} />
            <Row label="Teléfono" value={booking.customer.phone || "—"} />
          </dl>
        </section>

        <section className="mt-6">
          <h3 className="text-xs font-bold tracking-wide text-ink-muted uppercase">
            Hotel y comentarios
          </h3>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <Row label="Hotel" value={booking.customer.hotel || "—"} />
            <Row
              label="Número de vuelo"
              value={booking.customer.flightNumber || "—"}
            />
            {booking.customer.notes && (
              <div className="sm:col-span-2">
                <Row label="Notas" value={booking.customer.notes} />
              </div>
            )}
          </dl>
        </section>

        <section className="mt-6 rounded-lg bg-sky-soft/40 p-4 ring-1 ring-sand-line">
          <h3 className="text-xs font-bold tracking-wide text-ink-muted uppercase">
            Servicios contratados
          </h3>
          <p className="mt-2 font-bold text-ink">{booking.tourTitle}</p>
          <ul className="mt-2 space-y-1 text-sm text-ink-muted">
            <li>Tipo de traslado: {directionLabel}</li>
            <li>Destino: {booking.transfer?.destination || "—"}</li>
            <li>Personas: {booking.adults}</li>
            <li>
              Precio: {formatPrice(booking.amountTotal ?? booking.totalPrice)}
            </li>
            <li>Fecha de servicio: {formatDate(booking.date)}</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-sand-line/60 py-1.5">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="max-w-[65%] text-right font-medium">{value}</dd>
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

function PaymentBadge({ status }: { status: Booking["paymentStatus"] }) {
  if (status === "paid") {
    return (
      <span className="mt-1 inline-block rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
        PAGADO
      </span>
    );
  }
  return (
    <span className="mt-1 inline-block rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
      {status}
    </span>
  );
}
