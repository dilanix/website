import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProductTabs } from "./product-tabs";

const { scopeQuery } = vi.hoisted(() => ({ scopeQuery: { value: "" } }));

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/products/cost/explorer",
  useSearchParams: () => new URLSearchParams(scopeQuery.value),
}));

afterEach(() => {
  cleanup();
  scopeQuery.value = "";
});

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

  it("preserves Cost connection and target scope between tabs", () => {
    scopeQuery.value = "connection=connection-1&target=target-1";
    render(<ProductTabs slug="cost" />);

    expect(
      screen.getByRole("link", { name: "Overview" }).getAttribute("href"),
    ).toBe("/dashboard/products/cost?connection=connection-1&target=target-1");
    expect(
      screen.getByRole("link", { name: "Allocations" }).getAttribute("href"),
    ).toBe(
      "/dashboard/products/cost/allocations?connection=connection-1&target=target-1",
    );
  }, 20_000);
});
