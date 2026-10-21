import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  CoreIntegrationConnection,
  CoreIntegrationTarget,
} from "@/lib/core/api";
import { CostDataScopeSelector } from "./cost-data-scope-selector";

const { navigation } = vi.hoisted(() => ({
  navigation: {
    pathname: "/dashboard/products/cost/explorer",
    query: "",
    replace: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ replace: navigation.replace }),
  useSearchParams: () => new URLSearchParams(navigation.query),
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
  navigation.pathname = "/dashboard/products/cost/explorer";
  navigation.query = "";
  navigation.replace.mockReset();
});

const connection: CoreIntegrationConnection = {
  id: "10000000-0000-4000-8000-000000000001",
  organization_id: "20000000-0000-4000-8000-000000000001",
  integration_id: "30000000-0000-4000-8000-000000000001",
  name: "AWS Production",
  status: "connected",
  configuration: {},
  external_reference: null,
  last_verified_at: "2026-09-01T00:00:00Z",
  last_success_at: null,
  last_error_at: null,
  last_error_code: null,
  created_at: "2026-09-01T00:00:00Z",
  last_synced_at: "2026-09-11T00:00:00Z",
};

const target: CoreIntegrationTarget = {
  id: "40000000-0000-4000-8000-000000000001",
  organization_id: connection.organization_id,
  connection_id: connection.id,
  target_type: "account",
  external_id: "123456789012",
  display_name: "Production account",
  parent_target_id: null,
  status: "verified",
  provider_metadata: {},
  created_at: "2026-09-01T00:00:00Z",
  updated_at: "2026-09-01T00:00:00Z",
};

describe("CostDataScopeSelector", () => {
  it("restores a saved connection scope when the URL has no scope", async () => {
    localStorage.setItem(
      "dilanix.dashboard.filters.v1:anonymous:cost.data-scope",
      JSON.stringify({ connectionId: connection.id, targetId: null }),
    );

    render(
      <CostDataScopeSelector connections={[connection]} targets={[target]} />,
    );

    await waitFor(() =>
      expect(navigation.replace).toHaveBeenCalledWith(
        `/dashboard/products/cost/explorer?connection=${connection.id}`,
        { scroll: false },
      ),
    );
  });

  it("writes a nested connection and target scope to the URL", async () => {
    render(
      <CostDataScopeSelector connections={[connection]} targets={[target]} />,
    );

    fireEvent.change(screen.getByLabelText("Select cost data scope"), {
      target: { value: `target:${target.id}` },
    });

    await waitFor(() =>
      expect(navigation.replace).toHaveBeenCalledWith(
        `/dashboard/products/cost/explorer?connection=${connection.id}&target=${target.id}`,
        { scroll: false },
      ),
    );
  });

  it("is hidden on non-analytics Cost pages", () => {
    navigation.pathname = "/dashboard/products/cost/budgets";
    render(
      <CostDataScopeSelector connections={[connection]} targets={[target]} />,
    );

    expect(screen.queryByLabelText("Select cost data scope")).toBeNull();
  });

  it("does not describe an inaccessible URL scope as organization-wide", () => {
    navigation.query = "connection=50000000-0000-4000-8000-000000000001";
    render(
      <CostDataScopeSelector connections={[connection]} targets={[target]} />,
    );

    expect(screen.getByText("Unavailable cost data scope")).toBeTruthy();
    expect(
      (screen.getByLabelText("Select cost data scope") as HTMLSelectElement)
        .value,
    ).toBe("invalid");
  });
});
