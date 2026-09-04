import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CoreIntegration } from "@/lib/core/api";
import { IntegrationsClient } from "./integrations-client";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/app/dashboard/integrations/actions", () => ({
  createConnectionAction: vi.fn(),
}));

afterEach(cleanup);

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

describe("IntegrationsClient", () => {
  it("allows registered adapters and marks planned providers as coming soon", () => {
    render(
      <IntegrationsClient
        integrations={integrations}
        initialConnections={[]}
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
});
