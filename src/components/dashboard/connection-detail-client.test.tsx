import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  CoreIntegrationCapability,
  CoreIntegrationConnection,
  CoreOrganizationCapability,
  CoreSyncRun,
} from "@/lib/core/api";
import { tourTargetSelector } from "@/lib/tours/anchors";
import {
  CONNECTION_TOUR_KEY,
  connectionActions,
  connectionAnchors,
} from "@/lib/tours/definitions/connection";
import { ConnectionDetailClient } from "./connection-detail-client";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/app/dashboard/integrations/actions", () => ({}));
vi.mock("./sync-panel", () => ({
  SyncPanel: ({ tourRequest }: { tourRequest?: string | null }) => (
    <div data-testid="sync-panel" data-request={tourRequest ?? ""} />
  ),
}));
vi.mock("./targets-panel", () => ({
  TargetsPanel: () => <div data-tour="connection.target" />,
}));

const { usePageTour } = vi.hoisted(() => ({ usePageTour: vi.fn() }));
vi.mock("@/components/tours/tour-provider", () => ({ usePageTour }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const inventory: CoreIntegrationCapability = {
  id: "cap-inventory",
  integration_id: "aws-id",
  slug: "inventory.read",
  name: "Inventory Read",
  description: null,
  status: "active",
};

const granted: CoreOrganizationCapability[] = [
  {
    id: "grant-inventory",
    code: "aws.inventory.read",
    name: "AWS Inventory Read",
    description: null,
    domain: "providers",
    plan_managed: false,
    access_status: "active",
    access_expires_at: null,
    access_sources: ["grant"],
  },
];

function renderConnection({
  status = "connected",
  runs = [],
}: {
  status?: CoreIntegrationConnection["status"];
  runs?: CoreSyncRun[];
} = {}) {
  render(
    <ConnectionDetailClient
      connection={
        {
          id: "c1",
          integration_id: "aws-id",
          name: "AWS Production",
          status,
          external_reference: "123456789012",
          last_verified_at: "2026-10-01T00:00:00Z",
          last_synced_at: null,
        } as CoreIntegrationConnection
      }
      integrationName="Amazon Web Services"
      integrationSlug="aws"
      initialTab="overview"
      capabilities={[inventory]}
      initialConnectionCapabilities={[
        { capability_id: inventory.id, enabled: true, capability: inventory },
      ]}
      initialScopes={[]}
      awsSetup={{
        cloudformation_supported: true,
        cloudformation_url: null,
        external_id: "dlx-1",
        stack_name: "DilanixIntegration",
      }}
      initialTargets={[]}
      initialSyncRuns={runs}
      initialSyncTotal={runs.length}
      initialSyncPolicies={[]}
      initialSyncHealth={[]}
      organizationCapabilities={granted}
    />,
  );
}

const offer = () => usePageTour.mock.calls.at(-1);
const anchored = (name: keyof typeof connectionAnchors) =>
  document.querySelectorAll(tourTargetSelector(connectionAnchors[name]));
function run(action: string) {
  let cleanup: (() => void) | false | void = undefined;
  act(() => {
    cleanup = offer()?.[1].actions[action]();
  });
  return cleanup as (() => void) | false | void;
}

describe("ConnectionDetailClient product tour", () => {
  it("switches to each tab for its steps", () => {
    renderConnection();
    expect(offer()?.[0]).toBe(CONNECTION_TOUR_KEY);
    expect(offer()?.[1].ready).toBe(true);
    for (const name of ["header", "tabs", "details", "cloudData"] as const)
      expect(anchored(name)).toHaveLength(1);

    run(connectionActions.access);
    for (const name of [
      "capabilities",
      "scopes",
      "identity",
      "target",
      "addTarget",
    ] as const)
      expect(anchored(name)).toHaveLength(1);

    run(connectionActions.settings);
    for (const name of ["modify", "lifecycle", "purge"] as const)
      expect(anchored(name)).toHaveLength(1);

    run(connectionActions.overview);
    expect(anchored("details")).toHaveLength(1);
  });

  it("walks the real Add scope form and closes it unsaved", () => {
    renderConnection();
    const close = run(connectionActions.scopeForm);
    expect(screen.getByRole("dialog", { name: "Add scope" })).toBeTruthy();
    expect(anchored("scopeType")).toHaveLength(1);
    expect(anchored("scopeKey")).toHaveLength(1);

    act(() => (close as () => void)());
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("asks the sync panel for its dialogs and newest run", () => {
    renderConnection({ runs: [{ id: "r1" } as CoreSyncRun] });
    const close = run(connectionActions.schedules);
    expect(screen.getByTestId("sync-panel").getAttribute("data-request")).toBe(
      "schedules",
    );
    act(() => (close as () => void)());
    expect(screen.getByTestId("sync-panel").getAttribute("data-request")).toBe(
      "",
    );

    run(connectionActions.latestRun);
    expect(screen.getByTestId("sync-panel").getAttribute("data-request")).toBe(
      "latest-run",
    );
  });

  it("skips what a disabled connection can't show", () => {
    renderConnection({ status: "disabled" });
    expect(run(connectionActions.scopeForm)).toBe(false);
    expect(run(connectionActions.schedules)).toBe(false);
    expect(run(connectionActions.syncNow)).toBe(false);
    expect(run(connectionActions.latestRun)).toBe(false);
  });
});
