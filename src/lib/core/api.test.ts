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

describe("sync", () => {
  it("starts a sync with the requested datasets", async () => {
    const mockRun = {
      id: "run-1",
      organization_id: "org-123",
      connection_id: "conn-1",
      trigger: "manual",
      status: "queued",
      created_at: "2026-08-27T10:00:00Z",
      started_at: null,
      finished_at: null,
    };
    const response = new Response(JSON.stringify(mockRun), { status: 201 });
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal("fetch", fetchMock);

    const { startSync } = await import("./api");
    const result = await startSync("org-123", "conn-1", "test-token", {
      datasets: ["inventory.resources"],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(
        "/v1/organizations/org-123/integrations/connections/conn-1/syncs",
      ),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
        body: JSON.stringify({ datasets: ["inventory.resources"] }),
      }),
    );
    expect(result).toEqual(mockRun);
  });

  it("lists sync runs with pagination query params", async () => {
    const mockResponse = { items: [], total: 0 };
    const response = new Response(JSON.stringify(mockResponse), {
      status: 200,
    });
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal("fetch", fetchMock);

    const { listSyncRuns } = await import("./api");
    const result = await listSyncRuns("org-123", "conn-1", "test-token", {
      limit: 10,
      offset: 20,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(
        "/v1/organizations/org-123/integrations/connections/conn-1/syncs?limit=10&offset=20",
      ),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      }),
    );
    expect(result).toEqual(mockResponse);
  });

  it("fetches one sync run's detail including its jobs", async () => {
    const mockDetail = {
      id: "run-1",
      organization_id: "org-123",
      connection_id: "conn-1",
      trigger: "manual",
      status: "succeeded",
      created_at: "2026-08-27T10:00:00Z",
      started_at: "2026-08-27T10:00:01Z",
      finished_at: "2026-08-27T10:00:05Z",
      jobs: [],
    };
    const response = new Response(JSON.stringify(mockDetail), {
      status: 200,
    });
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal("fetch", fetchMock);

    const { getSyncRun } = await import("./api");
    const result = await getSyncRun("org-123", "conn-1", "run-1", "test-token");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(
        "/v1/organizations/org-123/integrations/connections/conn-1/syncs/run-1",
      ),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      }),
    );
    expect(result).toEqual(mockDetail);
  });
});

describe("resources", () => {
  it("lists resources with pagination and filter query params", async () => {
    const mockResponse = { items: [], total: 0 };
    const response = new Response(JSON.stringify(mockResponse), {
      status: 200,
    });
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal("fetch", fetchMock);

    const { listResources } = await import("./api");
    const result = await listResources("org-123", "conn-1", "test-token", {
      limit: 20,
      offset: 0,
      category: "compute",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(
        "/v1/organizations/org-123/integrations/connections/conn-1/resources?limit=20&offset=0&category=compute",
      ),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      }),
    );
    expect(result).toEqual(mockResponse);
  });

  it("omits unset filters from the query string", async () => {
    const mockResponse = { items: [], total: 0 };
    const response = new Response(JSON.stringify(mockResponse), {
      status: 200,
    });
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal("fetch", fetchMock);

    const { listResources } = await import("./api");
    await listResources("org-123", "conn-1", "test-token", {
      limit: 20,
      offset: 0,
    });

    const [calledUrl] = fetchMock.mock.calls[0] as [string];
    expect(calledUrl).toContain("limit=20&offset=0");
    expect(calledUrl).not.toContain("category=");
  });
});

describe("submitContactMessage", () => {
  it("posts the contact message payload without an auth header", async () => {
    const response = new Response(null, { status: 204 });
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal("fetch", fetchMock);

    const { submitContactMessage } = await import("./api");
    await submitContactMessage({
      name: "Jane Doe",
      email: "jane@example.com",
      message: "Hello there.",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/v1/site/contact-message"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          name: "Jane Doe",
          email: "jane@example.com",
          message: "Hello there.",
        }),
      }),
    );
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers).not.toHaveProperty("Authorization");
  });

  it("throws a CoreApiError with the backend detail message on failure", async () => {
    const fetchMock = vi.fn().mockImplementation(
      async () =>
        new Response(JSON.stringify({ detail: "Message too long." }), {
          status: 422,
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { submitContactMessage, CoreApiError } = await import("./api");
    await expect(
      submitContactMessage({
        name: "Jane Doe",
        email: "jane@example.com",
        message: "Hello there.",
      }),
    ).rejects.toThrow(CoreApiError);
    await expect(
      submitContactMessage({
        name: "Jane Doe",
        email: "jane@example.com",
        message: "Hello there.",
      }),
    ).rejects.toThrow("Message too long.");
  });
});
