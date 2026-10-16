import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DOCS_PAGE_COMPONENTS } from "@/content/docs/pages";
import { DOCS_PAGES, neighbours } from "@/content/docs/registry";
import { tryApiRequestAction } from "@/app/dashboard/docs/actions";
import { DocsShell } from "./docs-shell";
import { ScoreCalculator, LogPlayground } from "./widgets";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/docs/quickstart",
  useRouter: () => ({ push }),
}));
vi.mock("@/app/dashboard/docs/actions", () => ({
  tryApiRequestAction: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("documentation registry", () => {
  it("has a page for every entry, and neighbours follow reading order", () => {
    for (const page of DOCS_PAGES.filter(
      (item) => item.slug !== "api-reference",
    )) {
      expect(DOCS_PAGE_COMPONENTS[page.slug], page.slug).toBeTruthy();
    }
    expect(neighbours("welcome").previous).toBeNull();
    expect(neighbours("quickstart").previous?.slug).toBe("welcome");
    expect(neighbours("api-reference").next).toBeNull();
  });

  it("renders every page with sections", () => {
    for (const [slug, Page] of Object.entries(DOCS_PAGE_COMPONENTS)) {
      const { container } = render(
        <Page baseUrl="https://api.example.com" organizationId="org-1" />,
      );
      expect(
        container.querySelectorAll("[data-doc-section]").length,
        slug,
      ).toBeGreaterThan(0);
      cleanup();
    }
  });
});

describe("DocsShell", () => {
  it("highlights the current page and searches by keyword", () => {
    render(
      <DocsShell>
        <p>content</p>
      </DocsShell>,
    );

    expect(
      screen
        .getAllByRole("link", { name: "Quickstart" })[0]
        ?.getAttribute("aria-current"),
    ).toBe("page");
    const [search] = screen.getAllByLabelText("Search documentation");
    fireEvent.focus(search!);
    fireEvent.change(search!, { target: { value: "cloudformation" } });
    expect(screen.getAllByRole("option")[0]?.textContent).toContain(
      "Connect AWS",
    );
    fireEvent.keyDown(search!, { key: "Enter" });
    expect(push).toHaveBeenCalledWith("/dashboard/docs/connect-aws");
  });
});

describe("widgets", () => {
  it("scores a recommendation live", () => {
    render(<ScoreCalculator />);

    expect(screen.getByText("120.0")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Needs your input" }));
    expect(screen.getByText("30.0")).toBeTruthy();
  });

  it("sends a test log with the pasted token", async () => {
    vi.mocked(tryApiRequestAction).mockResolvedValue({
      status: 202,
      statusText: "Accepted",
      durationMs: 12,
      body: '{\n  "accepted": 1\n}',
    });
    render(<LogPlayground baseUrl="https://api.example.com" />);

    fireEvent.change(screen.getByPlaceholderText("dtt_…"), {
      target: { value: "dtt_test.secret" },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Send test log/ }));
    });

    const call = vi.mocked(tryApiRequestAction).mock.calls[0]![0];
    expect(call.operationId).toBe("post-v1-telemetry-logs");
    expect(call.credential).toBe("dtt_test.secret");
    expect(JSON.parse(call.body!).logs[0].message).toBe("Payment captured");
    expect(screen.getByRole("status").textContent).toContain(
      "Accepted in 12 ms",
    );
  });
});
