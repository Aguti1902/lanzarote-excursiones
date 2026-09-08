import type { CashStatus, PaymentMethod, PaymentStatus } from "@/types";

/**
 * Traslados: solo pago online completo (tarjeta / Bizum).
 * deposit_10 y pay_on_day no se tramitan en este proyecto.
 */
export function splitPaymentAmounts(
  total: number,
  _method: PaymentMethod
): {
  amountTotal: number;
  amountPaidCard: number;
  amountDueCash: number;
  amountPaidCash: number;
  paymentStatus: PaymentStatus;
  cashStatus: CashStatus;
} {
  const amountTotal = Math.round(total * 100) / 100;
  return {
    amountTotal,
    amountPaidCard: amountTotal,
    amountDueCash: 0,
    amountPaidCash: 0,
    paymentStatus: "paid",
    cashStatus: "none",
  };
}

export function normalizeTransferPaymentMethod(
  method: PaymentMethod | string | undefined
): "card" | "bizum" {
  return method === "bizum" ? "bizum" : "card";
}
