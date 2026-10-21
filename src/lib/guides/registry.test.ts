import { describe, expect, it } from "vitest";
import { GUIDE_VISUALS } from "@/components/guides/visuals";
import { TOURS } from "@/lib/tours/registry";
import { GUIDES, guideDurationLabel } from "./registry";

// Mirrors Core's `modules.onboarding.schema` validation of keys and step ids —
// a guide's progress is stored like a tour's.
const SEGMENTS = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;

describe("guide registry", () => {
  it("has Core-valid keys that no tour uses", () => {
    const keys = [...GUIDES, ...TOURS].map((item) => item.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const guide of GUIDES) {
      expect(guide.key).toMatch(SEGMENTS);
      expect(guide.key.startsWith("guide.")).toBe(true);
    }
  });

  it.each(GUIDES.map((guide) => [guide.key, guide] as const))(
    "%s is a well-formed guide",
    (_key, guide) => {
      expect(Number.isInteger(guide.version)).toBe(true);
      expect(guide.scenes.length).toBeGreaterThan(0);
      const ids = guide.scenes.map((scene) => scene.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const scene of guide.scenes) {
        expect(scene.id).toMatch(SEGMENTS);
        expect(scene.id.length).toBeLessThanOrEqual(64);
        expect(scene.title.trim()).not.toBe("");
        expect(scene.caption.trim()).not.toBe("");
        expect(scene.durationMs).toBeGreaterThanOrEqual(5000);
      }
      // Every scene has a visual, and every visual a scene.
      expect(Object.keys(GUIDE_VISUALS[guide.key] ?? {}).sort()).toEqual(
        [...ids].sort(),
      );
      // It hands over only to tours that exist, in the same place.
      for (const key of guide.tours) {
        const tour = TOURS.find((item) => item.key === key);
        expect(tour).toBeTruthy();
        expect(tour?.section ?? tour?.product).toBe(
          guide.section ?? guide.product,
        );
      }
    },
  );

  it("labels a guide's running time in minutes", () => {
    for (const guide of GUIDES)
      expect(guideDurationLabel(guide)).toMatch(/^\d+ min$/);
  });
});
