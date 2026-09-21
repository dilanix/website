import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CoreCostSummary, CoreIntegrationTarget } from "@/lib/core/api";
import { CostSummaryPanel } from "./cost-summary-panel";

vi.mock("@/app/dashboard/integrations/actions", () => ({
  listCostSummariesAction: vi.fn(),
  getCostSummaryTotalsAction: vi.fn().mockResolvedValue({
    data: {
      cost_basis: "net_unblended",
      period_start: "2026-09-01T00:00:00Z",
      period_end: "2026-09-02T00:00:00Z",
      total_amount: "0",
      currency: null,
      is_estimated: false,
      daily: [],
    },
  }),
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const costSummary: CoreCostSummary = {
  id: "summary-1",
  organization_id: "org-1",
  connection_id: "conn-1",
  target_id: "target-1",
  billing_authority: "AWS",
  service_provider: "AWS",
  service_name: "Amazon EC2",
  charge_type: null,
  period_start: "2026-09-01T00:00:00Z",
  period_end: "2026-09-02T00:00:00Z",
  granularity: "daily",
  cost_basis: "net_unblended",
  amount: "12.50",
  currency: "USD",
  is_estimated: false,
  source_type: "cost_explorer",
  sync_job_id: "job-1",
  collector_version: "1",
  normalizer_version: "1",
  created_at: "2026-09-02T00:00:00Z",
  updated_at: "2026-09-02T00:00:00Z",
};

const targets: CoreIntegrationTarget[] = [
  {
    id: "target-1",
    organization_id: "org-1",
    connection_id: "conn-1",
    target_type: "account",
    external_id: "111111111111",
    display_name: "Production account",
    parent_target_id: null,
    status: "verified",
    provider_metadata: {},
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-01T00:00:00Z",
  },
  {
    id: "target-2",
    organization_id: "org-1",
    connection_id: "conn-1",
    target_type: "account",
    external_id: "222222222222",
    display_name: null,
    parent_target_id: null,
    status: "verified",
    provider_metadata: {},
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-01T00:00:00Z",
  },
];

describe("CostSummaryPanel", () => {
  it("shows the target account label once the connection has more than one target", () => {
    render(
      <CostSummaryPanel
        connectionId="conn-1"
        targets={targets}
        costReadEnabled
        connectionSettingsHref="/dashboard/integrations/conn-1"
        initialCostSummaries={[costSummary]}
        initialTotal={1}
      />,
    );

    expect(screen.getByText("Production account")).toBeTruthy();
    expect(screen.getByText("Target account")).toBeTruthy();
  });

  it("omits the target column for a single-target connection", () => {
    render(
      <CostSummaryPanel
        connectionId="conn-1"
        targets={[targets[0]]}
        costReadEnabled
        connectionSettingsHref="/dashboard/integrations/conn-1"
        initialCostSummaries={[costSummary]}
        initialTotal={1}
      />,
    );

    expect(screen.queryByText("Production account")).toBeNull();
    expect(screen.queryByText("Target account")).toBeNull();
  });
});
