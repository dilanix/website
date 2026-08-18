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
export function formatDateTime(value: string | null) {
  return value
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "Never";
}
export function formatRelativeTime(value: string | null) {
  if (!value) return "Never";
  const minutes = Math.round((new Date(value).getTime() - Date.now()) / 60000);
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute");
  return formatter.format(Math.round(minutes / 60), "hour");
}
