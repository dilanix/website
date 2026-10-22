import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CoreIntegrationTarget } from "@/lib/core/api";
import { TargetsPanel } from "./targets-panel";
import {
  listTargetsAction,
  renameTargetAction,
  resumeTargetAction,
} from "@/app/dashboard/integrations/actions";

vi.mock("@/app/dashboard/integrations/actions", () => ({
  disableTargetAction: vi.fn(),
  listTargetsAction: vi.fn(),
  renameTargetAction: vi.fn(),
  replaceTargetIdentityAction: vi.fn(),
  resumeTargetAction: vi.fn(),
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
    // The connection tour points at each account and its actions.
    for (const anchor of ["connection.target", "connection.target-actions"])
      expect(document.querySelectorAll(`[data-tour="${anchor}"]`)).toHaveLength(
        1,
      );

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
    expect(screen.queryByRole("button", { name: "Pause" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Resume" })).toBeNull();
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

  it("resumes a paused account and shows the plan's refusal", async () => {
    const paused: CoreIntegrationTarget = {
      id: "target-1",
      organization_id: "org-1",
      connection_id: "conn-1",
      target_type: "account",
      external_id: "123456789012",
      display_name: null,
      parent_target_id: null,
      status: "disabled",
      provider_metadata: {},
      created_at: "2026-09-07T10:00:00Z",
      updated_at: "2026-09-07T10:00:00Z",
    };
    vi.mocked(resumeTargetAction).mockResolvedValue({
      error:
        "Connected cloud accounts limit reached (2 of 2 in use). Pause or disconnect an account, or ask us to raise your plan's limit.",
    });

    render(<TargetsPanel connectionId="conn-1" initialTargets={[paused]} />);

    expect(screen.getByText("paused")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Pause" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Resume" }));

    expect(await screen.findByText(/limit reached/)).toBeTruthy();
    expect(resumeTargetAction).toHaveBeenCalledWith("conn-1", "target-1");
  });
});
