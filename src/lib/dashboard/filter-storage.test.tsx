import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import {
  DashboardFilterStorageProvider,
  useDashboardFilterState,
} from "./filter-storage";

function isString(value: unknown): value is string {
  return typeof value === "string";
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("useDashboardFilterState", () => {
  it("persists a filter and restores it in another mount", () => {
    const first = renderHook(() =>
      useDashboardFilterState("test.search", "", isString),
    );

    act(() => first.result.current[1]("ec2"));
    expect(first.result.current[0]).toBe("ec2");
    first.unmount();

    const second = renderHook(() =>
      useDashboardFilterState("test.search", "", isString),
    );
    expect(second.result.current[0]).toBe("ec2");
    expect(second.result.current[2].restored).toBe(true);
  });

  it("ignores malformed or invalid stored values", () => {
    localStorage.setItem(
      "dilanix.dashboard.filters.v1:anonymous:test.search",
      JSON.stringify(42),
    );

    const { result } = renderHook(() =>
      useDashboardFilterState("test.search", "fallback", isString),
    );
    expect(result.current[0]).toBe("fallback");
    expect(result.current[2].restored).toBe(false);
  });

  it("isolates saved filters by organization", () => {
    const organizationA = ({ children }: { children: ReactNode }) => (
      <DashboardFilterStorageProvider namespace="organization-a">
        {children}
      </DashboardFilterStorageProvider>
    );
    const organizationB = ({ children }: { children: ReactNode }) => (
      <DashboardFilterStorageProvider namespace="organization-b">
        {children}
      </DashboardFilterStorageProvider>
    );
    const first = renderHook(
      () => useDashboardFilterState("search", "", isString),
      { wrapper: organizationA },
    );
    act(() => first.result.current[1]("private-account"));
    first.unmount();

    const second = renderHook(
      () => useDashboardFilterState("search", "", isString),
      { wrapper: organizationB },
    );
    expect(second.result.current[0]).toBe("");
  });

  it("lets an explicit URL-derived fallback replace a saved value", async () => {
    localStorage.setItem(
      "dilanix.dashboard.filters.v1:anonymous:test.search",
      JSON.stringify("stored"),
    );
    const { result } = renderHook(() =>
      useDashboardFilterState("test.search", "from-url", isString, {
        fallbackPriority: true,
      }),
    );

    expect(result.current[0]).toBe("from-url");
    await waitFor(() =>
      expect(
        localStorage.getItem(
          "dilanix.dashboard.filters.v1:anonymous:test.search",
        ),
      ).toBe(JSON.stringify("from-url")),
    );
    await waitFor(() => expect(result.current[2].restored).toBe(true));

    act(() => result.current[1]("changed-after-navigation"));
    expect(result.current[0]).toBe("changed-after-navigation");
  });
});
