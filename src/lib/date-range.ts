export type DateField = "service" | "booking";

export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function daysAgoISO(days: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - (days - 1));
  return toISODate(d);
}

export function todayISO(): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  return toISODate(d);
}

export function defaultLast7Days(): { from: string; to: string } {
  return { from: daysAgoISO(7), to: todayISO() };
}

export function inDateRange(
  value: string | undefined,
  from: string,
  to: string
): boolean {
  if (!from && !to) return true;
  if (!value) return false;
  const day = value.slice(0, 10);
  if (from && day < from) return false;
  if (to && day > to) return false;
  return true;
}

export function formatESDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso.slice(0, 10) + "T12:00:00");
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
