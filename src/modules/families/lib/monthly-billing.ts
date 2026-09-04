export const FAMILY_BILLING_TIME_ZONE = "America/Argentina/Buenos_Aires";

export function getBillingPeriod(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: FAMILY_BILLING_TIME_ZONE, year: "numeric", month: "2-digit" }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  if (!year || !month) throw new Error("billing_period_unavailable");
  return new Date(Date.UTC(Number(year), Number(month) - 1, 1));
}

export function formatBillingPeriod(period: Date) {
  return new Intl.DateTimeFormat("es-AR", { timeZone: "UTC", month: "long", year: "numeric" }).format(period);
}