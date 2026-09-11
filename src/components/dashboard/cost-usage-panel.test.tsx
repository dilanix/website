import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CoreCostUsage } from "@/lib/core/api";
import { CostUsagePanel } from "./cost-usage-panel";

vi.mock("@/app/dashboard/integrations/actions", () => ({
  listCostUsageAction: vi.fn(),
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const row: CoreCostUsage = {
  id: "usage-1",
  organization_id: "org-1",
  connection_id: "conn-1",
  target_id: "target-1",
  billing_account_id: "payer-1",
  billing_account_name: "Main payer",
  billing_account_type: "billing",
  sub_account_id: "account-1",
  sub_account_name: "Production account",
  sub_account_type: "linked",
  invoice_id: "invoice-1",
  invoice_issuer_name: "AWS",
  billing_period_start: "2026-09-01T00:00:00Z",
  billing_period_end: "2026-10-01T00:00:00Z",
  charge_period_start: "2026-09-07T00:00:00Z",
  charge_period_end: "2026-09-08T00:00:00Z",
  provider_name: "AWS",
  publisher_name: "Amazon Web Services",
  service_category: "Compute",
  service_name: "Amazon ECS",
  service_subcategory: "Containers",
  resource_id: "service/production/api",
  resource_name: "api",
  resource_type: "AWS::ECS::Service",
  region_id: "eu-west-1",
  region_name: "EU (Ireland)",
  availability_zone: "eu-west-1a",
  sku_id: "sku-1",
  sku_meter: "vCPU-hours",
  sku_price_id: "price-1",
  sku_price_details: { tier: "standard" },
  charge_category: "Usage",
  charge_class: "On-Demand",
  charge_description: "Fargate vCPU usage",
  charge_frequency: "Usage-Based",
  pricing_category: "Standard",
  pricing_quantity: "10",
  pricing_unit: "hours",
  consumed_quantity: "10",
  consumed_unit: "vCPU-hours",
  billing_currency: "USD",
  pricing_currency: "USD",
  billed_cost: "2.00",
  effective_cost: "1.50",
  list_cost: "2.25",
  contracted_cost: "1.80",
  list_unit_price: "0.225",
  contracted_unit_price: "0.18",
  pricing_currency_effective_cost: "1.50",
  pricing_currency_list_unit_price: "0.225",
  pricing_currency_contracted_unit_price: "0.18",
  commitment_discount_id: "sp-1",
  commitment_discount_type: "SavingsPlan",
  commitment_discount_category: "Spend commitment",
  commitment_discount_status: "Used",
  commitment_discount_name: "Compute SP",
  commitment_discount_quantity: "1",
  commitment_discount_unit: "hour",
  capacity_reservation_id: "cr-1",
  capacity_reservation_status: "Used",
  tags: { Environment: "production" },
  provider_extra: { x_Operation: "FargateTask" },
  billing_authority: "AWS",
  source_type: "focus_1_2",
  export_arn: "arn:aws:bcm-data-exports:export/test",
  manifest_execution_id: "manifest-1",
  source_object_key: "focus/part-1.csv.gz",
  schema_version: "1.2",
  collector_version: "1",
  normalizer_version: "1",
  sync_job_id: "job-1",
  created_at: "2026-09-07T12:00:00Z",
  updated_at: "2026-09-07T12:00:00Z",
};

describe("CostUsagePanel", () => {
  it("reveals every FOCUS business-data group from an expanded row", () => {
    render(
      <CostUsagePanel
        connectionId="conn-1"
        costReadEnabled
        focusExportEnabled
        connectionSettingsHref="/dashboard/integrations/conn-1"
        initialCostUsage={[row]}
        initialTotal={1}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Amazon ECS/ }));

    expect(screen.getByText("Production account")).toBeTruthy();
    expect(screen.getByText("eu-west-1a")).toBeTruthy();
    expect(screen.getByText("Fargate vCPU usage")).toBeTruthy();
    expect(screen.getByText("Compute SP")).toBeTruthy();
    expect(screen.getByText("cr-1")).toBeTruthy();
    expect(screen.getByText("Billing currency")).toBeTruthy();
    expect(screen.getByText("Pricing currency")).toBeTruthy();
    expect(screen.getByText("Environment")).toBeTruthy();
    expect(screen.getByText("FargateTask")).toBeTruthy();
    expect(screen.getByText("manifest-1")).toBeTruthy();
  });

  it("shows a not-enabled empty state instead of FOCUS data when the organization lacks the capability grant", () => {
    render(
      <CostUsagePanel
        connectionId="conn-1"
        costReadEnabled
        focusExportEnabled={false}
        connectionSettingsHref="/dashboard/integrations/conn-1"
        initialCostUsage={[row]}
        initialTotal={1}
      />,
    );

    expect(
      screen.getByText("FOCUS billing export is not enabled"),
    ).toBeTruthy();
    expect(screen.queryByText("Amazon ECS")).toBeNull();
  });
});
