import { describe, expect, it } from "vitest";
import {
  formatMetadataValue,
  formatRegion,
  resourceDisplayName,
  resourceTypePresentation,
} from "./presentation";
import type { CloudResource } from "./types";

const resource: CloudResource = {
  id: "r1",
  integrationId: "i1",
  provider: "aws",
  resourceType: "compute_instance",
  externalId: "i-123",
  name: null,
  region: "global",
  availabilityZone: null,
  state: null,
  resourceClass: null,
  configuration: {},
  tags: {},
  firstSeenAt: "2026-08-01T00:00:00Z",
  lastSeenAt: "2026-08-20T00:00:00Z",
  createdAt: "2026-08-01T00:00:00Z",
  updatedAt: "2026-08-20T00:00:00Z",
};

describe("resource presentation", () => {
  it("uses external ID when the resource has no name", () =>
    expect(resourceDisplayName(resource)).toBe("i-123"));
  it("presents known and future resource types", () => {
    expect(resourceTypePresentation("compute_instance").short).toBe("EC2");
    expect(resourceTypePresentation("quantum_accelerator").label).toBe(
      "Quantum Accelerator",
    );
  });
  it("formats global resources", () =>
    expect(formatRegion("global")).toBe("Global"));
  it("formats nested metadata without object coercion", () => {
    const value = formatMetadataValue({ enabled: true, members: ["a", "b"] });
    expect(value).toContain('"enabled": true');
    expect(value).not.toBe("[object Object]");
  });
});
