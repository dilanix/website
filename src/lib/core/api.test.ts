import { afterEach, describe, expect, it, vi } from "vitest";
import { coreRequest } from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("coreRequest", () => {
  it("handles successful 204 responses without parsing JSON", async () => {
    const response = new Response(null, { status: 204 });
    const json = vi.spyOn(response, "json");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    await expect(
      coreRequest<void>("/v1/resource", "token", { method: "DELETE" }),
    ).resolves.toBeUndefined();
    expect(json).not.toHaveBeenCalled();
  });
});
