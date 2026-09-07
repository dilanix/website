import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  CoreIntegrationTarget,
  CoreSyncJob,
  CoreSyncDatasetHealth,
  CoreSyncPolicy,
  CoreSyncRun,
} from "@/lib/core/api";
import { SyncPanel } from "./sync-panel";

const actions = vi.hoisted(() => ({
  cancelSyncAction: vi.fn(),
  getSyncJobAttemptsAction: vi.fn(),
  getSyncHealthAction: vi.fn(),
  getSyncRunAction: vi.fn(),
  listSyncRunsAction: vi.fn(),
  setSyncPolicyAction: vi.fn(),
  startSyncAction: vi.fn(),
}));

vi.mock("@/app/dashboard/integrations/actions", () => actions);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const enabledPolicy: CoreSyncPolicy = {
  id: "policy-1",
  connection_id: "connection-1",
  target_id: null,
  dataset: "inventory.resources",
  enabled: true,
  interval_seconds: 3 * 3600,
  next_run_at: "2099-09-06T20:00:00Z",
  created_at: "2026-09-06T10:00:00Z",
  updated_at: "2026-09-06T10:00:00Z",
};

const initialHealth: CoreSyncDatasetHealth[] = [
  {
    dataset: "inventory.resources",
    status: "delayed",
    last_successful_sync_at: "2026-09-06T10:00:00Z",
    policy_enabled: true,
    interval_seconds: 3 * 3600,
  },
];

const queuedRun: CoreSyncRun = {
  id: "run-1",
  organization_id: "organization-1",
  connection_id: "connection-1",
  trigger: "manual",
  status: "queued",
  created_at: "2026-09-07T10:00:00Z",
  started_at: null,
  finished_at: null,
};

const completedRun: CoreSyncRun = {
  ...queuedRun,
  id: "run-completed",
  status: "succeeded",
  started_at: "2026-09-07T10:00:00Z",
  finished_at: "2026-09-07T10:01:00Z",
};

const inventoryJob: CoreSyncJob = {
  id: "job-1",
  target_id: "target-1",
  dataset: "inventory.resources",
  scope_key: "",
  strategy: "snapshot",
  status: "succeeded",
  attempt: 1,
  records_read: 120,
  records_created: 30,
  records_updated: 80,
  records_deleted: 10,
  total_stages: null,
  completed_stages: 0,
  current_stage: null,
  error_code: null,
  error_message: null,
  collector_version: "1",
  normalizer_version: "2",
  started_at: "2026-09-07T10:00:00Z",
  heartbeat_at: "2026-09-07T10:01:00Z",
  finished_at: "2026-09-07T10:01:00Z",
  cancel_requested_at: null,
};

const costSummaryJob: CoreSyncJob = {
  ...inventoryJob,
  id: "job-2",
  dataset: "billing.cost_summary",
  scope_key: "2026-09",
  strategy: "windowed",
};

const costUsageJob: CoreSyncJob = {
  ...inventoryJob,
  id: "job-3",
  dataset: "billing.cost_usage",
  scope_key: "2026-09",
  strategy: "windowed",
};

const utilizationJob: CoreSyncJob = {
  ...inventoryJob,
  id: "job-4",
  dataset: "metrics.utilization",
  scope_key: "eu-west-1",
  strategy: "windowed",
};

const utilizationJobIreland: CoreSyncJob = {
  ...utilizationJob,
  id: "job-5",
  scope_key: "eu-west-2",
  records_read: 5,
  records_created: 2,
  records_updated: 3,
  records_deleted: 1,
};

const target: CoreIntegrationTarget = {
  id: "target-1",
  organization_id: "organization-1",
  connection_id: "connection-1",
  target_type: "aws_account",
  external_id: "123456789012",
  display_name: "Production AWS",
  parent_target_id: null,
  status: "verified",
  provider_metadata: {},
  created_at: "2026-09-01T10:00:00Z",
  updated_at: "2026-09-01T10:00:00Z",
};

function renderPanel({
  initialRuns = [],
  initialTotal = 0,
}: {
  initialRuns?: CoreSyncRun[];
  initialTotal?: number;
} = {}) {
  render(
    <SyncPanel
      connectionId="connection-1"
      enabledCapabilitySlugs={["inventory.read"]}
      initialRuns={initialRuns}
      initialTotal={initialTotal}
      initialPolicies={[enabledPolicy]}
      initialHealth={initialHealth}
      initialTargets={[target]}
    />,
  );
}

