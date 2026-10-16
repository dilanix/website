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
          delete: {
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

const GET_ID =
  "get-v1-organizations-organization-id-applications-application-id";

describe("tryApiRequestAction", () => {
  it("always uses the signed-in user's organization and session, server-side", async () => {
    const result = await tryApiRequestAction({
      operationId: GET_ID,
      pathParams: { organization_id: "someone-else", application_id: "app-1" },
      query: {},
      body: null,
      confirmed: false,
    });

    expect(result.status).toBe(200);
    expect(result.body).toBe('{\n  "ok": true\n}');
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(
      "https://core.test/v1/organizations/org-own/applications/app-1",
    );
    expect(init.headers.Authorization).toBe("Bearer session-token");
  });

  it("refuses operations outside the reference, unconfirmed changes, and unsafe path values", async () => {
    expect(
      (
        await tryApiRequestAction({
          operationId: "get-v1-admin-users",
          pathParams: {},
          query: {},
          body: null,
          confirmed: true,
        })
      ).error,
    ).toMatch(/not part/);
    expect(
      (
        await tryApiRequestAction({
          operationId: GET_ID.replace("get", "delete"),
          pathParams: { application_id: "app-1" },
          query: {},
          body: null,
          confirmed: false,
        })
      ).error,
    ).toMatch(/Confirm/);
    expect(
      (
        await tryApiRequestAction({
          operationId: GET_ID,
          pathParams: { application_id: "../users" },
          query: {},
          body: null,
          confirmed: false,
        })
      ).error,
    ).toMatch(/characters/);
    expect(
      (
        await tryApiRequestAction({
          operationId: "post-v1-auth-login",
          pathParams: {},
          query: {},
          body: null,
          confirmed: true,
        })
      ).error,
    ).toMatch(/code only/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends telemetry with the pasted ingestion token, never the session", async () => {
    fetchMock.mockResolvedValue(
      new Response('{"accepted":1}', { status: 202, statusText: "Accepted" }),
    );

    const missing = await tryApiRequestAction({
      operationId: "post-v1-telemetry-logs",
      pathParams: {},
      query: {},
      body: '{"logs":[]}',
      confirmed: true,
    });
    const sent = await tryApiRequestAction({
      operationId: "post-v1-telemetry-logs",
      pathParams: {},
      query: {},
      body: '{"logs":[]}',
      ingestionToken: "dtt_x.y",
      confirmed: true,
    });

    expect(missing.error).toMatch(/ingestion token/);
    expect(sent.status).toBe(202);
    expect(fetchMock.mock.calls[0]![1].headers.Authorization).toBe(
      "Bearer dtt_x.y",
    );
  });

  it("rejects a body that is not JSON", async () => {
    const result = await tryApiRequestAction({
      operationId: "post-v1-telemetry-logs",
      pathParams: {},
      query: {},
      body: "{nope",
      ingestionToken: "dtt_x.y",
      confirmed: true,
    });

    expect(result.error).toMatch(/not valid JSON/);
  });
});
