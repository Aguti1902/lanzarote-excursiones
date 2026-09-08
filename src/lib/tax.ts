/** IGIC Canarias — tipo general habitual en servicios turísticos (7%). */
export const DEFAULT_IGIC_RATE = 7;

export function resolveIgicRate(settingsRate?: number | null): number {
  if (typeof settingsRate === "number" && settingsRate >= 0) {
    return settingsRate;
  }
  return DEFAULT_IGIC_RATE;
}

/**
 * El precio de venta es con IGIC incluido.
 * Devuelve base imponible + cuota IGIC que suman exactamente el total.
 */
export function splitInclusiveTax(
  totalGross: number,
  taxRatePercent: number
): { subtotal: number; taxAmount: number; total: number } {
  const total = Math.round(totalGross * 100) / 100;
  if (taxRatePercent <= 0) {
    return { subtotal: total, taxAmount: 0, total };
  }
  const subtotal = Math.round((total / (1 + taxRatePercent / 100)) * 100) / 100;
  const taxAmount = Math.round((total - subtotal) * 100) / 100;
  return { subtotal, taxAmount, total };
}

export function taxLabel(rate: number): string {
  return `IGIC (${rate}%)`;
}
