import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createTelemetryTokenAction } from "@/app/dashboard/applications/actions";
import type {
  CoreApplication,
  CoreApplicationEnvironment,
  CoreTelemetrySource,
} from "@/lib/core/api";
import { EnvironmentTelemetryClient } from "./environment-telemetry-client";

vi.mock("@/app/dashboard/applications/actions", () => ({
  createTelemetrySourceAction: vi.fn(),
  createTelemetryTokenAction: vi.fn(),
  revokeTelemetryTokenAction: vi.fn(),
  updateEnvironmentAction: vi.fn(),
  updateTelemetrySourceAction: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const application: CoreApplication = {
  id: "app-1",
  organization_id: "org-1",
  name: "Payments",
  slug: "payments",
  description: null,
  status: "active",
  created_at: "2026-09-07T10:00:00Z",
  updated_at: "2026-09-07T10:00:00Z",
};

const environment: CoreApplicationEnvironment = {
  id: "env-1",
  organization_id: "org-1",
  application_id: "app-1",
  name: "Production",
  slug: "production",
  status: "active",
  created_at: "2026-09-07T10:00:00Z",
  updated_at: "2026-09-07T10:00:00Z",
};

const source: CoreTelemetrySource = {
  id: "source-1",
  organization_id: "org-1",
  environment_id: "env-1",
  integration_target_id: null,
  source_type: "otlp",
  name: "Backend OTLP",
  status: "active",
  configuration: { endpoint_path: "/v1/telemetry/logs" },
  last_received_at: null,
  created_at: "2026-09-07T10:00:00Z",
  updated_at: "2026-09-07T10:00:00Z",
};

describe("EnvironmentTelemetryClient", () => {
  it("shows source configuration and reveals a newly created token exactly in the creation flow", async () => {
    vi.mocked(createTelemetryTokenAction).mockResolvedValue({
      data: {
        id: "token-1",
        organization_id: "org-1",
        telemetry_source_id: "source-1",
        token_prefix: "dtx_live_abcd",
        scopes: ["telemetry:logs:write"],
        is_revoked: false,
        expires_at: null,
        last_used_at: null,
        revoked_at: null,
        created_at: "2026-09-07T11:00:00Z",
        token: "dtx_live_abcd_plaintext-once",
      },
    });

    render(
      <EnvironmentTelemetryClient
        application={application}
        initialEnvironment={environment}
        initialSources={[source]}
        initialTokens={{ "source-1": [] }}
        targetOptions={[]}
      />,
    );

    expect(screen.getByText("Endpoint path")).toBeTruthy();
    expect(screen.getByText("/v1/telemetry/logs")).toBeTruthy();
    expect(screen.queryByText("dtx_live_abcd_plaintext-once")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Create token" }));
    const createDialog = screen.getByRole("dialog", {
      name: "Create ingestion token",
    });
    fireEvent.click(
      within(createDialog).getByRole("button", { name: "Create token" }),
    );

    expect(
      await screen.findByRole("dialog", { name: "Ingestion token created" }),
    ).toBeTruthy();
    expect(screen.getByText("dtx_live_abcd_plaintext-once")).toBeTruthy();
  });
});
