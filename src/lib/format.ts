export function formatPrice(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export function paymentLabel(method: string): string {
  const map: Record<string, string> = {
    card: "Tarjeta (100%)",
    bizum: "Bizum (100%)",
  };
  return map[method] ?? method;
}
