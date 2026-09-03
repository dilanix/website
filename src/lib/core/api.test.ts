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

  it("fetches one sync job's durable attempt history", async () => {
    const mockAttempts = [
      {
        id: "attempt-1",
        attempt: 1,
        outcome: "retry_scheduled",
        started_at: "2026-08-27T10:00:00Z",
        finished_at: "2026-08-27T10:00:02Z",
        error_code: "throttled",
        error_message: "AWS throttled the request.",
        records_read: 7,
        records_created: 0,
        records_updated: 0,
        records_deleted: 0,
      },
    ];
    const response = new Response(JSON.stringify(mockAttempts), {
      status: 200,
    });
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal("fetch", fetchMock);

    const { getSyncJobAttempts } = await import("./api");
    const result = await getSyncJobAttempts(
      "org-123",
      "conn-1",
      "run-1",
      "job-1",
      "test-token",
    );

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(
        "/v1/organizations/org-123/integrations/connections/conn-1/syncs/run-1/jobs/job-1/attempts",
      ),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      }),
    );
    expect(result).toEqual(mockAttempts);
  });

  it("upserts a sync policy by dataset, addressed without a policy id", async () => {
    const mockPolicy = {
      id: "policy-1",
      connection_id: "conn-1",
      target_id: null,
      dataset: "inventory.resources",
      enabled: true,
      interval_seconds: 3600,
      next_run_at: "2026-08-27T11:00:00Z",
      created_at: "2026-08-27T10:00:00Z",
      updated_at: "2026-08-27T10:00:00Z",
    };
    const response = new Response(JSON.stringify(mockPolicy), { status: 200 });
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal("fetch", fetchMock);

    const { setSyncPolicy } = await import("./api");
    const result = await setSyncPolicy("org-123", "conn-1", "test-token", {
      dataset: "inventory.resources",
      enabled: true,
      interval_seconds: 3600,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(
        "/v1/organizations/org-123/integrations/connections/conn-1/sync-policies",
      ),
      expect.objectContaining({
        method: "PUT",
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
        body: JSON.stringify({
          dataset: "inventory.resources",
          enabled: true,
          interval_seconds: 3600,
        }),
      }),
    );
    expect(result).toEqual(mockPolicy);
  });

  it("lists sync policies for a connection", async () => {
    const mockResponse = { items: [] };
    const response = new Response(JSON.stringify(mockResponse), {
      status: 200,
    });
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal("fetch", fetchMock);

    const { listSyncPolicies } = await import("./api");
    const result = await listSyncPolicies("org-123", "conn-1", "test-token");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(
        "/v1/organizations/org-123/integrations/connections/conn-1/sync-policies",
      ),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      }),
    );
    expect(result).toEqual(mockResponse);
  });

  it("requests cancellation of a sync run", async () => {
    const mockRun = {
      id: "run-1",
      organization_id: "org-123",
      connection_id: "conn-1",
      trigger: "manual",
      status: "cancel_requested",
      created_at: "2026-08-27T10:00:00Z",
      started_at: "2026-08-27T10:00:01Z",
      finished_at: null,
    };
    const response = new Response(JSON.stringify(mockRun), { status: 200 });
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal("fetch", fetchMock);

    const { cancelSync } = await import("./api");
    const result = await cancelSync("org-123", "conn-1", "run-1", "test-token");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(
        "/v1/organizations/org-123/integrations/connections/conn-1/syncs/run-1/cancel",
      ),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      }),
    );
    expect(result).toEqual(mockRun);
  });

  it("deletes a sync policy by id", async () => {
    const response = new Response(null, { status: 204 });
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal("fetch", fetchMock);

    const { deleteSyncPolicy } = await import("./api");
    await deleteSyncPolicy("org-123", "conn-1", "policy-1", "test-token");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(
        "/v1/organizations/org-123/integrations/connections/conn-1/sync-policies/policy-1",
      ),
      expect.objectContaining({
        method: "DELETE",
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      }),
    );
  });
});

