import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProductTabs } from "./product-tabs";

const { scopeQuery, currentPath } = vi.hoisted(() => ({
  scopeQuery: { value: "" },
  currentPath: { value: "/dashboard/products/cost/explorer" },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => currentPath.value,
  useSearchParams: () => new URLSearchParams(scopeQuery.value),
}));

afterEach(() => {
  cleanup();
  scopeQuery.value = "";
  currentPath.value = "/dashboard/products/cost/explorer";
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

  it("gives Infrastructure exactly Graph and Resources, with Graph as the default", () => {
    currentPath.value = "/dashboard/products/infrastructure";
    render(<ProductTabs slug="infrastructure" />);

    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual(
      ["Graph", "Resources"],
    );
    const graph = screen.getByRole("link", { name: "Graph" });
    expect(graph.getAttribute("href")).toBe(
      "/dashboard/products/infrastructure",
    );
    expect(graph.getAttribute("aria-current")).toBe("page");
  }, 20_000);

  it("keeps Resources active on a resource detail page", () => {
    currentPath.value = "/dashboard/products/infrastructure/resources/r-1";
    render(<ProductTabs slug="infrastructure" />);

    const resources = screen.getByRole("link", { name: "Resources" });
    expect(resources.getAttribute("href")).toBe(
      "/dashboard/products/infrastructure/resources",
    );
    expect(resources.getAttribute("aria-current")).toBe("page");
    expect(
      screen.getByRole("link", { name: "Graph" }).getAttribute("aria-current"),
    ).toBeNull();
  }, 20_000);
});
