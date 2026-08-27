import { describe, expect, it } from "vitest";
import { resourceCategoryLabel, resourceStatusTone } from "./resources";

describe("resourceCategoryLabel", () => {
  it("labels known categories", () => {
    expect(resourceCategoryLabel("compute")).toBe("Compute");
    expect(resourceCategoryLabel("database")).toBe("Database");
  });

  it("falls back to the raw category for an unknown value", () => {
    expect(resourceCategoryLabel("security")).toBe("security");
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
