import { describe, expect, it } from "vitest";
import { TOURS } from "./registry";

// Mirrors Core's `modules.onboarding.schema` validation of keys and step ids.
const SEGMENTS = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;

describe("tour registry", () => {
  it("has unique, Core-valid tour keys", () => {
    const keys = TOURS.map((tour) => tour.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const key of keys) {
      expect(key).toMatch(SEGMENTS);
      expect(key.length).toBeLessThanOrEqual(100);
    }
  });

  it.each(TOURS.map((tour) => [tour.key, tour] as const))(
    "%s is a well-formed tour",
    (_key, tour) => {
      expect(Number.isInteger(tour.version)).toBe(true);
      expect(tour.version).toBeGreaterThanOrEqual(1);
      // A per-item page's tour has no fixed route to open.
      if (tour.route !== null)
        expect(tour.route.startsWith("/dashboard/")).toBe(true);
      expect(tour.steps.length).toBeGreaterThan(0);

      const ids = tour.steps.map((step) => step.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const step of tour.steps) {
        expect(step.id).toMatch(SEGMENTS);
        expect(step.id.length).toBeLessThanOrEqual(64);
        expect(step.title.trim()).not.toBe("");
        expect(step.body.trim()).not.toBe("");
        // A prepared step waits for its target, so it must have one.
        if (step.prepare) expect(step.target).toBeTruthy();
      }
    },
  );
});
