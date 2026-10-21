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
  it("keeps only what a customer's own code can call — never dashboard endpoints", () => {
    const groups = buildApiReference(doc);

    expect(groups.map((group) => group.id)).toEqual(["telemetry-ingestion"]);
    expect(
      groups.flatMap((group) => group.operations).map((item) => item.path),
    ).toEqual(["/v1/telemetry/logs"]);
    expect(groups[0]?.operations[0]?.credential.placeholder).toBe("dtt_…");
    expect(groups[0]?.operations[0]?.summary).toBe("Send logs");
    expect(groups[0]?.operations[0]?.description).not.toMatch(/\.md/);
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
  it("authorizes with the operation's own credential", () => {
    const ingest = buildApiReference(doc)[0]!.operations[0]!;

    const [curl, javascript, python] = codeSamples(
      ingest,
      "https://api.example.com",
      "org-1",
    );
    expect(curl?.code).toContain("https://api.example.com/v1/telemetry/logs");
    expect(curl?.code).toContain("$DILANIX_INGESTION_TOKEN");
    expect(javascript?.code).toContain('method: "POST"');
    expect(python?.code).toContain("requests.post(");
  });
});
