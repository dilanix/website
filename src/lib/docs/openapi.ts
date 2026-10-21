/**
 * Turns Dilanix Core's OpenAPI document into the client-facing API reference:
 * only the groups a customer integrates with (`API_GROUPS`), every `$ref`
 * resolved, an example body generated from each schema, and code samples.
 * Shared by the reference page (server) and the Try it proxy (server action),
 * so both agree on exactly which operations exist.
 */

export type JsonSchema = {
  $ref?: string;
  type?: string | string[];
  format?: string;
  title?: string;
  description?: string;
  enum?: unknown[];
  const?: unknown;
  default?: unknown;
  examples?: unknown[];
  example?: unknown;
  items?: JsonSchema;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  additionalProperties?: boolean | JsonSchema;
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  allOf?: JsonSchema[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  pattern?: string;
};

interface OpenApiParameter {
  name: string;
  in: "path" | "query" | "header" | "cookie";
  required?: boolean;
  description?: string;
  schema?: JsonSchema;
}

interface OpenApiOperation {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: OpenApiParameter[];
  requestBody?: {
    required?: boolean;
    content?: Record<string, { schema?: JsonSchema }>;
  };
  responses?: Record<
    string,
    { description?: string; content?: Record<string, { schema?: JsonSchema }> }
  >;
}

export interface OpenApiDocument {
  info?: { title?: string; version?: string };
  paths: Record<string, Record<string, OpenApiOperation>>;
  components?: { schemas?: Record<string, JsonSchema> };
}

/** The credential a client sends with an operation — always one it creates
 * itself in Dilanix, never a user's session. */
export interface ApiCredential {
  label: string;
  placeholder: string;
  envVar: string;
  header: string;
}

export interface ApiParameter {
  name: string;
  in: "path" | "query";
  required: boolean;
  description: string | null;
  schema: JsonSchema;
}

export interface ApiOperation {
  id: string;
  method: string;
  path: string;
  summary: string;
  description: string | null;
  credential: ApiCredential;
  parameters: ApiParameter[];
  body: { required: boolean; schema: JsonSchema; example: unknown } | null;
  responses: {
    status: string;
    description: string;
    schema: JsonSchema | null;
    example: unknown;
  }[];
}

export interface ApiGroup {
  id: string;
  title: string;
  description: string;
  operations: ApiOperation[];
}

interface GroupDefinition {
  id: string;
  title: string;
  description: string;
  tags: string[];
  credential: ApiCredential;
  /** Customer-facing wording by "METHOD /path" — Core's own descriptions are
   * written for its developers. */
  text?: Record<string, { summary: string; description: string }>;
}

const INGESTION_TOKEN: ApiCredential = {
  label: "Ingestion token",
  placeholder: "dtt_…",
  envVar: "DILANIX_INGESTION_TOKEN",
  header:
    "Authorization: Bearer <ingestion token> with the telemetry:logs:write scope",
};

/** What a customer's own code can call today. Everything else in Core's
 * OpenAPI (sign-in, settings, admin, …) is used only by the dashboard. */
export const API_GROUPS: GroupDefinition[] = [
  {
    id: "telemetry-ingestion",
    title: "Telemetry ingestion",
    description:
      "Send application logs with a source-scoped ingestion token — the endpoint your services call.",
    tags: ["telemetry-ingestion"],
    credential: INGESTION_TOKEN,
    text: {
      "POST /v1/telemetry/logs": {
        summary: "Send logs",
        description:
          "Accepts a batch of 1 to 1,000 log entries for the telemetry source the token belongs to — the token alone decides the organization, application, and environment. Values of secret-looking attributes are redacted before storage. Answers 202 with the number of accepted entries.",
      },
    },
  },
];

/** Read access with an API key — planned, not callable yet. Shown so
 * customers know what is coming; never part of the reference or Try it. */
export const PLANNED_API_GROUPS = [
  {
    id: "recommendations",
    title: "Recommendations",
    description: "Read your ranked recommendations and their details.",
  },
  {
    id: "cost",
    title: "Cost",
    description: "Read spend summaries, breakdowns, budgets, and anomalies.",
  },
  {
    id: "inventory",
    title: "Inventory and infrastructure",
    description: "Read your resources and how they connect.",
  },
] as const;

const METHOD_ORDER = ["get", "post", "put", "patch", "delete"];
const MAX_DEPTH = 6;

function refName(ref: string) {
  return ref.split("/").pop() ?? ref;
}

/** Inlines every `$ref` (bounded depth, cycle-safe) so the client never needs the components table. */
export function resolveSchema(
  schema: JsonSchema | undefined,
  doc: OpenApiDocument,
  depth = 0,
  seen: string[] = [],
): JsonSchema {
  if (!schema) return {};
  if (schema.$ref) {
    const name = refName(schema.$ref);
    if (seen.includes(name) || depth > MAX_DEPTH)
      return { type: "object", title: name, description: "(recursive)" };
    const target = doc.components?.schemas?.[name];
    return resolveSchema({ title: name, ...target }, doc, depth + 1, [
      ...seen,
      name,
    ]);
  }
  const resolved: JsonSchema = { ...schema };
  if (schema.items)
    resolved.items = resolveSchema(schema.items, doc, depth + 1, seen);
  if (schema.properties) {
    resolved.properties = Object.fromEntries(
      Object.entries(schema.properties).map(([key, value]) => [
        key,
        resolveSchema(value, doc, depth + 1, seen),
      ]),
    );
  }
  for (const key of ["anyOf", "oneOf", "allOf"] as const) {
    const variants = schema[key];
    if (variants)
      resolved[key] = variants.map((variant) =>
        resolveSchema(variant, doc, depth + 1, seen),
      );
  }
  if (
    schema.additionalProperties &&
    typeof schema.additionalProperties === "object"
  ) {
    resolved.additionalProperties = resolveSchema(
      schema.additionalProperties,
      doc,
      depth + 1,
      seen,
    );
  }
  return resolved;
}

/** The non-null variant of a nullable `anyOf: [T, null]`. */
export function unwrapNullable(schema: JsonSchema): {
  schema: JsonSchema;
  nullable: boolean;
} {
  const variants = schema.anyOf ?? schema.oneOf;
  if (variants) {
    const concrete = variants.filter((variant) => variant.type !== "null");
    if (concrete.length === 1 && concrete.length < variants.length) {
      return {
        schema: {
          ...concrete[0],
          description: schema.description ?? concrete[0]?.description,
          default: schema.default,
        },
        nullable: true,
      };
    }
  }
  return { schema, nullable: false };
}

export function typeLabel(schema: JsonSchema): string {
  const { schema: inner, nullable } = unwrapNullable(schema);
  let label: string;
  if (inner.enum) label = "enum";
  else if (inner.anyOf || inner.oneOf)
    label = (inner.anyOf ?? inner.oneOf ?? []).map(typeLabel).join(" | ");
  else if (inner.type === "array") label = `${typeLabel(inner.items ?? {})}[]`;
  else if (Array.isArray(inner.type)) label = inner.type.join(" | ");
  else
    label = inner.format
      ? `${inner.type ?? "object"} (${inner.format})`
      : (inner.type ?? (inner.properties ? "object" : (inner.title ?? "any")));
  return nullable ? `${label} | null` : label;
}

/** A plausible example value for a schema — what Try it pre-fills and code samples show. */
export function exampleFor(schema: JsonSchema, name = "", depth = 0): unknown {
  const { schema: inner } = unwrapNullable(schema);
  if (inner.example !== undefined) return inner.example;
  if (inner.examples?.length) return inner.examples[0];
  if (inner.default !== undefined && inner.default !== null)
    return inner.default;
  if (inner.const !== undefined) return inner.const;
  // A realistic choice over the first listed value (`info`, not `trace`).
  if (inner.enum?.length)
    return inner.enum.includes("info") ? "info" : inner.enum[0];
  if (depth > MAX_DEPTH) return null;
  const variants = inner.anyOf ?? inner.oneOf;
  if (variants?.length) return exampleFor(variants[0] ?? {}, name, depth + 1);
  if (inner.allOf?.length)
    return Object.assign(
      {},
      ...inner.allOf.map((part) => exampleFor(part, name, depth + 1)),
    );
  const type = Array.isArray(inner.type) ? inner.type[0] : inner.type;
  if (type === "array") {
    const item = exampleFor(inner.items ?? {}, name, depth + 1);
    return item === null ? [] : [item];
  }
  if (type === "object" || inner.properties) {
    const entries = Object.entries(inner.properties ?? {});
    const required = new Set(inner.required ?? []);
    const chosen = entries.filter(
      ([key]) => required.has(key) || entries.length <= 10,
    );
    if (!chosen.length && inner.additionalProperties) return { key: "value" };
    return Object.fromEntries(
      chosen.map(([key, value]) => [key, exampleFor(value, key, depth + 1)]),
    );
  }
  if (type === "integer") return inner.minimum ?? 1;
  if (type === "number") return inner.minimum ?? 1.5;
  if (type === "boolean") return true;
  if (type === "string") {
    if (inner.format === "date-time") return "2026-10-16T09:30:00Z";
    if (inner.format === "date") return "2026-10-01";
    if (inner.format === "uuid") return "00000000-0000-4000-8000-000000000000";
    if (inner.format === "email") return "you@company.com";
    if (inner.format === "uri") return "https://example.com";
    if (/password/i.test(name)) return "your-password";
    if (/message/i.test(name)) return "Payment captured";
    if (/name/i.test(name)) return "payments-api";
    return "string";
  }
  return null;
}

function operationId(method: string, path: string) {
  return `${method}-${path}`
    .replace(/[{}]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function buildOperation(
  method: string,
  path: string,
  operation: OpenApiOperation,
  doc: OpenApiDocument,
  credential: ApiCredential,
): ApiOperation {
  const parameters: ApiParameter[] = (operation.parameters ?? [])
    .filter(
      (parameter): parameter is OpenApiParameter & { in: "path" | "query" } =>
        parameter.in === "path" || parameter.in === "query",
    )
    .map((parameter) => ({
      name: parameter.name,
      in: parameter.in,
      required: parameter.in === "path" || Boolean(parameter.required),
      description:
        parameter.description ?? parameter.schema?.description ?? null,
      schema: resolveSchema(parameter.schema, doc),
    }));
  const bodySchema =
    operation.requestBody?.content?.["application/json"]?.schema;
  const body = bodySchema
    ? (() => {
        const schema = resolveSchema(bodySchema, doc);
        return {
          required: Boolean(operation.requestBody?.required),
          schema,
          example: exampleFor(schema),
        };
      })()
    : null;
  const responses = Object.entries(operation.responses ?? {})
    .filter(([status]) => status !== "422")
    .map(([status, response]) => {
      const raw = response.content?.["application/json"]?.schema;
      const schema = raw ? resolveSchema(raw, doc) : null;
      return {
        status,
        description: response.description ?? "",
        schema,
        example: schema ? exampleFor(schema) : null,
      };
    });
  return {
    id: operationId(method, path),
    method: method.toUpperCase(),
    path,
    summary: operation.summary ?? `${method.toUpperCase()} ${path}`,
    description: operation.description?.trim() || null,
    credential,
    parameters,
    body,
    responses,
  };
}

export function buildApiReference(doc: OpenApiDocument): ApiGroup[] {
  return API_GROUPS.map((group) => {
    const operations: ApiOperation[] = [];
    for (const [path, methods] of Object.entries(doc.paths)) {
      for (const method of METHOD_ORDER) {
        const operation = methods[method];
        if (
          !operation ||
          !operation.tags?.some((tag) => group.tags.includes(tag))
        )
          continue;
        const built = buildOperation(
          method,
          path,
          operation,
          doc,
          group.credential,
        );
        operations.push({
          ...built,
          ...group.text?.[`${built.method} ${path}`],
        });
      }
    }
    return {
      id: group.id,
      title: group.title,
      description: group.description,
      operations,
    };
  }).filter((group) => group.operations.length > 0);
}

export async function fetchOpenApi(baseUrl: string): Promise<OpenApiDocument> {
  const response = await fetch(`${baseUrl}/openapi.json`, {
    next: { revalidate: 300 },
  });
  if (!response.ok)
    throw new Error(`OpenAPI document unavailable (${response.status})`);
  return (await response.json()) as OpenApiDocument;
}

function shellQuote(value: string) {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

export function codeSamples(
  operation: ApiOperation,
  baseUrl: string,
  organizationId: string,
) {
  const path = operation.path.replace("{organization_id}", organizationId);
  const url = `${baseUrl}${path}`;
  const tokenVariable = operation.credential.envVar;
  const hasBody = operation.body !== null;
  const json = hasBody
    ? JSON.stringify(operation.body?.example ?? {}, null, 2)
    : "";
  const curl = [
    `curl -X ${operation.method} ${shellQuote(url)}`,
    `  -H "Authorization: Bearer $${tokenVariable}"`,
    hasBody ? `  -H "Content-Type: application/json"` : null,
    hasBody ? `  -d ${shellQuote(json)}` : null,
  ]
    .filter(Boolean)
    .join(" \\\n");
  const javascript = [
    `const response = await fetch("${url}", {`,
    `  method: "${operation.method}",`,
    `  headers: {`,
    `    Authorization: \`Bearer \${process.env.${tokenVariable}}\`,`,
    hasBody ? `    "Content-Type": "application/json",` : null,
    `  },`,
    hasBody ? `  body: JSON.stringify(${json.replace(/\n/g, "\n  ")}),` : null,
    `});`,
    `const data = await response.json();`,
  ]
    .filter(Boolean)
    .join("\n");
  const python = [
    `import os`,
    `import requests`,
    ``,
    `response = requests.${operation.method.toLowerCase()}(`,
    `    "${url}",`,
    `    headers={"Authorization": f"Bearer {os.environ['${tokenVariable}']}"},`,
    hasBody
      ? `    json=${json
          .replace(/\btrue\b/g, "True")
          .replace(/\bfalse\b/g, "False")
          .replace(/\bnull\b/g, "None")
          .replace(/\n/g, "\n    ")},`
      : null,
    `    timeout=30,`,
    `)`,
    `response.raise_for_status()`,
    `print(response.json())`,
  ]
    .filter((line) => line !== null)
    .join("\n");
  return [
    { label: "cURL", language: "bash", code: curl },
    { label: "JavaScript", language: "javascript", code: javascript },
    { label: "Python", language: "python", code: python },
  ];
}
