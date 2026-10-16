import { describe, expect, it } from "vitest";
import {
  buildApiReference,
  codeSamples,
  exampleFor,
  resolveSchema,
  typeLabel,
  type OpenApiDocument,
} from "./openapi";

const doc: OpenApiDocument = {
  paths: {
    "/v1/auth/login": {
      post: {
        tags: ["auth"],
        summary: "Login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
      },
    },
    "/v1/auth/change-password": {
      post: { tags: ["auth"], summary: "Change Password" },
    },
    "/v1/telemetry/logs": {
      post: {
        tags: ["telemetry-ingestion"],
        summary: "Ingest Telemetry Logs",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Batch" },
            },
          },
        },
        responses: { "202": { description: "Accepted" } },
      },
    },
    "/v1/organizations/{organization_id}/applications/{application_id}": {
      get: {
        tags: ["applications"],
        summary: "Get Application",
        parameters: [
          {
            name: "organization_id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
          {
            name: "application_id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
      },
      delete: {
        tags: ["applications"],
        summary: "Delete Application",
        parameters: [
          {
            name: "confirm_name",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
        ],
      },
    },
    "/v1/site/contact-message": {
      post: { tags: ["site"], summary: "Contact" },
    },
  },
  components: {
    schemas: {
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" },
        },
      },
      Batch: {
        type: "object",
        required: ["logs"],
        properties: {
          logs: {
            type: "array",
            items: { $ref: "#/components/schemas/Entry" },
          },
        },
      },
      Entry: {
        type: "object",
        required: ["timestamp", "severity", "message"],
        properties: {
          timestamp: { type: "string", format: "date-time" },
          severity: { $ref: "#/components/schemas/Severity" },
          message: { type: "string" },
          service_name: { anyOf: [{ type: "string" }, { type: "null" }] },
        },
      },
      Severity: { type: "string", enum: ["trace", "debug", "info", "error"] },
      Node: {
        type: "object",
        properties: { child: { $ref: "#/components/schemas/Node" } },
      },
    },
  },
};

describe("buildApiReference", () => {
  it("keeps only the client-facing groups, in order, without excluded operations", () => {
    const groups = buildApiReference(doc);

    expect(groups.map((group) => group.id)).toEqual([
      "authentication",
      "telemetry-ingestion",
      "applications",
    ]);
    expect(groups[0]?.operations.map((operation) => operation.path)).toEqual([
      "/v1/auth/login",
    ]);
    expect(
      groups
        .flatMap((group) => group.operations)
        .some((operation) => operation.path.startsWith("/v1/site")),
    ).toBe(false);
  });

  it("marks how each operation authenticates", () => {
    const operations = buildApiReference(doc).flatMap(
      (group) => group.operations,
    );

    expect(
      operations.find((operation) => operation.path === "/v1/auth/login")?.auth,
    ).toBe("none");
    expect(
      operations.find((operation) => operation.path === "/v1/telemetry/logs")
        ?.auth,
    ).toBe("ingestion");
    expect(
      operations.find((operation) => operation.method === "GET")?.auth,
    ).toBe("session");
  });

  it("resolves references and builds a realistic example body", () => {
    const ingest = buildApiReference(doc)
      .flatMap((group) => group.operations)
      .find((operation) => operation.path === "/v1/telemetry/logs");

    expect(ingest?.id).toBe("post-v1-telemetry-logs");
    expect(ingest?.body?.example).toEqual({
      logs: [
        {
          timestamp: "2026-10-16T09:30:00Z",
          severity: "info",
          message: "Payment captured",
          service_name: "payments-api",
        },
      ],
    });
    expect(typeLabel(ingest?.body?.schema.properties?.logs ?? {})).toBe(
      "object[]",
    );
  });

  it("survives recursive schemas", () => {
    const node = resolveSchema({ $ref: "#/components/schemas/Node" }, doc);

    expect(node.properties?.child?.description).toBe("(recursive)");
    expect(exampleFor(node)).toBeTruthy();
  });
});

describe("codeSamples", () => {
  it("fills in the organization and the right credential", () => {
    const operations = buildApiReference(doc).flatMap(
      (group) => group.operations,
    );
    const get = operations.find((operation) => operation.method === "GET")!;
    const ingest = operations.find(
      (operation) => operation.path === "/v1/telemetry/logs",
    )!;

    const [curl, javascript, python] = codeSamples(
      get,
      "https://api.example.com",
      "org-1",
    );
    expect(curl?.code).toContain(
      "https://api.example.com/v1/organizations/org-1/applications/{application_id}",
    );
    expect(curl?.code).toContain("$DILANIX_TOKEN");
    expect(javascript?.code).toContain('method: "GET"');
    expect(python?.code).toContain("requests.get(");
    expect(
      codeSamples(ingest, "https://api.example.com", "org-1")[0]?.code,
    ).toContain("$DILANIX_INGESTION_TOKEN");
  });
});
