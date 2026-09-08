import { NextResponse } from "next/server";
import { getBookings, updateBooking, updateBookingStatus } from "@/lib/bookings";
import { createCreditNoteForBooking } from "@/lib/invoices";
import { refundPaymentIntent } from "@/lib/stripe";

/**
 * Cancelación pública (cliente) o admin:
 * body: { booking_id|id, email?, refund?: boolean }
 * Si email viene, se valida (flujo cliente). Sin email = panel admin.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const bookingId = String(body.booking_id || body.id || "")
      .trim()
      .toUpperCase();
    const email = body.email != null ? String(body.email).trim().toLowerCase() : "";
    const wantRefund = body.refund !== false;

    if (!bookingId) {
      return NextResponse.json({ error: "Falta el localizador" }, { status: 400 });
    }

    const bookings = await getBookings();
    const found = bookings.find((b) => b.id.toUpperCase() === bookingId);
    if (!found) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
    }

    if (email && found.customer.email.toLowerCase() !== email) {
      return NextResponse.json(
        { error: "Email no coincide con la reserva" },
        { status: 403 }
      );
    }

    if (found.status === "cancelled") {
      return NextResponse.json({
        booking: found,
        creditNote: null,
        refund: null,
        message: "La reserva ya estaba cancelada",
      });
    }

    const booking = await updateBookingStatus(found.id, "cancelled");
    if (!booking) {
      return NextResponse.json({ error: "No se pudo cancelar" }, { status: 500 });
    }

    const creditNote = await createCreditNoteForBooking(booking);

    let refund = null;
    if (wantRefund) {
      const result = await refundPaymentIntent(
        booking.stripePaymentIntentId,
        booking.amountPaidCard || booking.amountTotal || booking.totalPrice
      );
      if (result.ok) {
        await updateBooking(booking.id, {
          paymentStatus: "refunded",
          refundStatus: "refunded",
          stripeRefundId: result.refundId,
        });
        refund = result;
      } else {
        await updateBooking(booking.id, { refundStatus: "failed" });
        refund = result;
      }
    }

    const fresh =
      (await getBookings()).find((b) => b.id === booking.id) || booking;

    return NextResponse.json({
      booking: fresh,
      creditNote,
      refund,
      message: refund?.ok
        ? refund.simulated
          ? "Reserva cancelada. Abono emitido. Reembolso simulado (configure STRIPE_SECRET_KEY)."
          : "Reserva cancelada. Abono emitido y reembolso Stripe procesado."
        : "Reserva cancelada. Abono emitido." +
          (refund?.error ? ` Reembolso: ${refund.error}` : ""),
    });
  } catch {
    return NextResponse.json({ error: "Error al cancelar" }, { status: 500 });
  }
}
