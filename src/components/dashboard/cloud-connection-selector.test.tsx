import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  CoreIntegration,
  CoreIntegrationConnection,
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
});
