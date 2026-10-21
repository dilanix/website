import { afterEach, describe, expect, it, vi } from "vitest";
import { getMe } from "./api";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("getMe", () => {
  it("times out when Core does not respond within 10 seconds", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>(() => {})),
    );

    const request = getMe("token");
    const expectation = expect(request).rejects.toThrow(
      "Dilanix Core did not respond within 10 seconds. Please try again.",
    );

    await vi.advanceTimersByTimeAsync(10_000);
    await expectation;
  });
});
