import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CoreIntegrationTarget } from "@/lib/core/api";
import { TargetsPanel } from "./targets-panel";

vi.mock("@/app/dashboard/integrations/actions", () => ({
  disableTargetAction: vi.fn(),
  listTargetsAction: vi.fn(),
  replaceTargetIdentityAction: vi.fn(),
}));

afterEach(cleanup);

describe("TargetsPanel", () => {
  it("reveals provider identity metadata", () => {
    const target: CoreIntegrationTarget = {
      id: "target-1",
      organization_id: "org-1",
      connection_id: "conn-1",
      target_type: "aws_account",
      external_id: "123456789012",
      display_name: "Production",
      parent_target_id: null,
      status: "verified",
      provider_metadata: {
        assumed_role_arn: "arn:aws:iam::123456789012:role/Dilanix",
      },
      created_at: "2026-09-07T10:00:00Z",
      updated_at: "2026-09-07T10:00:00Z",
    };

    render(<TargetsPanel connectionId="conn-1" initialTargets={[target]} />);
    expect(screen.queryByText(/role\/Dilanix/)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Provider metadata" }));

    expect(screen.getByText("Assumed role ARN")).toBeTruthy();
    expect(screen.getByText(/role\/Dilanix/)).toBeTruthy();
  });

  it("hides target mutations in read-only mode", () => {
    const target: CoreIntegrationTarget = {
      id: "target-1",
      organization_id: "org-1",
      connection_id: "conn-1",
      target_type: "aws_account",
      external_id: "123456789012",
      display_name: "Production",
      parent_target_id: null,
      status: "verified",
      provider_metadata: {},
      created_at: "2026-09-07T10:00:00Z",
      updated_at: "2026-09-07T10:00:00Z",
    };

    render(
      <TargetsPanel connectionId="conn-1" initialTargets={[target]} readOnly />,
    );

    expect(screen.queryByRole("button", { name: "Replace" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Disable" })).toBeNull();
  });
});
