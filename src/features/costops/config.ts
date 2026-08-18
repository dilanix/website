import type {
  CostDatePreset,
  CostSeriesGroupBy,
  OverviewPeriod,
} from "./types";

export type SelectOption<T extends string> = {
  value: T;
  label: string;
};

export const OVERVIEW_PERIOD_OPTIONS = [
  { value: "last_7_days", label: "7D" },
  { value: "last_30_days", label: "30D" },
  { value: "last_90_days", label: "90D" },
  { value: "current_month", label: "This month" },
] as const satisfies readonly SelectOption<OverviewPeriod>[];

export const OVERVIEW_PERIOD_METADATA = {
  current_month: {
    currentLabel: "Current month",
    comparisonLabel: "vs. last month",
  },
  last_7_days: {
    currentLabel: "Last 7 days",
    comparisonLabel: "vs. previous 7 days",
  },
  last_30_days: {
    currentLabel: "Last 30 days",
    comparisonLabel: "vs. previous 30 days",
  },
  last_90_days: {
    currentLabel: "Last 90 days",
    comparisonLabel: "vs. previous 90 days",
  },
} as const satisfies Record<
  OverviewPeriod,
  { currentLabel: string; comparisonLabel: string }
>;

export const TREND_RANGE_OPTIONS = [
  { value: "last_7_days", label: "7D" },
  { value: "last_30_days", label: "30D" },
  { value: "last_90_days", label: "90D" },
] as const satisfies readonly SelectOption<CostDatePreset>[];

export const COST_RANGE_OPTIONS = [
  ...TREND_RANGE_OPTIONS,
  { value: "current_month", label: "This month" },
  { value: "last_month", label: "Last month" },
] as const satisfies readonly SelectOption<CostDatePreset>[];

export const COST_GROUP_OPTIONS = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
] as const satisfies readonly SelectOption<CostSeriesGroupBy>[];
