import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getRecommendationFixGuideAction } from "@/app/dashboard/products/cost-actions";
import type {
  CoreFixGuideMethod,
  CoreRecommendationFixGuide,
} from "@/lib/core/api";
import {
  FixGuideDrawer,
  HowToFixButton,
  hasFixGuide,
  methodLabel,
} from "./fix-guide";

vi.mock("@/app/dashboard/products/cost-actions", () => ({
  getRecommendationFixGuideAction: vi.fn(),
}));

const RECOMMENDATION_ID = "00000000-0000-4000-8000-000000000001";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  window.localStorage.clear();
});

function method(overrides: Partial<CoreFixGuideMethod>): CoreFixGuideMethod {
  return {
    method: "console",
    available: true,
    unavailable_reason: null,
    scope: "customer_resource",
    note: null,
    links: [],
    steps: [],
    validation: [],
    rollback: [],
    ...overrides,
  };
}

function guide(
  overrides: Partial<CoreRecommendationFixGuide> = {},
): CoreRecommendationFixGuide {
  return {
    status: "ready",
    provider: "aws",
    provider_label: "AWS",
    option_index: 1,
    option_title: "Stop the instance",
    action_type: "stop",
    summary: "Stop worker to stop paying for its compute hours.",
    resource: {
      provider: "aws",
      resource_type: "ec2.instance",
      external_id: "i-0abc1234def567890",
      name: "worker",
      region: "eu-west-1",
      arn: null,
    },
    prerequisites: ["Tell the service owners"],
    warnings: ["The public IP address changes after a restart."],
    methods: [
      method({
        method: "console",
        links: [
          {
            label: "Instance in the EC2 console",
            url: "https://eu-west-1.console.aws.amazon.com/ec2/home?region=eu-west-1#InstanceDetails:instanceId=i-0abc1234def567890",
            kind: "console",
          },
        ],
        steps: [
          { title: "Open the instance", detail: "EC2 → Instances", code: null },
          {
            title: "Stop it",
            detail: "Instance state → Stop instance",
            code: null,
          },
        ],
        validation: [
          { title: "State shows Stopped", detail: null, code: null },
        ],
        rollback: [{ title: "Start it again", detail: null, code: null }],
      }),
      method({
        method: "terraform",
        available: false,
        scope: "generic_example",
        unavailable_reason:
          "No Terraform instructions could be produced for this change.",
      }),
      method({
        method: "cli",
        links: [
          {
            label: "aws ec2 stop-instances",
            url: "https://docs.aws.amazon.com/cli/latest/reference/ec2/stop-instances.html",
            kind: "cli_reference",
          },
        ],
        steps: [
          {
            title: "Snapshot first",
            detail: null,
            code: {
              language: "bash",
              content:
                "aws ec2 create-snapshot --volume-id <VOLUME_ID> --region eu-west-1",
              placeholders: ["<VOLUME_ID>"],
            },
          },
          {
            title: "Stop the instance",
            detail: null,
            code: {
              language: "bash",
              content:
                "aws ec2 stop-instances --instance-ids i-0abc1234def567890 --region eu-west-1",
              placeholders: [],
            },
          },
        ],
      }),
    ],
    documentation: [
      {
        label: "Stop and start Amazon EC2 instances",
        url: "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/Stop_Start.html",
        kind: "documentation",
      },
    ],
    omitted: [
      "AWS CLI steps 3: `--force-it` is not a parameter of `aws ec2 stop-instances`",
    ],
    model: "test-model",
    generated_at: "2026-10-16T10:00:00Z",
    ...overrides,
  };
}

async function openDrawer(
  result: Awaited<ReturnType<typeof getRecommendationFixGuideAction>>,
) {
  vi.mocked(getRecommendationFixGuideAction).mockResolvedValue(result);
  const onClose = vi.fn();
  render(
    <FixGuideDrawer
      recommendationId={RECOMMENDATION_ID}
      optionIndex={1}
      optionTitle="Stop the instance"
      onClose={onClose}
    />,
  );
  await act(async () => {});
  return onClose;
}