describe("SyncPanel automatic sync", () => {
  it("shows backend-projected health separately for each dataset", () => {
    renderPanel();

    expect(screen.getByText("Dataset sync health")).not.toBeNull();
    expect(screen.getByText("Delayed")).not.toBeNull();
    expect(screen.getByText("Every 3 hours")).not.toBeNull();
    expect(screen.getByText("Last successful")).not.toBeNull();
  });

  it("shows a compact summary and moves schedule controls into a modal", () => {
    renderPanel();

    expect(screen.getByText("1 of 1 schedule enabled")).not.toBeNull();
    expect(screen.getByText(/Next sync/)).not.toBeNull();
    expect(screen.queryByRole("checkbox")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Configure" }));

    expect(
      screen.getByRole("dialog", { name: "Configure automatic sync" }),
    ).not.toBeNull();
    expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(
      true,
    );
    expect(
      (screen.getByLabelText("Frequency") as HTMLSelectElement).value,
    ).toBe("10800");
  });

  it("saves a dataset toggle immediately and refreshes the compact summary", async () => {
    actions.setSyncPolicyAction.mockResolvedValue({
      data: { ...enabledPolicy, enabled: false, next_run_at: null },
    });
    renderPanel();
    fireEvent.click(screen.getByRole("button", { name: "Configure" }));
    fireEvent.click(screen.getByRole("checkbox"));

    await waitFor(() => {
      expect(actions.setSyncPolicyAction).toHaveBeenCalledWith("connection-1", {
        dataset: "inventory.resources",
        enabled: false,
        interval_seconds: 10800,
      });
    });
    await waitFor(() => {
      expect(screen.getByText("No schedules enabled")).not.toBeNull();
    });
  });

  it("uses backend automatic planning by default", async () => {
    actions.startSyncAction.mockResolvedValue({ data: queuedRun });
    renderPanel();

    fireEvent.click(screen.getAllByRole("button", { name: "Sync now" })[0]);

    expect(
      (screen.getByRole("radio", { name: /Automatic/ }) as HTMLInputElement)
        .checked,
    ).toBe(true);
    expect(screen.queryByRole("checkbox")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Start sync" }));

    await waitFor(() => {
      expect(actions.startSyncAction).toHaveBeenCalledWith(
        "connection-1",
        undefined,
      );
    });
  });

  it("keeps explicit dataset selection as an optional mode", async () => {
    actions.startSyncAction.mockResolvedValue({ data: queuedRun });
    renderPanel();

    fireEvent.click(screen.getAllByRole("button", { name: "Sync now" })[0]);
    fireEvent.click(screen.getByRole("radio", { name: /Select manually/ }));

    expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(
      true,
    );
    fireEvent.click(screen.getByRole("button", { name: "Start sync" }));

    await waitFor(() => {
      expect(actions.startSyncAction).toHaveBeenCalledWith("connection-1", [
        "inventory.resources",
      ]);
    });
  });

  it("shows per-dataset totals and identifies each compact task before revealing its counters", async () => {
    actions.getSyncRunAction.mockResolvedValue({
      data: {
        ...completedRun,
        jobs: [
          inventoryJob,
          costSummaryJob,
          costUsageJob,
          utilizationJob,
          utilizationJobIreland,
        ],
      },
    });
    renderPanel({ initialRuns: [completedRun], initialTotal: 1 });

    const runTrigger = screen.getByText("manual").closest('[role="button"]');
    expect(runTrigger).not.toBeNull();
    fireEvent.click(runTrigger!);

    const task = await screen.findByRole("button", {
      name: /Inventory Resources.*Production AWS.*All configured scopes.*succeeded/i,
    });
    expect(
      screen.getByRole("button", {
        name: /Cost Summary.*Billing period.*2026-09/i,
      }),
    ).not.toBeNull();
    expect(
      screen.getByRole("button", {
        name: /Cost Usage.*Billing period.*2026-09/i,
      }),
    ).not.toBeNull();
    expect(
      screen.getByRole("button", {
        name: /Utilization Metrics.*Region.*eu-west-1/i,
      }),
    ).not.toBeNull();

    const datasetTotals = screen.getByRole("region", {
      name: "Dataset totals",
    });
    const utilizationTotals = within(datasetTotals).getByLabelText(
      "Utilization Metrics (AWS CloudWatch) totals",
    );
    const aggregate = within(utilizationTotals);
    expect(aggregate.getByText("2 tasks")).not.toBeNull();
    expect(aggregate.getByText("125")).not.toBeNull();
    expect(aggregate.getByText("32")).not.toBeNull();
    expect(aggregate.getByText("83")).not.toBeNull();
    expect(aggregate.getByText("11")).not.toBeNull();
    expect(screen.queryByText("Total read")).toBeNull();

    fireEvent.click(task);

    const taskCard = task.closest("article");
    expect(taskCard).not.toBeNull();
    const details = within(taskCard!);
    expect(details.getByText("Read")).not.toBeNull();
    expect(details.getByText("120")).not.toBeNull();
    expect(details.getByText("Created")).not.toBeNull();
    expect(details.getByText("30")).not.toBeNull();
    expect(details.getByText("Updated")).not.toBeNull();
    expect(details.getByText("80")).not.toBeNull();
    expect(details.getByText("Deleted")).not.toBeNull();
    expect(details.getByText("10")).not.toBeNull();
    expect(details.getByText("inventory.resources")).not.toBeNull();
    expect(details.getByText("snapshot")).not.toBeNull();
  });
});
