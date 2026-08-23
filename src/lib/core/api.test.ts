import { afterEach, describe, expect, it, vi } from "vitest";
import { coreRequest } from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("coreRequest", () => {
  it("handles successful 204 responses without parsing JSON", async () => {
    const response = new Response(null, { status: 204 });
    const json = vi.spyOn(response, "json");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    await expect(
      coreRequest<void>("/v1/resource", "token", { method: "DELETE" }),
    ).resolves.toBeUndefined();
    expect(json).not.toHaveBeenCalled();
  });

  it("fetches product documentation for an organization", async () => {
    const mockDocs = {
      product_id: "prod-1",
      product_name: "Dena Cloud Storage",
      product_slug: "dena",
      documentation: "# Dena Guide",
      access_status: "active",
      updated_at: "2026-08-21T10:00:00Z",
    };
    const response = new Response(JSON.stringify(mockDocs), { status: 200 });
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal("fetch", fetchMock);

    const { getProductDocumentation } = await import("./api");
    const result = await getProductDocumentation(
      "org-123",
      "dena",
      "test-token",
    );

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/v1/organizations/org-123/products/dena/docs"),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      }),
    );
    expect(result).toEqual(mockDocs);
  });

  it("creates an integration connection for an organization", async () => {
    const mockConnection = {
      id: "conn-1",
      organization_id: "org-123",
      integration_id: "integration-1",
      name: "AWS Production",
      status: "draft",
      configuration: {},
      external_reference: null,
      last_verified_at: null,
      last_success_at: null,
      last_error_at: null,
      last_error_code: null,
      created_at: "2026-08-21T10:00:00Z",
    };
    const response = new Response(JSON.stringify(mockConnection), {
      status: 201,
    });
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal("fetch", fetchMock);

    const { createConnection } = await import("./api");
    const result = await createConnection("org-123", "test-token", {
      integration_id: "integration-1",
      name: "AWS Production",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(
        "/v1/organizations/org-123/integrations/connections",
      ),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      }),
    );
    expect(result).toEqual(mockConnection);
  });
});
