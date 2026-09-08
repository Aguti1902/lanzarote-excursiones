import { promises as fs } from "fs";
import path from "path";
import type { Booking, Invoice } from "@/types";
import { getSettings } from "@/lib/content";
import { updateBooking } from "@/lib/bookings";
import { resolveIgicRate, splitInclusiveTax } from "@/lib/tax";

const dataPath = path.join(process.cwd(), "src/data/invoices.json");

export async function getInvoices(): Promise<Invoice[]> {
  try {
    const raw = await fs.readFile(dataPath, "utf-8");
    return JSON.parse(raw) as Invoice[];
  } catch {
    return [];
  }
}

export async function saveInvoices(invoices: Invoice[]): Promise<void> {
  await fs.writeFile(dataPath, JSON.stringify(invoices, null, 2) + "\n", "utf-8");
}

export async function getInvoiceById(id: string): Promise<Invoice | undefined> {
  return (await getInvoices()).find((i) => i.id === id);
}

export async function getInvoicesByBooking(
  bookingId: string
): Promise<Invoice[]> {
  return (await getInvoices()).filter((i) => i.bookingId === bookingId);
}

function nextNumber(invoices: Invoice[], year: number): number {
  const nums = invoices
    .filter((i) => i.id.includes(`-${year}-`))
    .map((i) => i.number);
  return (nums.length ? Math.max(...nums) : 0) + 1;
}

export async function createInvoiceForBooking(
  booking: Booking,
  notes?: string
): Promise<Invoice> {
  const existing = await getInvoicesByBooking(booking.id);
  const already = existing.find(
    (i) => i.type === "invoice" && i.status === "issued"
  );
  if (already) return already;

  const settings = await getSettings();
  const taxRate = resolveIgicRate(settings.taxRate);
  const invoices = await getInvoices();
  const year = new Date().getFullYear();
  const number = nextNumber(invoices, year);
  const id = `FAC-${year}-${String(number).padStart(4, "0")}`;

  const amountTotal = booking.amountTotal ?? booking.totalPrice;
  const { subtotal, taxAmount, total } = splitInclusiveTax(
    amountTotal,
    taxRate
  );

  const invoice: Invoice = {
    id,
    number,
    type: "invoice",
    bookingId: booking.id,
    createdAt: new Date().toISOString(),
    customer: {
      name: booking.customer.name,
      email: booking.customer.email,
      phone: booking.customer.phone,
      taxId: booking.customer.taxId,
    },
    lines: [
      {
        description: booking.tourTitle,
        qty: 1,
        unitPrice: subtotal,
        total: subtotal,
      },
    ],
    subtotal,
    taxRate,
    taxAmount,
    total,
    notes: notes || undefined,
    status: "issued",
  };

  invoices.unshift(invoice);
  await saveInvoices(invoices);
  await updateBooking(booking.id, { invoiceId: invoice.id });
  return invoice;
}

export async function createCreditNoteForBooking(
  booking: Booking
): Promise<Invoice | null> {
  let invoices = await getInvoices();

  let related =
    invoices.find(
      (i) =>
        i.bookingId === booking.id &&
        i.type === "invoice" &&
        i.status === "issued"
    ) ||
    (booking.invoiceId
      ? invoices.find(
          (i) =>
            i.id === booking.invoiceId &&
            i.type === "invoice" &&
            i.status === "issued"
        )
      : undefined);

  if (!related) {
    const amount = booking.amountTotal ?? booking.totalPrice ?? 0;
    if (amount <= 0) return null;
    related = await createInvoiceForBooking(
      booking,
      `Factura emitida automáticamente al cancelar la reserva ${booking.id}.`
    );
    invoices = await getInvoices();
  }

  const already = invoices.find(
    (i) =>
      i.type === "credit_note" &&
      i.status === "issued" &&
      (i.relatedInvoiceId === related!.id || i.bookingId === booking.id)
  );
  if (already) {
    if (!booking.creditNoteId) {
      await updateBooking(booking.id, { creditNoteId: already.id });
    }
    return already;
  }

  const year = new Date().getFullYear();
  const number = nextNumber(invoices, year);
  const id = `ABO-${year}-${String(number).padStart(4, "0")}`;

  const credit: Invoice = {
    id,
    number,
    type: "credit_note",
    bookingId: booking.id,
    createdAt: new Date().toISOString(),
    customer: related.customer,
    lines: related.lines.map((l) => ({
      description: `ABONO · ${l.description}`,
      qty: l.qty,
      unitPrice: -Math.abs(l.unitPrice),
      total: -Math.abs(l.total),
    })),
    subtotal: -Math.abs(related.subtotal),
    taxRate: related.taxRate,
    taxAmount: -Math.abs(related.taxAmount),
    total: -Math.abs(related.total),
    relatedInvoiceId: related.id,
    notes: `Abono por cancelación de reserva ${booking.id}. Anula ${related.id}.`,
    status: "issued",
  };

  invoices.unshift(credit);
  await saveInvoices(invoices);
  await updateBooking(booking.id, { creditNoteId: credit.id });
  return credit;
}

export function invoiceStats(invoices: Invoice[]) {
  const issued = invoices.filter((i) => i.status === "issued");
  const invoicesSum = issued
    .filter((i) => i.type === "invoice")
    .reduce((s, i) => s + i.total, 0);
  const creditsSum = issued
    .filter((i) => i.type === "credit_note")
    .reduce((s, i) => s + i.total, 0);
  return {
    countInvoices: issued.filter((i) => i.type === "invoice").length,
    countCredits: issued.filter((i) => i.type === "credit_note").length,
    invoicesSum,
    creditsSum,
    net: invoicesSum + creditsSum,
  };
}
