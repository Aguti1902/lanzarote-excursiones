import { promises as fs } from "fs";
import path from "path";
import type { Booking, BookingStatus, CashStatus } from "@/types";
import { splitPaymentAmounts } from "@/lib/payments";

const dataPath = path.join(process.cwd(), "src/data/bookings.json");

function normalizeBooking(b: Booking): Booking {
  const total = b.amountTotal ?? b.totalPrice ?? 0;
  const split = splitPaymentAmounts(total, b.paymentMethod);
  return {
    ...b,
    amountTotal: b.amountTotal ?? split.amountTotal,
    amountPaidCard: b.amountPaidCard ?? split.amountPaidCard,
    amountDueCash: b.amountDueCash ?? split.amountDueCash,
    amountPaidCash: b.amountPaidCash ?? 0,
    cashStatus: b.cashStatus ?? split.cashStatus,
    paymentStatus: b.paymentStatus ?? split.paymentStatus,
  };
}

export async function getBookings(): Promise<Booking[]> {
  const raw = await fs.readFile(dataPath, "utf-8");
  const list = JSON.parse(raw) as Booking[];
  return list.map(normalizeBooking);
}

export async function saveBookings(bookings: Booking[]): Promise<void> {
  await fs.writeFile(dataPath, JSON.stringify(bookings, null, 2), "utf-8");
}

export async function addBooking(
  booking: Omit<
    Booking,
    | "id"
    | "createdAt"
    | "status"
    | "amountTotal"
    | "amountPaidCard"
    | "amountDueCash"
    | "amountPaidCash"
    | "cashStatus"
  > & {
    status?: BookingStatus;
    amountTotal?: number;
    amountPaidCard?: number;
    amountDueCash?: number;
    amountPaidCash?: number;
    cashStatus?: CashStatus;
    serviceTime?: string;
    returnDate?: string;
    returnTime?: string;
    language?: string;
    stripePaymentIntentId?: string;
    refundStatus?: Booking["refundStatus"];
  }
): Promise<Booking> {
  const bookings = await getBookings();
  const id = `BK-${1000 + bookings.length + 1}`;
  const method =
    booking.paymentMethod === "bizum" ? "bizum" : "card";
  const split = splitPaymentAmounts(booking.totalPrice, method);
  const created: Booking = {
    ...booking,
    paymentMethod: method,
    ...split,
    amountPaidCash: 0,
    id,
    createdAt: new Date().toISOString(),
    status: booking.status ?? "confirmed",
  };
  bookings.unshift(created);
  await saveBookings(bookings);
  return created;
}

export async function updateBookingStatus(
  id: string,
  status: BookingStatus
): Promise<Booking | null> {
  const bookings = await getBookings();
  const idx = bookings.findIndex((b) => b.id === id);
  if (idx === -1) return null;
  bookings[idx] = { ...bookings[idx], status };
  await saveBookings(bookings);
  return bookings[idx];
}

export async function updateBooking(
  id: string,
  patch: Partial<Booking>
): Promise<Booking | null> {
  const bookings = await getBookings();
  const idx = bookings.findIndex((b) => b.id === id);
  if (idx === -1) return null;
  bookings[idx] = { ...bookings[idx], ...patch };
  await saveBookings(bookings);
  return bookings[idx];
}

export async function markCashCollected(id: string): Promise<Booking | null> {
  const bookings = await getBookings();
  const idx = bookings.findIndex((b) => b.id === id);
  if (idx === -1) return null;
  const b = bookings[idx];
  bookings[idx] = {
    ...b,
    amountPaidCash: b.amountDueCash,
    amountDueCash: 0,
    cashStatus: "collected",
    paymentStatus: "paid",
  };
  await saveBookings(bookings);
  return bookings[idx];
}

export function getCashPending(bookings: Booking[]): Booking[] {
  return bookings.filter(
    (b) =>
      b.status !== "cancelled" &&
      b.cashStatus === "pending" &&
      (b.amountDueCash ?? 0) > 0
  );
}

export function getStats(bookings: Booking[]) {
  const active = bookings.filter((b) => b.status !== "cancelled");
  const revenue = active.reduce((sum, b) => {
    return sum + (b.amountPaidCard || 0) + (b.amountPaidCash || 0);
  }, 0);
  const cashPending = getCashPending(bookings);
  const cashPendingAmount = cashPending.reduce(
    (s, b) => s + (b.amountDueCash || 0),
    0
  );
  const cashCollected = active.reduce((s, b) => s + (b.amountPaidCash || 0), 0);
  const cardCollected = active.reduce((s, b) => s + (b.amountPaidCard || 0), 0);

  const byType = {
    transfer: active.filter((b) => b.type === "transfer").length,
  };
  const byPayment = {
    card: active.filter((b) => b.paymentMethod === "card").length,
    bizum: active.filter((b) => b.paymentMethod === "bizum").length,
  };
  const upcoming = active
    .filter((b) => b.date >= new Date().toISOString().slice(0, 10))
    .sort((a, b) => a.date.localeCompare(b.date));

  const destCounts = new Map<
    string,
    { title: string; count: number; revenue: number }
  >();
  for (const b of active) {
    const key = b.transfer?.destination || b.tourTitle;
    const cur = destCounts.get(key) || {
      title: b.transfer?.destination || b.tourTitle,
      count: 0,
      revenue: 0,
    };
    cur.count += 1;
    cur.revenue += (b.amountPaidCard || 0) + (b.amountPaidCash || 0);
    destCounts.set(key, cur);
  }
  const topDestinations = [...destCounts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const byMonth = new Map<string, number>();
  for (const b of active) {
    const month = (b.createdAt || "").slice(0, 7);
    if (!month) continue;
    byMonth.set(
      month,
      (byMonth.get(month) || 0) +
        (b.amountPaidCard || 0) +
        (b.amountPaidCash || 0)
    );
  }

  return {
    totalBookings: active.length,
    revenue,
    cardCollected,
    cashCollected,
    cashPendingCount: cashPending.length,
    cashPendingAmount,
    pendingPay: cashPending.length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
    byType,
    byPayment,
    topDestinations,
    byMonth: [...byMonth.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, amount]) => ({ month, amount })),
    upcoming: upcoming.slice(0, 8),
    recent: [...bookings].slice(0, 6),
    cashPendingList: cashPending
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 50),
  };
}
