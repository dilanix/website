import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ResourceFilters } from "./resource-filters";

afterEach(cleanup);

describe("ResourceFilters", () => {
  it("renders provider-driven options without discarding unknown values", () => {
    const onChange = vi.fn();
    render(
      <ResourceFilters
        values={{
          search: "",
          provider: "",
          resourceType: "",
          region: "",
          state: "",
          integrationId: "",
        }}
        options={{
          providers: [{ value: "aws", label: "AWS", count: 3 }],
          resourceTypes: [
            { value: "future_service", label: "Future service", count: 2 },
          ],
          regions: [{ value: "global", label: "Global", count: 1 }],
          states: [
            { value: "mystery-state", label: "Mystery state", count: 1 },
          ],
        }}
        integrations={[]}
        onChange={onChange}
      />,
    );
    expect(
      screen.getByRole("option", { name: "Future service (2)" }),
    ).toHaveValue("future_service");
    fireEvent.change(screen.getByLabelText("Resource type"), {
      target: { value: "future_service" },
    });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ resourceType: "future_service" }),
    );
  });
});
