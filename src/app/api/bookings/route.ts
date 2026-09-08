import { NextResponse } from "next/server";
import {
  addBooking,
  getBookings,
  updateBooking,
  updateBookingStatus,
} from "@/lib/bookings";
import {
  createCreditNoteForBooking,
  createInvoiceForBooking,
} from "@/lib/invoices";
import { normalizeTransferPaymentMethod } from "@/lib/payments";
import { demoPaymentIntentId, refundPaymentIntent } from "@/lib/stripe";
import type { BookingStatus } from "@/types";

export async function GET() {
  const bookings = await getBookings();
  return NextResponse.json({ bookings });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      type,
      tourId,
      tourTitle,
      date,
      serviceTime,
      returnDate,
      returnTime,
      language,
      adults,
      children,
      totalPrice,
      paymentMethod,
      customer,
      transfer,
      stripePaymentIntentId,
    } = body;

    if (!type || !tourTitle || !date || !customer?.name || !customer?.email) {
      return NextResponse.json(
        { error: "Faltan datos obligatorios" },
        { status: 400 }
      );
    }

    let booking = await addBooking({
      type: "transfer",
      tourId,
      tourTitle,
      date,
      serviceTime: serviceTime || undefined,
      returnDate: returnDate || undefined,
      returnTime: returnTime || undefined,
      language: language || undefined,
      adults: Number(adults) || 1,
      children: Number(children) || 0,
      totalPrice: Number(totalPrice) || 0,
      paymentMethod: normalizeTransferPaymentMethod(paymentMethod),
      paymentStatus: "paid",
      customer,
      transfer,
      status: "confirmed",
      refundStatus: "none",
    });

    const pi =
      stripePaymentIntentId || demoPaymentIntentId(booking.id);
    booking =
      (await updateBooking(booking.id, {
        stripePaymentIntentId: pi,
      })) || booking;

    const invoice = await createInvoiceForBooking(booking);

    return NextResponse.json({ booking, invoice }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "No se pudo crear la reserva" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, refund } = body as {
      id: string;
      status?: BookingStatus;
      refund?: boolean;
    };
    if (!id || !status) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const previous = (await getBookings()).find((b) => b.id === id);
    const booking = await updateBookingStatus(id, status);
    if (!booking) {
      return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    }

    let creditNote = null;
    let refundResult = null;
    if (status === "cancelled" && previous?.status !== "cancelled") {
      creditNote = await createCreditNoteForBooking(booking);
      if (refund !== false) {
        refundResult = await refundPaymentIntent(
          booking.stripePaymentIntentId,
          booking.amountPaidCard || booking.amountTotal || booking.totalPrice
        );
        if (refundResult.ok) {
          await updateBooking(booking.id, {
            paymentStatus: "refunded",
            refundStatus: "refunded",
            stripeRefundId: refundResult.refundId,
          });
        } else {
          await updateBooking(booking.id, { refundStatus: "failed" });
        }
      }
    }

    const fresh = (await getBookings()).find((b) => b.id === id) || booking;

    return NextResponse.json({
      booking: fresh,
      creditNote,
      refund: refundResult,
    });
  } catch {
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}
