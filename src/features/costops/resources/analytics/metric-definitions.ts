import type { ResourceMetricDefinition } from "./types";

export const COMPUTE_INSTANCE_METRICS: ResourceMetricDefinition = {
  latest: [
    { key: "cpu.utilization", shortLabel: "CPU" },
    { key: "memory.utilization", shortLabel: "Memory" },
    { key: "network.bytes_in", shortLabel: "Network In" },
    { key: "network.bytes_out", shortLabel: "Network Out" },
    { key: "disk.read_iops", shortLabel: "Read IOPS" },
    { key: "disk.write_iops", shortLabel: "Write IOPS" },
  ],
  groups: [
    {
      id: "cpu",
      title: "CPU",
      description: "Processor utilization",
      keys: ["cpu.utilization"],
      presentation: "distribution",
      chart: "single",
    },
    {
      id: "memory",
      title: "Memory",
      description: "OS-level memory utilization",
      keys: ["memory.utilization"],
      presentation: "distribution",
      chart: "single",
    },
    {
      id: "network",
      title: "Network",
      description: "Traffic volume for the selected period",
      keys: ["network.bytes_in", "network.bytes_out"],
      presentation: "totals",
      chart: "multi",
    },
    {
      id: "storage",
      title: "Storage / EBS Activity",
      description: "Attached block storage activity",
      keys: [
        "disk.read_bytes",
        "disk.write_bytes",
        "disk.read_iops",
        "disk.write_iops",
        "disk.queue_length",
      ],
      presentation: "latest",
      chart: "none",
    },
  ],
};

export const RESOURCE_METRIC_DEFINITIONS: Record<
  string,
  ResourceMetricDefinition
> = {
  compute_instance: COMPUTE_INSTANCE_METRICS,
};
