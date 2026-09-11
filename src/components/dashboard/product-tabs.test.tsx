import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProductTabs } from "./product-tabs";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/products/cost/explorer",
}));

afterEach(cleanup);

describe("ProductTabs", () => {
  it("uses Explorer instead of the generic Usage tab for Cost", () => {
    render(<ProductTabs slug="cost" />);

    const explorer = screen.getByRole("link", { name: "Explorer" });
    expect(explorer.getAttribute("href")).toBe(
      "/dashboard/products/cost/explorer",
    );
    expect(explorer.getAttribute("aria-current")).toBe("page");
    expect(screen.queryByRole("link", { name: "Usage" })).toBeNull();
  }, 20_000);

  it("keeps Usage for generic products", () => {
    render(<ProductTabs slug="dena" />);

    expect(
      screen.getByRole("link", { name: "Usage" }).getAttribute("href"),
    ).toBe("/dashboard/products/dena/usage");
    expect(screen.queryByRole("link", { name: "Explorer" })).toBeNull();
  }, 20_000);
});
