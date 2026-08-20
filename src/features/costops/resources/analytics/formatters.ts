import { formatDateTime, formatRelativeTime } from "../../utils";
import type { MetricUnit } from "./types";

const decimal = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });

export function formatMetricValue(
  value: number | null | undefined,
  unit: MetricUnit,
) {
  if (value === null || value === undefined || !Number.isFinite(value))
    return "—";
  switch (unit) {
    case "percent":
      return `${decimal.format(value)}%`;
    case "bytes":
      return formatBytes(value);
    case "bytes_per_second":
      return `${formatBytes(value)}/s`;
    case "iops":
      return integer.format(value);
    case "count":
      return value < 10 ? decimal.format(value) : integer.format(value);
  }
}

export function formatBytes(value: number) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let scaled = Math.abs(value);
  let index = 0;
  while (scaled >= 1000 && index < units.length - 1) {
    scaled /= 1000;
    index += 1;
  }
  return `${value < 0 ? "−" : ""}${decimal.format(scaled)} ${units[index]}`;
}

export function formatMetricTimestamp(timestamp: string | null) {
  return formatDateTime(timestamp);
}

export function formatMetricRelativeTime(
  timestamp: string | null,
  now: string,
) {
  return timestamp
    ? formatRelativeTime(timestamp, new Date(now).getTime())
    : "Never received";
}
