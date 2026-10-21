import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/env", () => ({ env: { NEXT_PUBLIC_API_URL: "https://core.test" } }));
vi.mock("@/lib/auth/session", () => ({
  getAccessToken: vi.fn().mockResolvedValue("session-token"),
}));
vi.mock("@/lib/auth/api", () => ({
  getMe: vi
    .fn()
    .mockResolvedValue({ organizations: [{ organization_id: "org-own" }] }),
}));
vi.mock("@/lib/docs/openapi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/docs/openapi")>();
  return {
    ...actual,
    buildApiReference: vi.fn(actual.buildApiReference),
    fetchOpenApi: vi.fn().mockResolvedValue({
      paths: {
        "/v1/organizations/{organization_id}/applications/{application_id}": {
          get: {
            tags: ["applications"],
            parameters: [
              { name: "organization_id", in: "path", required: true },
              { name: "application_id", in: "path", required: true },
            ],
          },
        },
        "/v1/telemetry/logs": {
          post: {
            tags: ["telemetry-ingestion"],
            requestBody: {
              required: true,
              content: { "application/json": { schema: { type: "object" } } },
            },
          },
        },
        "/v1/auth/login": { post: { tags: ["auth"] } },
      },
    }),
  };
});

import { buildApiReference, type ApiOperation } from "@/lib/docs/openapi";
import { tryApiRequestAction } from "./actions";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock
    .mockReset()
    .mockResolvedValue(
      new Response('{"ok":true}', { status: 200, statusText: "OK" }),
    );
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

const LOGS_ID = "post-v1-telemetry-logs";
const KEY = { label: "API key", placeholder: "dil_…", envVar: "K", header: "" };

/** A hypothetical organization-scoped operation, to exercise path handling. */
function withScopedOperation(method: string) {
  const operation: ApiOperation = {
    id: "scoped",
    method,
    path: "/v1/organizations/{organization_id}/things/{thing_id}",
    summary: "Scoped",
    description: null,
    credential: KEY,
    parameters: ["organization_id", "thing_id"].map((name) => ({
      name,
      in: "path" as const,
      required: true,
      description: null,
      schema: {},
    })),
    body: null,
    responses: [],
  };
  vi.mocked(buildApiReference).mockReturnValueOnce([
    { id: "g", title: "G", description: "", operations: [operation] },
  ]);
}

describe("tryApiRequestAction", () => {
  it("sends with the pasted credential, never the session", async () => {
    fetchMock.mockResolvedValue(
      new Response('{"accepted":1}', { status: 202, statusText: "Accepted" }),
    );

    const missing = await tryApiRequestAction({
      operationId: LOGS_ID,
      pathParams: {},
      query: {},
      body: '{"logs":[]}',
      confirmed: true,
    });
    const sent = await tryApiRequestAction({
      operationId: LOGS_ID,
      pathParams: {},
      query: {},
      body: '{"logs":[]}',
      credential: "dtt_x.y",
      confirmed: true,
    });

    expect(missing.error).toMatch(/ingestion token/);
    expect(sent.status).toBe(202);
    expect(sent.body).toBe('{\n  "accepted": 1\n}');
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://core.test/v1/telemetry/logs");
    expect(init.headers.Authorization).toBe("Bearer dtt_x.y");
  });

  it("refuses dashboard endpoints — only the client reference is callable", async () => {
    for (const operationId of [
      "get-v1-organizations-organization-id-applications-application-id",
      "post-v1-auth-login",
      "get-v1-admin-users",
    ]) {
      const result = await tryApiRequestAction({
        operationId,
        pathParams: { application_id: "app-1" },
        query: {},
        body: null,
        credential: "dtt_x.y",
        confirmed: true,
      });
      expect(result.error).toMatch(/not part/);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forces the user's own organization and refuses unconfirmed changes and unsafe path values", async () => {
    withScopedOperation("GET");
    await tryApiRequestAction({
      operationId: "scoped",
      pathParams: { organization_id: "someone-else", thing_id: "t-1" },
      query: {},
      body: null,
      credential: "dil_x.y",
      confirmed: false,
    });
    expect(fetchMock.mock.calls[0]![0]).toBe(
      "https://core.test/v1/organizations/org-own/things/t-1",
    );

    withScopedOperation("DELETE");
    expect(
      (
        await tryApiRequestAction({
          operationId: "scoped",
          pathParams: { thing_id: "t-1" },
          query: {},
          body: null,
          credential: "dil_x.y",
          confirmed: false,
        })
      ).error,
    ).toMatch(/Confirm/);

    withScopedOperation("GET");
    expect(
      (
        await tryApiRequestAction({
          operationId: "scoped",
          pathParams: { thing_id: "../users" },
          query: {},
          body: null,
          credential: "dil_x.y",
          confirmed: false,
        })
      ).error,
    ).toMatch(/characters/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects a body that is not JSON", async () => {
    const result = await tryApiRequestAction({
      operationId: LOGS_ID,
      pathParams: {},
      query: {},
      body: "{nope",
      credential: "dtt_x.y",
      confirmed: true,
    });

    expect(result.error).toMatch(/not valid JSON/);
  });
});
