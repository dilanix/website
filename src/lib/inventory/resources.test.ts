import { describe, expect, it } from "vitest";
import {
  formatCapacityAttributes,
  formatSpecificationAttributeLabel,
  formatSpecificationAttributeValue,
  formatSpecificationAttributes,
  resourceCategoryLabel,
  resourceLifecycleStatusLabel,
  resourceLifecycleStatusTone,
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

  it("formats a byte count ending in '_bytes' (not just '.bytes'), e.g. Resource.capacity's storage.size_bytes", () => {
    expect(
      formatSpecificationAttributeValue("storage.size_bytes", 500 * 1024 ** 3),
    ).toBe("500 GiB");
    // Also fixes the pre-existing gap where this specification attribute
    // never got byte-formatted despite ending in "_bytes".
    expect(
      formatSpecificationAttributeValue(
        "storage.instance_store_bytes",
        2 * 1024 ** 3,
      ),
    ).toBe("2 GiB");
  });

  it("labels IOPS, throughput, and DynamoDB capacity units explicitly", () => {
    expect(formatSpecificationAttributeValue("storage.iops", 12000)).toBe(
      "12000 IOPS",
    );
    expect(
      formatSpecificationAttributeValue("storage.throughput_mib_per_sec", 500),
    ).toBe("500 MiB/s");
    expect(
      formatSpecificationAttributeValue("dynamodb.read_capacity_units", 25),
    ).toBe("25 RCU");
    expect(
      formatSpecificationAttributeValue("dynamodb.write_capacity_units", 10),
    ).toBe("10 WCU");
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

describe("formatCapacityAttributes", () => {
  it("returns an empty list for an empty capacity object", () => {
    expect(formatCapacityAttributes({})).toEqual([]);
  });

  it("labels and formats an ECS task's capacity (compute.vcpu + memory.bytes)", () => {
    const attributes = formatCapacityAttributes({
      "compute.vcpu": 2,
      "memory.bytes": 4 * 1024 ** 3,
    });
    expect(attributes).toEqual([
      { key: "compute.vcpu", label: "vCPU", value: "2" },
      { key: "memory.bytes", label: "Memory", value: "4 GiB" },
    ]);
  });

  it("labels and formats an EBS volume's capacity", () => {
    const attributes = formatCapacityAttributes({
      "storage.size_bytes": 500 * 1024 ** 3,
      "storage.iops": 12000,
      "storage.throughput_mib_per_sec": 500,
    });
    expect(attributes).toEqual([
      { key: "storage.size_bytes", label: "Size", value: "500 GiB" },
      { key: "storage.iops", label: "IOPS", value: "12000 IOPS" },
      {
        key: "storage.throughput_mib_per_sec",
        label: "Throughput",
        value: "500 MiB/s",
      },
    ]);
  });

  it("labels and formats a provisioned DynamoDB table's capacity", () => {
    const attributes = formatCapacityAttributes({
      "dynamodb.read_capacity_units": 25,
      "dynamodb.write_capacity_units": 10,
    });
    expect(attributes).toEqual([
      {
        key: "dynamodb.read_capacity_units",
        label: "Read capacity",
        value: "25 RCU",
      },
      {
        key: "dynamodb.write_capacity_units",
        label: "Write capacity",
        value: "10 WCU",
      },
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
