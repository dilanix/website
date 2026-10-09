import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { CoreInteractionSourceStatus } from "@/lib/core/api";
import { InteractionSources } from "./interaction-sources";

afterEach(cleanup);

describe("InteractionSources", () => {
  it("shows a source that could not read everything as partial, with why", () => {
    const sources: CoreInteractionSourceStatus[] = [
      {
        source: "vpc_flow_logs",
        region: "eu-west-1",
        state: "partial",
        detail: "1 window(s) not read: the budget of 32 queries was reached",
        coverage: { queries: 32, unscanned_windows: 1 },
        evidence_count: 4,
        collected_at: "2026-10-09T10:00:00Z",
        last_succeeded_at: "2026-10-09T10:00:00Z",
        stale: false,
      },
      {
        source: "xray",
        region: "eu-west-1",
        state: "not_enabled",
        detail: null,
        coverage: null,
        evidence_count: 0,
        collected_at: "2026-10-09T10:00:00Z",
        last_succeeded_at: null,
        stale: false,
      },
    ];

    render(<InteractionSources sources={sources} />);
    expect(screen.getByText("1/2")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Sources/ }));

    expect(screen.getByText("Partial")).toBeTruthy();
    expect(
      screen.getByText(
        "1 window(s) not read: the budget of 32 queries was reached",
      ),
    ).toBeTruthy();
  });

  it("says when the facts shown come from an earlier successful run", () => {
    render(
      <InteractionSources
        sources={[
          {
            source: "xray",
            region: "eu-west-1",
            state: "failed",
            detail: "Reading the X-Ray service graph failed (Throttling).",
            coverage: null,
            evidence_count: 3,
            collected_at: "2026-10-09T10:00:00Z",
            last_succeeded_at: "2026-10-08T10:00:00Z",
            stale: true,
          },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Sources/ }));

    expect(
      screen.getByText(/Showing facts from the last successful run/),
    ).toBeTruthy();
  });
});
