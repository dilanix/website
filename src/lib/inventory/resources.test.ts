import { describe, expect, it } from "vitest";
import {
  formatSpecificationAttributeLabel,
  formatSpecificationAttributeValue,
  formatSpecificationAttributes,
  resourceCategoryLabel,
  resourceLifecycleStatusLabel,
  resourceLifecycleStatusTone,
  resourceSpecificationSummary,
  resourceStatusTone,
  resourceTypeLabel,
} from "./resources";

describe("resourceCategoryLabel", () => {
  it("labels known categories via the override table", () => {
    expect(resourceCategoryLabel("database")).toBe("Database");
  });

  it("humanizes an unrecognized category instead of showing the raw token", () => {
    // No frontend list of "which categories exist" — `resource-panel.tsx` gets
    // that from `listResourceFilters` (Core), never a hardcoded set here. Any
    // category Core adds tomorrow must still render as a plain word.
    expect(resourceCategoryLabel("compute")).toBe("Compute");
    expect(resourceCategoryLabel("container")).toBe("Container");
    expect(resourceCategoryLabel("orchestration")).toBe("Orchestration");
    expect(resourceCategoryLabel("security")).toBe("Security");
  });
});

describe("resourceTypeLabel", () => {
  it("labels a canonical resource_type by humanizing its last dotted segment", () => {
    expect(resourceTypeLabel("container.service")).toBe("Service");
    expect(resourceTypeLabel("network.load_balancer")).toBe("Load balancer");
  });

  it("uses the override table for tokens humanizing alone gets wrong (acronyms, phrasing)", () => {
    expect(resourceTypeLabel("network.vpc")).toBe("VPC");
    expect(resourceTypeLabel("network.nat_gateway")).toBe("NAT gateway");
    expect(resourceTypeLabel("database.instance")).toBe("Database instance");
  });

  it("humanizes an unrecognized future resource_type instead of showing the raw token", () => {
    expect(resourceTypeLabel("future.thing")).toBe("Thing");
  });
});

describe("resourceStatusTone", () => {
  it("treats running/available/active as success", () => {
    expect(resourceStatusTone("running")).toBe("success");
    expect(resourceStatusTone("available")).toBe("success");
    expect(resourceStatusTone("Active")).toBe("success");
  });

  it("treats terminated/deleted/failed as warning", () => {
    expect(resourceStatusTone("terminated")).toBe("warning");
    expect(resourceStatusTone("failed")).toBe("warning");
  });

  it("falls back to neutral for anything else", () => {
    expect(resourceStatusTone("stopped")).toBe("neutral");
    expect(resourceStatusTone("pending")).toBe("neutral");
  });
});

describe("resourceSpecificationSummary", () => {
  it("returns null when no specification has resolved yet", () => {
    expect(resourceSpecificationSummary(null)).toBeNull();
  });

  it("combines vCPU and memory when both are present", () => {
    const summary = resourceSpecificationSummary({
      attributes: { "compute.vcpu": 2, "memory.bytes": 4 * 1024 ** 3 },
    });
    expect(summary).toBe("2 vCPU · 4 GiB");
  });

  it("renders a fractional GiB value with one decimal place", () => {
    const summary = resourceSpecificationSummary({
      attributes: { "memory.bytes": 1.5 * 1024 ** 3 },
    });
    expect(summary).toBe("1.5 GiB");
  });

  it("falls back to MiB below one GiB", () => {
    const summary = resourceSpecificationSummary({
      attributes: { "memory.bytes": 512 * 1024 ** 2 },
    });
    expect(summary).toBe("512 MiB");
  });

  it("renders only what's present, e.g. vCPU with memory still unresolved", () => {
    expect(
      resourceSpecificationSummary({ attributes: { "compute.vcpu": 8 } }),
    ).toBe("8 vCPU");
  });

  it("returns null when attributes contain nothing this summary knows how to render", () => {
    const summary = resourceSpecificationSummary({
      attributes: { "network.performance": "Up to 5 Gigabit" },
    });
    expect(summary).toBeNull();
  });

  it("ignores non-numeric values instead of rendering them raw", () => {
    const summary = resourceSpecificationSummary({
      attributes: { "compute.vcpu": "unknown" },
    });
    expect(summary).toBeNull();
  });
});

describe("formatSpecificationAttributeLabel", () => {
  it("labels known canonical attributes", () => {
    expect(formatSpecificationAttributeLabel("compute.vcpu")).toBe("vCPU");
    expect(formatSpecificationAttributeLabel("memory.bytes")).toBe("Memory");
  });

  it("falls back to the raw key for an unrecognized attribute", () => {
    expect(formatSpecificationAttributeLabel("future.attribute")).toBe(
      "future.attribute",
    );
  });
});

