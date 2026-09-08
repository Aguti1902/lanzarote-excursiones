import { NextRequest, NextResponse } from "next/server";
import { getBookings, getStats } from "@/lib/bookings";
import { inDateRange } from "@/lib/date-range";
import type { Booking } from "@/types";

function filterByRange(
  bookings: Booking[],
  from: string,
  to: string,
  field: "service" | "booking"
): Booking[] {
  if (!from && !to) return bookings;
  return bookings.filter((b) => {
    const value = field === "service" ? b.date : (b.createdAt || "").slice(0, 10);
    return inDateRange(value, from, to);
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const field =
    searchParams.get("field") === "service" ? "service" : "booking";

  const all = await getBookings();
  const filtered = filterByRange(all, from, to, field);
  const stats = getStats(filtered);
  return NextResponse.json({
    stats,
    bookings: filtered,
    meta: { from, to, field, total: filtered.length },
  });
}
