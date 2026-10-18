import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CoreIntegrationTarget } from "@/lib/core/api";
import { TargetsPanel } from "./targets-panel";
import {
  listTargetsAction,
  renameTargetAction,
} from "@/app/dashboard/integrations/actions";

vi.mock("@/app/dashboard/integrations/actions", () => ({
  disableTargetAction: vi.fn(),
  listTargetsAction: vi.fn(),
  renameTargetAction: vi.fn(),
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
    expect(screen.queryByRole("button", { name: "Rename" })).toBeNull();
  });

  it("renames a target", async () => {
    const target: CoreIntegrationTarget = {
      id: "target-1",
      organization_id: "org-1",
      connection_id: "conn-1",
      target_type: "account",
      external_id: "123456789012",
      display_name: "AWS Account 123456789012",
      parent_target_id: null,
      status: "verified",
      provider_metadata: {},
      created_at: "2026-09-07T10:00:00Z",
      updated_at: "2026-09-07T10:00:00Z",
    };
    const renamed = { ...target, display_name: "Prod" };
    vi.mocked(renameTargetAction).mockResolvedValue({ data: renamed });
    vi.mocked(listTargetsAction).mockResolvedValue({ data: [renamed] });

    render(<TargetsPanel connectionId="conn-1" initialTargets={[target]} />);
    fireEvent.click(screen.getByRole("button", { name: "Rename" }));

    const input = screen.getByLabelText("Label");
    fireEvent.change(input, { target: { value: "Prod" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await screen.findByText("Prod");
    expect(renameTargetAction).toHaveBeenCalledWith(
      "conn-1",
      "target-1",
      "Prod",
    );
  });

  it("reloads its list when reloadSignal changes after mount", async () => {
    const target: CoreIntegrationTarget = {
      id: "target-1",
      organization_id: "org-1",
      connection_id: "conn-1",
      target_type: "account",
      external_id: "123456789012",
      display_name: "Prod",
      parent_target_id: null,
      status: "verified",
      provider_metadata: {},
      created_at: "2026-09-07T10:00:00Z",
      updated_at: "2026-09-07T10:00:00Z",
    };
    const secondTarget: CoreIntegrationTarget = {
      ...target,
      id: "target-2",
      external_id: "210987654321",
      display_name: "Dev",
    };
    vi.mocked(listTargetsAction).mockResolvedValue({
      data: [target, secondTarget],
    });

    const { rerender } = render(
      <TargetsPanel
        connectionId="conn-1"
        initialTargets={[target]}
        reloadSignal={0}
      />,
    );
    // Only care about calls from this point on — an earlier test in this
    // file may have already invoked the (module-shared) mock.
    vi.mocked(listTargetsAction).mockClear();

    rerender(
      <TargetsPanel
        connectionId="conn-1"
        initialTargets={[target]}
        reloadSignal={1}
      />,
    );

    await screen.findByText("Dev");
    expect(listTargetsAction).toHaveBeenCalledWith("conn-1");
  });
});
