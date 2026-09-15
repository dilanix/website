import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  CoreIntegration,
  CoreIntegrationConnection,
  CoreIntegrationTarget,
} from "@/lib/core/api";
import { CloudConnectionSelector } from "./cloud-connection-selector";

const { navigation } = vi.hoisted(() => ({
  navigation: {
    query: "",
    push: vi.fn(),
    replace: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: navigation.push,
    replace: navigation.replace,
  }),
  useSearchParams: () => new URLSearchParams(navigation.query),
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
  navigation.query = "";
  navigation.push.mockReset();
  navigation.replace.mockReset();
});

const integration: CoreIntegration = {
  id: "integration-1",
  slug: "aws",
  name: "Amazon Web Services",
  description: null,
  category: "cloud",
  status: "active",
  icon_key: "aws",
  connection_supported: true,
};

function connection(id: string, name: string): CoreIntegrationConnection {
  return {
    id,
    organization_id: "organization-1",
    integration_id: integration.id,
    name,
    status: "connected",
    configuration: {},
    external_reference: null,
    last_verified_at: null,
    last_success_at: null,
    last_error_at: null,
    last_error_code: null,
    created_at: "2026-09-01T00:00:00Z",
    last_synced_at: null,
  };
}

function target(
  id: string,
  connectionId: string,
  externalId: string,
): CoreIntegrationTarget {
  return {
    id,
    organization_id: "organization-1",
    connection_id: connectionId,
    target_type: "account",
    external_id: externalId,
    display_name: null,
    parent_target_id: null,
    status: "verified",
    provider_metadata: {},
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-01T00:00:00Z",
  };
}

describe("CloudConnectionSelector", () => {
  it("restores the saved connection when the URL has no connection", async () => {
    const first = connection("connection-1", "Development");
    const second = connection("connection-2", "Production");
    localStorage.setItem(
      "dilanix.dashboard.filters.v1:anonymous:cloud-connection:/dashboard/resources",
      JSON.stringify(second.id),
    );

    render(
      <CloudConnectionSelector
        basePath="/dashboard/resources"
        integrations={[integration]}
        connections={[first, second]}
        selectedConnectionId={first.id}
        showResources
        showCosts
      />,
    );

    await waitFor(() =>
      expect(navigation.replace).toHaveBeenCalledWith(
        "/dashboard/resources?connection=connection-2",
      ),
    );
  });

  it("does not show a target filter when the connection has one or zero targets", () => {
    const first = connection("connection-1", "Development");
    render(
      <CloudConnectionSelector
        basePath="/dashboard/resources"
        integrations={[integration]}
        connections={[first]}
        targets={[target("target-1", first.id, "111111111111")]}
        selectedConnectionId={first.id}
        showResources
        showCosts
      />,
    );

    expect(screen.queryByLabelText("Select target account")).toBeNull();
  });

  it("shows a target filter once a connection has more than one target", () => {
    const first = connection("connection-1", "Development");
    render(
      <CloudConnectionSelector
        basePath="/dashboard/resources"
        integrations={[integration]}
        connections={[first]}
        targets={[
          target("target-1", first.id, "111111111111"),
          target("target-2", first.id, "222222222222"),
        ]}
        selectedConnectionId={first.id}
        showResources
        showCosts
      />,
    );

    expect(screen.getByLabelText("Select target account")).toBeTruthy();
  });

  it("writes the selected target to the URL", async () => {
    const first = connection("connection-1", "Development");
    render(
      <CloudConnectionSelector
        basePath="/dashboard/resources"
        integrations={[integration]}
        connections={[first]}
        targets={[
          target("target-1", first.id, "111111111111"),
          target("target-2", first.id, "222222222222"),
        ]}
        selectedConnectionId={first.id}
        showResources
        showCosts
      />,
    );

    fireEvent.change(screen.getByLabelText("Select target account"), {
      target: { value: "target-2" },
    });

    await waitFor(() =>
      expect(navigation.push).toHaveBeenCalledWith(
        "/dashboard/resources?target=target-2",
      ),
    );
  });
});
