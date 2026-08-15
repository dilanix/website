import { describe, expect, test } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  test("joins truthy class names", () => {
    expect(cn("a", false && "b", "c")).toBe("a c");
  });

  test("resolves conflicting Tailwind utilities in favor of the last one", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});