describe("targets", () => {
  const mockTarget = {
    id: "target-1",
    organization_id: "org-123",
    connection_id: "conn-1",
    target_type: "account",
    external_id: "123456789012",
    display_name: null,
    parent_target_id: null,
    status: "verified",
    provider_metadata: {},
    created_at: "2026-08-27T10:00:00Z",
    updated_at: "2026-08-27T10:00:00Z",
  };

  it("lists targets for a connection", async () => {
    const response = new Response(JSON.stringify([mockTarget]), {
      status: 200,
    });
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal("fetch", fetchMock);

    const { listTargets } = await import("./api");
    const result = await listTargets("org-123", "conn-1", "test-token");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(
        "/v1/organizations/org-123/integrations/connections/conn-1/targets",
      ),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      }),
    );
    expect(result).toEqual([mockTarget]);
  });

  it("disables a target", async () => {
    const disabled = { ...mockTarget, status: "disabled" };
    const response = new Response(JSON.stringify(disabled), { status: 200 });
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal("fetch", fetchMock);

    const { disableTarget } = await import("./api");
    const result = await disableTarget(
      "org-123",
      "conn-1",
      "target-1",
      "test-token",
    );

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(
        "/v1/organizations/org-123/integrations/connections/conn-1/targets/target-1/disable",
      ),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      }),
    );
    expect(result).toEqual(disabled);
  });

  it("replaces a target's identity with the requested external id", async () => {
    const replacement = {
      ...mockTarget,
      id: "target-2",
      external_id: "210987654321",
    };
    const response = new Response(JSON.stringify(replacement), {
      status: 200,
    });
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal("fetch", fetchMock);

    const { replaceTargetIdentity } = await import("./api");
    const result = await replaceTargetIdentity(
      "org-123",
      "conn-1",
      "target-1",
      "test-token",
      "210987654321",
    );

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(
        "/v1/organizations/org-123/integrations/connections/conn-1/targets/target-1/replace",
      ),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        }),
        body: JSON.stringify({ requested_external_id: "210987654321" }),
      }),
    );
    expect(result).toEqual(replacement);
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

  it("sends lifecycleStatus as a lifecycle_status query param", async () => {
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
      lifecycleStatus: "missing",
    });

    const [calledUrl] = fetchMock.mock.calls[0] as [string];
    expect(calledUrl).toContain("lifecycle_status=missing");
  });

  it("fetches the distinct category/type/region filter options for a connection", async () => {
    const mockResponse = {
      category_types: [
        { category: "compute", resource_type: "compute.instance" },
      ],
      regions: ["us-east-1"],
    };
    const response = new Response(JSON.stringify(mockResponse), {
      status: 200,
    });
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal("fetch", fetchMock);

    const { listResourceFilters } = await import("./api");
    const result = await listResourceFilters("org-123", "conn-1", "test-token");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(
        "/v1/organizations/org-123/integrations/connections/conn-1/resources/filters",
      ),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      }),
    );
    expect(result).toEqual(mockResponse);
  });
});

describe("cost summaries", () => {
  it("lists cost summaries with pagination and filter query params", async () => {
    const mockResponse = { items: [], total: 0 };
    const response = new Response(JSON.stringify(mockResponse), {
      status: 200,
    });
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal("fetch", fetchMock);

    const { listCostSummaries } = await import("./api");
    const result = await listCostSummaries("org-123", "conn-1", "test-token", {
      limit: 25,
      offset: 0,
      costBasis: "amortized",
      serviceName: "Amazon EC2",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(
        "/v1/organizations/org-123/integrations/connections/conn-1/cost-summaries?limit=25&offset=0&service_name=Amazon+EC2&cost_basis=amortized",
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

    const { listCostSummaries } = await import("./api");
    await listCostSummaries("org-123", "conn-1", "test-token", {
      limit: 25,
      offset: 0,
    });

    const [calledUrl] = fetchMock.mock.calls[0] as [string];
    expect(calledUrl).toContain("limit=25&offset=0");
    expect(calledUrl).not.toContain("cost_basis=");
    expect(calledUrl).not.toContain("service_name=");
    expect(calledUrl).not.toContain("target_id=");
  });

  it("surfaces a 403 as a CoreApiError when billing.read is not enabled", async () => {
    const response = new Response(
      JSON.stringify({
        detail:
          "Connection conn-1 does not have the billing.read capability enabled.",
      }),
      { status: 403 },
    );
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal("fetch", fetchMock);

    const { listCostSummaries, CoreApiError } = await import("./api");

    await expect(
      listCostSummaries("org-123", "conn-1", "test-token", {
        limit: 25,
        offset: 0,
      }),
    ).rejects.toBeInstanceOf(CoreApiError);
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
