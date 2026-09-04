import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
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

afterEach(cleanup);

describe("DashboardShell", () => {
  it("hides organization-scoped navigation when no effective organization exists", () => {
    render(
      <DashboardShell user={user} organization={null} products={[]}>
        <p>Account settings</p>
      </DashboardShell>,
    );

    expect(screen.getByRole("link", { name: "Settings" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Overview" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Resources" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Costs" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Integrations" })).toBeNull();
    expect(screen.queryByRole("link", { name: "API Keys" })).toBeNull();
    expect(screen.queryByText("Organization")).toBeNull();
  });

  it("shows organization-scoped navigation for an effective organization", () => {
    render(
      <DashboardShell
        user={user}
        organization={{ name: "Analytical Engines" }}
        products={[]}
      >
        <p>Organization dashboard</p>
      </DashboardShell>,
    );

    expect(screen.getByRole("link", { name: "Overview" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Resources" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Costs" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Integrations" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "API Keys" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Billing" })).toBeNull();
    expect(screen.getByText("Analytical Engines")).toBeTruthy();
  });
});
