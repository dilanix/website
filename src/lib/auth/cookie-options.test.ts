import { describe, expect, it } from "vitest";
import { authCookieOptions } from "./cookie-options";

describe("authCookieOptions", () => {
  it("creates session cookies when remember me is disabled", () => {
    expect(authCookieOptions(false, 2_592_000)).not.toHaveProperty("maxAge");
  });

  it("preserves the backend lifetime for remembered sessions", () => {
    expect(authCookieOptions(true, 2_592_000)).toMatchObject({
      maxAge: 2_592_000,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  });

  it("does not persist a cookie with an invalid lifetime", () => {
    expect(authCookieOptions(true, 0)).not.toHaveProperty("maxAge");
  });
});
