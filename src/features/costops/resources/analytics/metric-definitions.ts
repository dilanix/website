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

export const CONTAINER_CLUSTER_METRICS: ResourceMetricDefinition = {
  latest: [
    { key: "cpu.utilization", shortLabel: "CPU" },
    { key: "memory.utilization", shortLabel: "Memory" },
  ],
  groups: [
    {
      id: "cpu",
      title: "CPU",
      description:
        "Running-task-weighted utilization across active ECS services",
      keys: ["cpu.utilization"],
      presentation: "distribution",
      chart: "single",
    },
    {
      id: "memory",
      title: "Memory",
      description:
        "Running-task-weighted utilization across active ECS services",
      keys: ["memory.utilization"],
      presentation: "distribution",
      chart: "single",
    },
  ],
};

export const DATABASE_INSTANCE_METRICS: ResourceMetricDefinition = {
  latest: [
    { key: "cpu.utilization", shortLabel: "CPU" },
    { key: "memory.free_bytes", shortLabel: "Free Memory" },
    { key: "database.connections", shortLabel: "Connections" },
    { key: "storage.free_bytes", shortLabel: "Free Storage" },
    { key: "storage.read_latency", shortLabel: "Read Latency" },
    { key: "storage.write_latency", shortLabel: "Write Latency" },
  ],
  groups: [
    {
      id: "compute",
      title: "CPU",
      description: "Database processor utilization",
      keys: ["cpu.utilization"],
      presentation: "distribution",
      chart: "single",
    },
    {
      id: "memory",
      title: "Memory",
      description: "Available memory for the database instance",
      keys: ["memory.free_bytes"],
      presentation: "latest",
      chart: "single",
    },
    {
      id: "connections",
      title: "Connections",
      description: "Active database connection count",
      keys: ["database.connections"],
      presentation: "latest",
      chart: "single",
    },
    {
      id: "storage",
      title: "Storage",
      description: "Available database storage",
      keys: ["storage.free_bytes"],
      presentation: "latest",
      chart: "single",
    },
    {
      id: "latency",
      title: "I/O Latency",
      description: "Read and write operation latency",
      keys: ["storage.read_latency", "storage.write_latency"],
      presentation: "latest",
      chart: "multi",
    },
    {
      id: "network",
      title: "Network Throughput",
      description: "Database receive and transmit throughput",
      keys: ["network.bytes_in", "network.bytes_out"],
      presentation: "latest",
      chart: "multi",
    },
  ],
};

export const SERVERLESS_FUNCTION_METRICS: ResourceMetricDefinition = {
  latest: [
    { key: "requests.count", shortLabel: "Invocations" },
    { key: "errors.count", shortLabel: "Errors" },
    { key: "requests.throttled", shortLabel: "Throttles" },
    { key: "request.duration", shortLabel: "Duration" },
    { key: "concurrency.executions", shortLabel: "Concurrency" },
  ],
  groups: [
    {
      id: "traffic",
      title: "Traffic & Errors",
      description: "Invocation, error, and throttle counts per period",
      keys: ["requests.count", "errors.count", "requests.throttled"],
      presentation: "latest",
      chart: "multi",
    },
    {
      id: "duration",
      title: "Duration",
      description: "Average function execution duration",
      keys: ["request.duration"],
      presentation: "distribution",
      chart: "single",
    },
    {
      id: "concurrency",
      title: "Concurrency",
      description: "Maximum concurrent executions per period",
      keys: ["concurrency.executions"],
      presentation: "latest",
      chart: "single",
    },
  ],
};

export const BLOCK_STORAGE_VOLUME_METRICS: ResourceMetricDefinition = {
  latest: [
    { key: "disk.read_bytes", shortLabel: "Read Bytes" },
    { key: "disk.write_bytes", shortLabel: "Write Bytes" },
    { key: "disk.read_operations", shortLabel: "Read Ops" },
    { key: "disk.write_operations", shortLabel: "Write Ops" },
    { key: "disk.queue_length", shortLabel: "Queue" },
  ],
  groups: [
    {
      id: "throughput",
      title: "Data Transfer",
      description: "Bytes read from and written to the volume per period",
      keys: ["disk.read_bytes", "disk.write_bytes"],
      presentation: "latest",
      chart: "multi",
    },
    {
      id: "operations",
      title: "Operations",
      description: "Read and write operation counts per period",
      keys: ["disk.read_operations", "disk.write_operations"],
      presentation: "latest",
      chart: "multi",
    },
    {
      id: "queue",
      title: "Queue Depth",
      description: "Average number of pending volume operations",
      keys: ["disk.queue_length"],
      presentation: "distribution",
      chart: "single",
    },
  ],
};

export const LOAD_BALANCER_METRICS: ResourceMetricDefinition = {
  latest: [
    { key: "requests.count", shortLabel: "Requests" },
    { key: "request.duration", shortLabel: "Response Time" },
    { key: "errors.server", shortLabel: "Server Errors" },
    { key: "connections.active", shortLabel: "Connections" },
    { key: "targets.healthy", shortLabel: "Healthy Targets" },
    { key: "targets.unhealthy", shortLabel: "Unhealthy Targets" },
  ],
  groups: [
    {
      id: "traffic",
      title: "Traffic",
      description: "Request and active connection counts per period",
      keys: ["requests.count", "connections.active"],
      presentation: "latest",
      chart: "multi",
    },
    {
      id: "latency",
      title: "Response Time",
      description: "Target response latency",
      keys: ["request.duration"],
      presentation: "distribution",
      chart: "single",
    },
    {
      id: "errors",
      title: "Server Errors",
      description: "Target or backend 5XX responses per period",
      keys: ["errors.server"],
      presentation: "latest",
      chart: "single",
    },
    {
      id: "targets",
      title: "Target Health",
      description: "Healthy and unhealthy registered targets",
      keys: ["targets.healthy", "targets.unhealthy"],
      presentation: "latest",
      chart: "multi",
    },
  ],
};

export const RESOURCE_METRIC_DEFINITIONS: Record<
  string,
  ResourceMetricDefinition
> = {
  compute_instance: COMPUTE_INSTANCE_METRICS,
  container_cluster: CONTAINER_CLUSTER_METRICS,
  database_instance: DATABASE_INSTANCE_METRICS,
  serverless_function: SERVERLESS_FUNCTION_METRICS,
  block_storage_volume: BLOCK_STORAGE_VOLUME_METRICS,
  load_balancer: LOAD_BALANCER_METRICS,
};