describe("formatSpecificationAttributeValue", () => {
  it("formats a *.bytes value as GiB/MiB, never a raw byte count", () => {
    expect(
      formatSpecificationAttributeValue("memory.bytes", 4 * 1024 ** 3),
    ).toBe("4 GiB");
  });

  it("labels a Mbps value explicitly", () => {
    expect(
      formatSpecificationAttributeValue(
        "storage.ebs_baseline_bandwidth_mbps",
        350,
      ),
    ).toBe("350 Mbps");
  });

  it("labels a MB/s value explicitly — distinct from Mbps (bits vs. bytes)", () => {
    expect(
      formatSpecificationAttributeValue(
        "storage.ebs_baseline_throughput_mb_per_sec",
        43.75,
      ),
    ).toBe("43.75 MB/s");
  });

  it("labels a GHz value explicitly", () => {
    expect(
      formatSpecificationAttributeValue("cpu.sustained_clock_speed_ghz", 2.5),
    ).toBe("2.5 GHz");
  });

  it("renders a boolean as Yes/No, never true/false", () => {
    expect(
      formatSpecificationAttributeValue(
        "storage.instance_store_supported",
        false,
      ),
    ).toBe("No");
    expect(
      formatSpecificationAttributeValue(
        "storage.instance_store_supported",
        true,
      ),
    ).toBe("Yes");
  });

  it("joins an array into a comma-separated string", () => {
    expect(
      formatSpecificationAttributeValue("cpu.architectures", [
        "x86_64",
        "i386",
      ]),
    ).toBe("x86_64, i386");
  });

  it("renders a plain string attribute as-is", () => {
    expect(
      formatSpecificationAttributeValue(
        "network.performance",
        "Up to 5 Gigabit",
      ),
    ).toBe("Up to 5 Gigabit");
  });

  it("renders an unrecognized numeric attribute as a plain number", () => {
    expect(formatSpecificationAttributeValue("compute.vcpu", 2)).toBe("2");
  });
});

describe("formatSpecificationAttributes", () => {
  it("returns an empty list when no specification has resolved yet", () => {
    expect(formatSpecificationAttributes(null)).toEqual([]);
  });

  it("orders known attributes in a fixed, readable order regardless of input order", () => {
    const attributes = formatSpecificationAttributes({
      attributes: { "memory.bytes": 4 * 1024 ** 3, "compute.vcpu": 2 },
    });
    expect(attributes.map((attribute) => attribute.key)).toEqual([
      "compute.vcpu",
      "memory.bytes",
    ]);
  });

  it("labels and formats every attribute", () => {
    const attributes = formatSpecificationAttributes({
      attributes: { "compute.vcpu": 2, "memory.bytes": 4 * 1024 ** 3 },
    });
    expect(attributes).toEqual([
      { key: "compute.vcpu", label: "vCPU", value: "2" },
      { key: "memory.bytes", label: "Memory", value: "4 GiB" },
    ]);
  });

  it("appends unrecognized attributes after known ones, alphabetically", () => {
    const attributes = formatSpecificationAttributes({
      attributes: { "zzz.unknown": "x", "compute.vcpu": 2, "aaa.unknown": "y" },
    });
    expect(attributes.map((attribute) => attribute.key)).toEqual([
      "compute.vcpu",
      "aaa.unknown",
      "zzz.unknown",
    ]);
  });
});

describe("resourceLifecycleStatusLabel", () => {
  it("labels known lifecycle statuses", () => {
    expect(resourceLifecycleStatusLabel("active")).toBe("Active");
    expect(resourceLifecycleStatusLabel("missing")).toBe("Missing");
    expect(resourceLifecycleStatusLabel("out_of_scope")).toBe("Out of scope");
  });

  it("falls back to the raw value for an unrecognized status", () => {
    expect(resourceLifecycleStatusLabel("future_status")).toBe("future_status");
  });
});

describe("resourceLifecycleStatusTone", () => {
  it("treats active as success", () => {
    expect(resourceLifecycleStatusTone("active")).toBe("success");
  });

  it("treats missing as warning", () => {
    expect(resourceLifecycleStatusTone("missing")).toBe("warning");
  });

  it("treats out_of_scope as neutral", () => {
    expect(resourceLifecycleStatusTone("out_of_scope")).toBe("neutral");
  });

  it("falls back to success for an unrecognized status rather than alarming the user", () => {
    expect(resourceLifecycleStatusTone("future_status")).toBe("success");
  });
});
