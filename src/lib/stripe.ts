import Stripe from "stripe";

let stripeClient: Stripe | null | undefined;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (stripeClient === undefined) {
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

export type RefundResult = {
  ok: boolean;
  simulated: boolean;
  refundId?: string;
  error?: string;
};

/** Reembolso Stripe. Sin clave secreta, simula el reembolso (modo demo). */
export async function refundPaymentIntent(
  paymentIntentId: string | undefined,
  amountEuros?: number
): Promise<RefundResult> {
  if (!paymentIntentId) {
    return {
      ok: false,
      simulated: false,
      error: "La reserva no tiene pago Stripe asociado",
    };
  }

  const stripe = getStripe();
  if (!stripe) {
    return {
      ok: true,
      simulated: true,
      refundId: `re_sim_${Date.now()}`,
    };
  }

  try {
    const params: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
    };
    if (typeof amountEuros === "number" && amountEuros > 0) {
      params.amount = Math.round(amountEuros * 100);
    }
    const refund = await stripe.refunds.create(params);
    return { ok: true, simulated: false, refundId: refund.id };
  } catch (err) {
    return {
      ok: false,
      simulated: false,
      error: err instanceof Error ? err.message : "Error Stripe al reembolsar",
    };
  }
}

export function demoPaymentIntentId(bookingId: string): string {
  return `pi_demo_${bookingId.replace(/[^a-zA-Z0-9]/g, "")}`;
}
