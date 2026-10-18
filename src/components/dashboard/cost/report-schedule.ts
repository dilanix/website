/**
 * Client-side translation between a friendly schedule picker (on-demand
 * only / every day / every week / every month / custom cron) and the raw
 * 5-field cron string Core's `Report.schedule_cron` actually stores — Core
 * validates and computes `next_run_at` from whatever cron string it
 * receives (`ReportService`/`croniter`), so this module never needs to be
 * kept in exact sync with Core's own cron parser: a friendly pick always
 * produces a cron string Core accepts, and any cron string Core already
 * accepts (including one authored outside this picker) either round-trips
 * through a recognized friendly shape or falls back to "Custom" showing the
 * raw text untouched.
 *
 * Every schedule here runs in UTC — Core computes `next_run_at` from
 * `datetime.now(UTC)`, so the picker asks for a UTC time rather than
 * silently converting the viewer's local time and drifting from what the
 * server will actually do.
 */

export type ScheduleMode = "none" | "daily" | "weekly" | "monthly" | "custom";

export interface FriendlySchedule {
  mode: ScheduleMode;
  hour: number;
  minute: number;
  /** 0 (Sunday) – 6 (Saturday), used when `mode === "weekly"`. */
  dayOfWeek: number;
  /** 1–28, used when `mode === "monthly"` — capped at 28 so every month has
   * that day, rather than a day that silently skips short months. */
  dayOfMonth: number;
  /** Raw cron text — authoritative when `mode === "custom"`; otherwise kept
   * as the last-known cron string purely so switching away and back to
   * "Custom" doesn't lose what was there. */
  cron: string;
}

const WEEKDAY_CODES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

export const WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const DEFAULT_SCHEDULE: FriendlySchedule = {
  mode: "none",
  hour: 8,
  minute: 0,
  dayOfWeek: 1,
  dayOfMonth: 1,
  cron: "",
};

export function scheduleToCron(schedule: FriendlySchedule): string | null {
  const minute = String(schedule.minute);
  const hour = String(schedule.hour);
  switch (schedule.mode) {
    case "none":
      return null;
    case "daily":
      return `${minute} ${hour} * * *`;
    case "weekly":
      return `${minute} ${hour} * * ${WEEKDAY_CODES[schedule.dayOfWeek]}`;
    case "monthly":
      return `${minute} ${hour} ${schedule.dayOfMonth} * *`;
    case "custom":
      return schedule.cron.trim() || null;
  }
}

export function cronToSchedule(cronExpression: string | null): FriendlySchedule {
  if (!cronExpression) return DEFAULT_SCHEDULE;

  const parts = cronExpression.trim().split(/\s+/);
  if (parts.length !== 5) {
    return { ...DEFAULT_SCHEDULE, mode: "custom", cron: cronExpression };
  }

  const [minuteField, hourField, domField, monthField, dowField] = parts;
  const minute = Number(minuteField);
  const hour = Number(hourField);
  const isTimeOfDay =
    Number.isInteger(minute) &&
    minute >= 0 &&
    minute <= 59 &&
    Number.isInteger(hour) &&
    hour >= 0 &&
    hour <= 23 &&
    monthField === "*";

  if (isTimeOfDay && domField === "*" && dowField === "*") {
    return { ...DEFAULT_SCHEDULE, mode: "daily", hour, minute, cron: cronExpression };
  }

  if (isTimeOfDay && domField === "*" && dowField !== "*") {
    const dayOfWeek = WEEKDAY_CODES.indexOf(dowField.toUpperCase() as (typeof WEEKDAY_CODES)[number]);
    if (dayOfWeek >= 0) {
      return { ...DEFAULT_SCHEDULE, mode: "weekly", hour, minute, dayOfWeek, cron: cronExpression };
    }
  }

  if (isTimeOfDay && dowField === "*" && domField !== "*") {
    const dayOfMonth = Number(domField);
    if (Number.isInteger(dayOfMonth) && dayOfMonth >= 1 && dayOfMonth <= 28) {
      return { ...DEFAULT_SCHEDULE, mode: "monthly", hour, minute, dayOfMonth, cron: cronExpression };
    }
  }

  return { ...DEFAULT_SCHEDULE, mode: "custom", cron: cronExpression };
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function describeSchedule(cronExpression: string | null): string {
  const schedule = cronToSchedule(cronExpression);
  const time = `${pad(schedule.hour)}:${pad(schedule.minute)} UTC`;
  switch (schedule.mode) {
    case "none":
      return "On-demand only";
    case "daily":
      return `Every day at ${time}`;
    case "weekly":
      return `Every ${WEEKDAY_LABELS[schedule.dayOfWeek]} at ${time}`;
    case "monthly":
      return `Day ${schedule.dayOfMonth} of every month at ${time}`;
    case "custom":
      return `Custom schedule: ${cronExpression}`;
  }
}

export const PERIOD_PRESET_LABELS: Record<
  "last_7_days" | "last_30_days" | "last_month" | "month_to_date" | "last_quarter" | "last_year",
  string
> = {
  last_7_days: "Last 7 days",
  last_30_days: "Last 30 days",
  last_month: "Last calendar month",
  month_to_date: "Month to date",
  last_quarter: "Last calendar quarter",
  last_year: "Last calendar year",
};
