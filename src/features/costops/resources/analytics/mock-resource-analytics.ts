import type {
  LatestMetric,
  MetricAvailability,
  MetricPoint,
  MetricSeries,
  MetricUnit,
  ResourceAnalytics,
  TimeRange,
} from "./types";

const OBSERVED_AT = "2026-08-20T11:58:00.000Z";
const GENERATED_AT = "2026-08-20T12:00:00.000Z";
const STALE_AT = "2026-08-20T11:37:00.000Z";
const RANGE_SETTINGS: Record<TimeRange, { samples: number; hours: number }> = {
  "24h": { samples: 25, hours: 24 },
  "7d": { samples: 29, hours: 168 },
  "30d": { samples: 31, hours: 720 },
};
const RANGE_FACTORS: Record<TimeRange, number> = {
  "24h": 1,
  "7d": 0.92,
  "30d": 0.86,
};

function points(range: TimeRange, base: number, amplitude: number, phase = 0) {
  const { samples, hours } = RANGE_SETTINGS[range];
  const end = Date.parse(OBSERVED_AT);
  const step = (hours * 60 * 60 * 1000) / (samples - 1);
  return Array.from({ length: samples }, (_, index) => {
    const dailyCycle = Math.sin((index + phase) * 0.68) * amplitude;
    const demandPeak = index % 10 === 7 ? amplitude * 0.82 : 0;
    return {
      timestamp: new Date(
        end - hours * 60 * 60 * 1000 + index * step,
      ).toISOString(),
      value: Math.max(0, Number((base + dailyCycle + demandPeak).toFixed(2))),
    };
  });
}

function summary(seriesPoints: MetricPoint[], totalMultiplier?: number) {
  const values = seriesPoints.map(({ value }) => value).sort((a, b) => a - b);
  return {
    average: values.reduce((sum, value) => sum + value, 0) / values.length,
    p95: values[Math.ceil(values.length * 0.95) - 1],
    maximum: values.at(-1),
    minimum: values[0],
    ...(totalMultiplier
      ? {
          total:
            values.reduce((sum, value) => sum + value, 0) * totalMultiplier,
        }
      : {}),
  };
}

function series(
  key: string,
  label: string,
  unit: MetricUnit,
  seriesPoints: MetricPoint[],
  options: { totalMultiplier?: number; totalUnit?: MetricUnit } = {},
): MetricSeries {
  return {
    key,
    label,
    unit,
    totalUnit: options.totalUnit,
    points: seriesPoints,
    summary: summary(seriesPoints, options.totalMultiplier),
    availability: "available",
  };
}

function buildRange(range: TimeRange) {
  const factor = RANGE_FACTORS[range];
  const { hours, samples } = RANGE_SETTINGS[range];
  const secondsPerSample = (hours * 60 * 60) / (samples - 1);
  const cpu = points(range, 9.4 * factor, 6.8, 0);
  const memory = points(range, 34.8 * factor, 8.1, 2);
  const networkIn = points(range, 1_620_000 * factor, 910_000, 1);
  const networkOut = points(range, 590_000 * factor, 330_000, 4);
  const readBytes = points(range, 730_000 * factor, 410_000, 2);
  const writeBytes = points(range, 1_170_000 * factor, 620_000, 5);
  const rangeSeries = [
    series("cpu.utilization", "CPU utilization", "percent", cpu),
    series("memory.utilization", "Memory utilization", "percent", memory),
    series("network.bytes_in", "Network In", "bytes_per_second", networkIn, {
      totalMultiplier: secondsPerSample,
      totalUnit: "bytes",
    }),
    series("network.bytes_out", "Network Out", "bytes_per_second", networkOut, {
      totalMultiplier: secondsPerSample,
      totalUnit: "bytes",
    }),
    series("disk.read_bytes", "Read throughput", "bytes_per_second", readBytes),
    series(
      "disk.write_bytes",
      "Write throughput",
      "bytes_per_second",
      writeBytes,
    ),
    series("disk.read_iops", "Read IOPS", "iops", points(range, 14, 8, 1)),
    series("disk.write_iops", "Write IOPS", "iops", points(range, 8, 5, 3)),
    series(
      "disk.queue_length",
      "Queue length",
      "count",
      points(range, 0.24, 0.16, 4),
    ),
  ];
  return {
    range,
    startAt: new Date(
      Date.parse(OBSERVED_AT) - hours * 60 * 60 * 1000,
    ).toISOString(),
    endAt: OBSERVED_AT,
    series: Object.fromEntries(
      rangeSeries.map((metric) => [metric.key, metric]),
    ),
    capacityAnalysis: {
      classification: (range === "24h" ? "Low" : "Moderate") as
        "Low" | "Moderate",
      observedMetricKeys: ["cpu.utilization", "memory.utilization"],
    },
  };
}

function latest(
  key: string,
  label: string,
  value: number,
  unit: MetricUnit,
  options: {
    availability?: MetricAvailability;
    timestamp?: string;
    message?: string;
  } = {},
): LatestMetric {
  return {
    key,
    label,
    value: {
      value,
      unit,
      timestamp: options.timestamp ?? OBSERVED_AT,
      availability: options.availability ?? "available",
      message: options.message,
    },
  };
}

const LATEST = [
  latest("cpu.utilization", "CPU utilization", 8.3, "percent"),
  latest("memory.utilization", "Memory utilization", 34.1, "percent"),
  latest("network.bytes_in", "Network In", 1_800_000, "bytes_per_second"),
  latest("network.bytes_out", "Network Out", 620_000, "bytes_per_second", {
    availability: "stale",
    timestamp: STALE_AT,
    message:
      "The latest datapoint is older than the configured 10 minute freshness threshold.",
  }),
  latest("disk.read_iops", "Read IOPS", 14, "iops"),
  latest("disk.write_iops", "Write IOPS", 8, "iops"),
];

const MOCK_ANALYTICS: Omit<ResourceAnalytics, "resourceId"> = {
  generatedAt: GENERATED_AT,
  freshnessThresholdMinutes: 10,
  latest: Object.fromEntries(LATEST.map((metric) => [metric.key, metric])),
  health: {
    overall: {
      key: "health.overall",
      label: "Overall health",
      status: "healthy",
      timestamp: OBSERVED_AT,
    },
    signals: [
      {
        key: "health.instance_check",
        label: "Instance status check",
        status: "healthy",
        timestamp: OBSERVED_AT,
      },
      {
        key: "health.system_check",
        label: "System status check",
        status: "healthy",
        timestamp: OBSERVED_AT,
      },
    ],
  },
  capacity: {
    resourceClass: "t3a.medium",
    attributes: [
      { label: "vCPU", value: "2" },
      { label: "Memory", value: "4 GiB" },
    ],
  },
  ranges: {
    "24h": buildRange("24h"),
    "7d": buildRange("7d"),
    "30d": buildRange("30d"),
  },
};

export function getMockResourceAnalytics(
  resourceId: string,
): ResourceAnalytics {
  return { ...MOCK_ANALYTICS, resourceId };
}

export const MOCK_UNAVAILABLE_MEMORY: LatestMetric = {
  key: "memory.utilization",
  label: "Memory utilization",
  value: {
    value: null,
    unit: "percent",
    timestamp: null,
    availability: "unavailable",
    message: "CloudWatch Agent required",
  },
};

export const MOCK_UNAVAILABLE_MEMORY_SERIES: MetricSeries = {
  key: "memory.utilization",
  label: "Memory utilization",
  unit: "percent",
  points: [],
  availability: "unavailable",
  message: "CloudWatch Agent is required to collect OS-level memory metrics.",
};