describe("FixGuideDrawer", () => {
  it("shows the guide for the chosen option with the provider's method names", async () => {
    await openDrawer({ data: guide() });

    expect(getRecommendationFixGuideAction).toHaveBeenCalledWith(
      RECOMMENDATION_ID,
      1,
    );
    expect(
      screen.getByRole("dialog", { name: "How to fix: Stop the instance" }),
    ).toBeTruthy();
    expect(
      screen.getByText("worker (i-0abc1234def567890) · eu-west-1"),
    ).toBeTruthy();
    expect(screen.getByText("Tell the service owners")).toBeTruthy();
    expect(
      screen.getByText("The public IP address changes after a restart."),
    ).toBeTruthy();
    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "AWS Console",
      "Terraform",
      "AWS CLI",
    ]);
    expect(
      screen
        .getByRole("tab", { name: "AWS Console" })
        .getAttribute("aria-selected"),
    ).toBe("true");
    const consoleLink = screen.getByRole("link", {
      name: /Instance in the EC2 console/,
    });
    expect(consoleLink.getAttribute("href")).toContain(
      "InstanceDetails:instanceId=i-0abc1234def567890",
    );
    expect(screen.getByText("Verify the result")).toBeTruthy();
    expect(screen.getByText("Roll back if needed")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /Stop and start Amazon EC2 instances/ }),
    ).toBeTruthy();
  });

  it("tracks progress through the numbered steps", async () => {
    await openDrawer({ data: guide() });

    expect(screen.getByText("0 of 2 done")).toBeTruthy();
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Mark step 2 as done" }),
    );
    expect(screen.getByText("1 of 2 done")).toBeTruthy();
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe(
      "1",
    );
  });

  it("shows commands with copy buttons and the placeholders to fill in", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    await openDrawer({ data: guide() });

    fireEvent.click(screen.getByRole("tab", { name: "AWS CLI" }));
    expect(
      screen.getByText(
        "Replace <VOLUME_ID> with your own value before running.",
      ),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /aws ec2 stop-instances/ }),
    ).toBeTruthy();
    await act(async () => {
      fireEvent.click(
        screen.getAllByRole("button", { name: "Copy command" })[1],
      );
    });
    expect(writeText).toHaveBeenCalledWith(
      "aws ec2 stop-instances --instance-ids i-0abc1234def567890 --region eu-west-1",
    );
    expect(screen.getByRole("button", { name: "Copied" })).toBeTruthy();
  });

  it("explains an unavailable method instead of showing steps", async () => {
    await openDrawer({ data: guide() });

    fireEvent.click(screen.getByRole("tab", { name: "Terraform" }));

    expect(
      screen.getByText(
        "No Terraform instructions could be produced for this change.",
      ),
    ).toBeTruthy();
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("marks a Terraform example as generic", async () => {
    const withTerraform = guide();
    withTerraform.methods[1] = method({
      method: "terraform",
      scope: "generic_example",
      note: "Generic example. Dilanix has no access to your Terraform code or state.",
      steps: [
        {
          title: "Change the instance type",
          detail: null,
          code: {
            language: "hcl",
            content: 'resource "aws_instance" "app" {}',
            placeholders: [],
          },
        },
      ],
    });
    await openDrawer({ data: withTerraform });

    fireEvent.click(screen.getByRole("tab", { name: "Terraform" }));

    expect(
      screen.getByText("Generic example — adapt to your code"),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Copy configuration" }),
    ).toBeTruthy();
  });

  it("shows a warning and no tabs when the information is insufficient", async () => {
    await openDrawer({
      data: guide({
        status: "insufficient",
        warnings: ["The target size was never verified."],
        omitted: [],
      }),
    });

    expect(screen.getByRole("alert").textContent).toContain(
      "The target size was never verified.",
    );
    expect(screen.queryByRole("tablist")).toBeNull();
  });

  it("lists what verification removed", async () => {
    await openDrawer({ data: guide() });

    fireEvent.click(
      screen.getByRole("button", { name: /1 generated item was removed/ }),
    );

    expect(screen.getByText(/`--force-it` is not a parameter/)).toBeTruthy();
  });

  it("offers a retry after an error and can regenerate", async () => {
    await openDrawer({
      error: "the guide could not be generated — try again later",
    });

    expect(screen.getByRole("alert").textContent).toContain(
      "could not be generated",
    );
    vi.mocked(getRecommendationFixGuideAction).mockResolvedValue({
      data: guide(),
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Try again/ }));
    });
    expect(screen.getByRole("tablist")).toBeTruthy();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Regenerate/ }));
    });
    expect(getRecommendationFixGuideAction).toHaveBeenLastCalledWith(
      RECOMMENDATION_ID,
      1,
      true,
    );
  });

  it("closes on Escape", async () => {
    const onClose = await openDrawer({ data: guide() });

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onClose).toHaveBeenCalled();
  });
});

describe("HowToFixButton", () => {
  it("opens the guide drawer", async () => {
    vi.mocked(getRecommendationFixGuideAction).mockResolvedValue({
      data: guide(),
    });
    render(
      <HowToFixButton
        recommendationId={RECOMMENDATION_ID}
        optionIndex={1}
        optionTitle="Stop the instance"
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "How to fix" }));
    });

    expect(screen.getByRole("dialog")).toBeTruthy();
  });
});

describe("helpers", () => {
  it("names methods after the provider and only offers guides for changes", () => {
    expect(methodLabel("console", "AWS")).toBe("AWS Console");
    expect(methodLabel("cli", "GCP")).toBe("GCP CLI");
    expect(methodLabel("terraform", "AWS")).toBe("Terraform");
    expect(hasFixGuide("keep")).toBe(false);
    expect(hasFixGuide(null)).toBe(false);
    expect(hasFixGuide("downsize")).toBe(true);
  });
});
