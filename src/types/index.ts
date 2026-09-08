export type PaymentMethod = "card" | "bizum" | "pay_on_day" | "deposit_10";
export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";
export type BookingType = "transfer";
export type PaymentStatus = "unpaid" | "paid" | "pay_on_day" | "partial";
export type CashStatus = "pending" | "collected" | "waived" | "none";

export interface TransferDestination {
  id: string;
  name: string;
  slug: string;
  priceOneWay: number;
  priceReturn: number;
  duration: string;
  distance: string;
}

export interface SiteSettings {
  brandName: string;
  tagline: string;
  phone: string;
  email: string;
  hours: string;
  homeHeadline: string;
  homeSubheadline: string;
  homeHeroImage: string;
  aboutTitle: string;
  aboutLead: string;
  aboutText: string;
  aboutImage: string;
  aboutImageSecondary: string;
  aboutValues: string;
  aboutPromise: string;
  transferIntro: string;
  transferHeroImage: string;
  contactAddress?: string;
  seoTitle?: string;
  seoDescription?: string;
  companyLegalName?: string;
  companyTaxId?: string;
  companyAddress?: string;
  taxRate?: number;
}

export interface TransfersData {
  destinations: TransferDestination[];
  highlights: string[];
}

export interface Booking {
  id: string;
  createdAt: string;
  type: BookingType;
  tourId?: string;
  tourTitle: string;
  date: string;
  adults: number;
  children: number;
  totalPrice: number;
  amountTotal: number;
  amountPaidCard: number;
  amountDueCash: number;
  amountPaidCash: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  cashStatus: CashStatus;
  status: BookingStatus;
  invoiceId?: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    hotel?: string;
    cruiseShip?: string;
    flightNumber?: string;
    notes?: string;
    taxId?: string;
  };
  transfer?: {
    destination: string;
    direction: "airport_to_hotel" | "hotel_to_airport" | "return";
  };
}

export interface InvoiceLine {
  description: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  number: number;
  type: "invoice" | "credit_note";
  bookingId: string;
  createdAt: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
    taxId?: string;
  };
  lines: InvoiceLine[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  relatedInvoiceId?: string;
  notes?: string;
  status: "issued" | "void";
}
