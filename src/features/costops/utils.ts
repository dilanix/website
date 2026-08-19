import type { MoneyValue } from "./types";
export function formatCurrency(value: MoneyValue) {
  const amount = Number(value.amount);
  if (!value.currency)
    return new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 2,
    }).format(Number.isFinite(amount) ? amount : 0);
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: value.currency,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}
export function formatPercentage(value: string | null) {
  if (value === null) return "—";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  return `${new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }).format(amount)}%`;
}
export function formatDateTime(value: string | null) {
  return value
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "Never";
}
export function formatRelativeTime(value: string | null, now = Date.now()) {
  if (!value) return "Never";
  const minutes = Math.round((new Date(value).getTime() - now) / 60000);
  if (Math.abs(minutes) < 1) return "Just now";
  if (Math.abs(minutes) < 60)
    return minutes < 0 ? `${Math.abs(minutes)} min ago` : `in ${minutes} min`;
  const hours = Math.round(minutes / 60);
  return hours < 0
    ? `${Math.abs(hours)} hour${hours === -1 ? "" : "s"} ago`
    : `in ${hours} hour${hours === 1 ? "" : "s"}`;
}
