import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DashboardProduct } from "@/lib/data/dashboard-mocks";
import { DashboardShell } from "./dashboard-shell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/settings",
}));

vi.mock("@/app/dashboard/actions", () => ({
  signOutAction: vi.fn(),
}));

const user = {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
};

const products: DashboardProduct[] = [
  {
    id: "automation",
    name: "Automation",
    slug: "automation",
    description: "Workflow automation",
    status: "active",
    href: "/dashboard/products/automation",
    navigation: [
      { label: "Overview", href: "/dashboard/products/automation" },
      { label: "Usage", href: "/dashboard/products/automation/usage" },
      { label: "Docs", href: "/dashboard/products/automation/docs" },
    ],
  },
  {
    id: "cost",
    name: "Cost",
    slug: "cost",
    description: "Cloud cost management",
    status: "active",
    href: "/dashboard/products/cost",
    navigation: [
      { label: "Overview", href: "/dashboard/products/cost" },
      { label: "Usage", href: "/dashboard/products/cost/usage" },
      { label: "Docs", href: "/dashboard/products/cost/docs" },
    ],
  },
  {
    id: "security",
    name: "Security",
    slug: "security",
    description: "Cloud security",
    status: "pending",
    href: "/dashboard/products/security",
    navigation: [],
  },
];

afterEach(cleanup);

describe("DashboardShell", () => {
  it("shows organization-scoped navigation for an effective organization", () => {
    render(
      <DashboardShell
        user={user}
        organization={{ name: "Analytical Engines" }}
        products={[]}
        activeCapabilityCodes={[
          "aws.inventory.read",
          "aws.billing.read",
          "platform.application",
        ]}
      >
        <p>Organization dashboard</p>
      </DashboardShell>,
    );

    expect(screen.getByRole("link", { name: "Overview" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Resources" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Applications" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Costs" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Integrations" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "API Keys" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Billing" })).toBeNull();
    expect(screen.getByText("Analytical Engines")).toBeTruthy();
  });

  it("hides Applications without platform.application capability", () => {
    render(
      <DashboardShell
        user={user}
        organization={{ name: "Analytical Engines" }}
        products={[]}
        activeCapabilityCodes={[
          "aws.inventory.read",
          "aws.billing.read",
        ]}
      >
        <p>Organization dashboard</p>
      </DashboardShell>,
    );

    expect(screen.getByRole("link", { name: "Overview" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Resources" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Applications" })).toBeNull();
    expect(screen.getByRole("link", { name: "Costs" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Integrations" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "API Keys" })).toBeTruthy();
  });

  it("hides capability-owned navigation without an organization grant", () => {
    render(
      <DashboardShell
        user={user}
        organization={{ name: "Analytical Engines" }}
        products={[]}
        activeCapabilityCodes={["aws.inventory.read"]}
      >
        <p>Organization dashboard</p>
      </DashboardShell>,
    );

    expect(screen.getByRole("link", { name: "Resources" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Applications" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Costs" })).toBeNull();
  });

  it("groups active products into a single linked list", () => {
    render(
      <DashboardShell
        user={user}
        organization={{ name: "Analytical Engines" }}
        products={products}
        activeCapabilityCodes={[]}
      >
        <p>Organization dashboard</p>
      </DashboardShell>,
    );

    expect(screen.getByText("Products")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Automation" }).getAttribute("href"),
    ).toBe("/dashboard/products/automation");
    expect(
      screen.getByRole("link", { name: "Cost" }).getAttribute("href"),
    ).toBe("/dashboard/products/cost");
    expect(screen.queryByRole("link", { name: "Security" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Usage" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Docs" })).toBeNull();
    expect(screen.getByText("Workflow automation")).toBeTruthy();
    expect(screen.getByText("Cloud cost management")).toBeTruthy();
    const navigation = within(
      screen.getByRole("navigation", { name: "Dashboard navigation" }),
    );
    expect(
      navigation
        .getByText("Products")
        .compareDocumentPosition(navigation.getByText("Manage")) & 4,
    ).toBe(4);
  });
});
