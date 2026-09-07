import { describe, expect, it } from "vitest";
import { CoreApiError } from "@/lib/core/api";
import { automaticSyncErrorMessage } from "./errors";

describe("automaticSyncErrorMessage", () => {
  it("replaces the backend diagnostic and removes the connection UUID", () => {
    const error = new CoreApiError(
      "connection c328ae26-c7d3-4664-90e3-4d7d73fb3b3a has no dataset eligible for automatic sync given its active product access, enabled capabilities, and connection capabilities",
      409,
    );

    const result = automaticSyncErrorMessage(error);

    expect(result).toContain("Automatic sync could not find");
    expect(result).toContain("Select manually");
    expect(result).not.toContain("c328ae26-c7d3-4664-90e3-4d7d73fb3b3a");
  });

  it("does not rewrite unrelated conflicts", () => {
    expect(
      automaticSyncErrorMessage(
        new CoreApiError("A sync is already running.", 409),
      ),
    ).toBeNull();
  });
});
