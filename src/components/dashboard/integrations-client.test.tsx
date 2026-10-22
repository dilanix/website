import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  CoreIntegration,
  CoreOrganizationCapability,
} from "@/lib/core/api";
import { act } from "@testing-library/react";
import { INTEGRATIONS_GUIDE_KEY } from "@/lib/guides/definitions/integrations";
import { tourTargetSelector } from "@/lib/tours/anchors";
import {
  INTEGRATIONS_TOUR_KEY,
  integrationsActions,
  integrationsAnchors,
} from "@/lib/tours/definitions/integrations";
import { IntegrationsClient } from "./integrations-client";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/app/dashboard/integrations/actions", () => ({
  createConnectionAction: vi.fn(),
}));

const { usePageTour, usePageGuide } = vi.hoisted(() => ({
  usePageTour: vi.fn(),
  usePageGuide: vi.fn(),
}));
vi.mock("@/components/tours/tour-provider", () => ({
  usePageTour,
  usePageGuide,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const integrations: CoreIntegration[] = [
  {
    id: "aws-id",
    slug: "aws",
    name: "Amazon Web Services",
    description: "AWS cloud infrastructure.",
    category: "cloud",
    status: "active",
    icon_key: "aws",
    connection_supported: true,
  },
  {
    id: "gcp-id",
    slug: "gcp",
    name: "Google Cloud Platform",
    description: "Google cloud infrastructure.",
    category: "cloud",
    status: "active",
    icon_key: "gcp",
    connection_supported: false,
  },
];

const mixedCategoryIntegrations: CoreIntegration[] = [
  ...integrations,
  {
    id: "calendly-id",
    slug: "calendly",
    name: "Calendly",
    description: "Scheduling automation.",
    category: "platform",
    status: "active",
    icon_key: "calendly",
    connection_supported: false,
  },
];

const awsGranted: CoreOrganizationCapability[] = [
  {
    id: "cap-provider-aws",
    code: "provider.aws",
    name: "Provider Access: Amazon Web Services",
    description: null,
    domain: "providers",
    plan_managed: false,
    access_status: "active",
    access_expires_at: null,
    access_sources: ["grant"],
  },
];

describe("IntegrationsClient", () => {
  it("allows registered adapters and marks planned providers as coming soon", () => {
    render(
      <IntegrationsClient
        integrations={integrations}
        initialConnections={[]}
        organizationCapabilities={awsGranted}
      />,
    );

    const connect = screen.getByRole("button", { name: "Add connection" });
    const comingSoon = screen.getByRole("button", { name: "Coming soon" });

    expect((connect as HTMLButtonElement).disabled).toBe(false);
    expect((comingSoon as HTMLButtonElement).disabled).toBe(true);
    expect(comingSoon.getAttribute("title")).toBe(
      "Google Cloud Platform connection support is coming soon",
    );

    fireEvent.click(comingSoon);
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(connect);
    expect(screen.getByRole("dialog")).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: "Connect Amazon Web Services" }),
    ).not.toBeNull();
  });

  it("disables a registered adapter the organization has no provider grant for", () => {
    render(
      <IntegrationsClient
        integrations={integrations}
        initialConnections={[]}
        organizationCapabilities={[]}
      />,
    );

    const notEnabled = screen.getByRole("button", { name: "Not enabled" });

    expect((notEnabled as HTMLButtonElement).disabled).toBe(true);
    expect(notEnabled.getAttribute("title")).toBe(
      "Amazon Web Services isn't enabled for your organization. Contact Dilanix.",
    );

    fireEvent.click(notEnabled);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("groups providers into category sections, cloud before platform", () => {
    render(
      <IntegrationsClient
        integrations={mixedCategoryIntegrations}
        initialConnections={[]}
        organizationCapabilities={awsGranted}
      />,
    );

    const headings = screen
      .getAllByRole("heading", { level: 2 })
      .map((heading) => heading.textContent);

    expect(headings.indexOf("Cloud")).toBeGreaterThanOrEqual(0);
    expect(headings.indexOf("Platform")).toBeGreaterThan(
      headings.indexOf("Cloud"),
    );
    expect(headings).toContain("Calendly");
  });
});

describe("IntegrationsClient guide and tour", () => {
  const anchored = (name: keyof typeof integrationsAnchors) =>
    document.querySelectorAll(tourTargetSelector(integrationsAnchors[name]));
  const offer = () => usePageTour.mock.calls.at(-1);

  it("opens the video guide on its own only before the first connection", () => {
    const { rerender } = render(
      <IntegrationsClient
        integrations={integrations}
        initialConnections={[]}
        organizationCapabilities={awsGranted}
      />,
    );
    expect(usePageGuide).toHaveBeenLastCalledWith(INTEGRATIONS_GUIDE_KEY, {
      autoOpen: true,
    });

    rerender(
      <IntegrationsClient
        integrations={integrations}
        initialConnections={[
          {
            id: "c1",
            integration_id: "aws-id",
            name: "AWS Production",
            status: "connected",
            last_synced_at: null,
          } as never,
        ]}
        organizationCapabilities={awsGranted}
      />,
    );
    // Its state was set on the first render; a later one keeps it.
    expect(usePageGuide.mock.calls.at(-1)?.[0]).toBe(INTEGRATIONS_GUIDE_KEY);
  });

  it("walks the real Connect form and closes it without creating anything", () => {
    render(
      <IntegrationsClient
        integrations={integrations}
        initialConnections={[]}
        organizationCapabilities={awsGranted}
      />,
    );
    expect(offer()?.[0]).toBe(INTEGRATIONS_TOUR_KEY);
    expect(anchored("stats")).toHaveLength(1);
    expect(anchored("provider")).toHaveLength(2);
    expect(anchored("connect")).toHaveLength(2);

    let close: (() => void) | false | void = undefined;
    act(() => {
      close = offer()?.[1].actions[integrationsActions.openConnect]();
    });
    expect(
      screen.getByRole("dialog", { name: "Connect Amazon Web Services" }),
    ).toBeTruthy();
    expect(anchored("connectName")).toHaveLength(1);
    expect(anchored("connectSubmit")).toHaveLength(1);

    act(() => (close as () => void)());
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("skips the form steps when no provider can be connected", () => {
    render(
      <IntegrationsClient
        integrations={integrations}
        initialConnections={[]}
        organizationCapabilities={[]}
      />,
    );
    let result: unknown;
    act(() => {
      result = offer()?.[1].actions[integrationsActions.openConnect]();
    });
    expect(result).toBe(false);
  });
});
