import type { CostDatePreset, CostDateRange } from "./types";

const DAY_MS = 86_400_000;

function utcDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function shiftUtcDays(value: Date, days: number) {
  return new Date(value.getTime() + days * DAY_MS);
}

export function getCostDateRange(
  preset: CostDatePreset,
  now = new Date(),
): CostDateRange {
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );

  if (preset === "current_month") {
    return {
      startDate: utcDate(
        new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)),
      ),
      endDate: utcDate(today),
    };
  }

  if (preset === "last_month") {
    const start = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1),
    );
    const end = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 0),
    );
    return { startDate: utcDate(start), endDate: utcDate(end) };
  }

  const days =
    preset === "last_7_days" ? 7 : preset === "last_90_days" ? 90 : 30;
  return {
    startDate: utcDate(shiftUtcDays(today, -(days - 1))),
    endDate: utcDate(today),
  };
}

export function isValidCostDateRange(range: CostDateRange) {
  return Boolean(
    range.startDate && range.endDate && range.startDate <= range.endDate,
  );
}
