import { describe, expect, it } from "vitest";
import {
  formatBytes,
  formatMetricRelativeTime,
  formatMetricValue,
} from "./formatters";

describe("resource metric formatters", () => {
  it("formats normalized metric units centrally", () => {
    expect(formatMetricValue(8.34, "percent")).toBe("8.3%");
    expect(formatMetricValue(1_800_000, "bytes_per_second")).toBe("1.8 MB/s");
    expect(formatMetricValue(14, "iops")).toBe("14");
    expect(formatMetricValue(0.125, "seconds")).toBe("125 ms");
    expect(formatMetricValue(1_250, "milliseconds")).toBe("1.3 s");
    expect(formatBytes(2_400_000_000)).toBe("2.4 GB");
  });

  it("formats observation age against the response time", () => {
    expect(
      formatMetricRelativeTime(
        "2026-08-20T11:58:00.000Z",
        "2026-08-20T12:00:00.000Z",
      ),
    ).toBe("2 min ago");
  });

  it("does not format unavailable values as zero", () => {
    expect(formatMetricValue(null, "percent")).toBe("—");
  });
});
