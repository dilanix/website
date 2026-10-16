import {
  DocLink,
  Callout,
  CodeTabs,
  DocHero,
  DocSection,
  DocTable,
  Faq,
  InlineCode,
  Pill,
  Step,
  Steps,
} from "@/components/docs/doc-blocks";
import { TelemetryFlow } from "@/components/docs/flow-diagram";
import { LogPlayground } from "@/components/docs/widgets";
import type { DocsPageProps } from "./types";

export function ApplicationsPage() {
  return (
    <>
      <DocHero
        eyebrow="Telemetry"
        icon="app"
        title="Applications and environments"
        description="Applications describe the services you run; environments describe where each one runs. Telemetry always belongs to one environment."
      />

      <DocSection title="The model">
        <div className="border-border-soft bg-dashboard-panel rounded-3xl border p-5 font-mono text-[13px] leading-7">
          <p className="text-foreground">payments-api</p>
          <p className="text-muted-foreground">
            ├── production{" "}
            <span className="text-accent">
              → telemetry sources → ingestion tokens
            </span>
          </p>
          <p className="text-muted-foreground">├── staging</p>
          <p className="text-muted-foreground">└── development</p>
        </div>
        <DocTable
          head={["Entity", "Belongs to", "Key fields"]}
          rows={[
            [
              "Application",
              "Your organization",
              "name, slug (unique in the organization), description, status",
            ],
            [
              "Environment",
              "One application",
              "name, slug (unique in the application), status",
            ],
            [
              "Telemetry source",
              "One environment",
              "name, type, optional cloud account, configuration",
            ],
          ]}
        />
        <Callout tone="note">
          Applications are independent of cloud connections: one environment may
          use several clouds, and one cloud account may serve many environments.
        </Callout>
      </DocSection>

      <DocSection title="Create them">
        <Steps>
          <Step title="Add an application">
            <p>
              Open <strong>Applications</strong> and create one per service —
              for example <InlineCode>payments-api</InlineCode>.
            </p>
          </Step>
          <Step title="Add its environments">
            <p>
              Add an environment for every place it runs: production, staging,
              development.
            </p>
          </Step>
          <Step title="Add a telemetry source">
            <p>
              In an environment, add a source and an ingestion token — see{" "}
              <DocLink
                className="text-accent hover:underline"
                href="/dashboard/docs/telemetry-sources"
              >
                Sources and ingestion tokens
              </DocLink>
              .
            </p>
          </Step>
        </Steps>
      </DocSection>

      <DocSection title="Archive or delete">
        <DocTable
          head={["Action", "Effect"]}
          rows={[
            [
              <Pill key="a" tone="neutral">
                Archive
              </Pill>,
              "Reversible. An archived source rejects new telemetry; nothing is deleted.",
            ],
            [
              <Pill key="a" tone="warning">
                Delete
              </Pill>,
              "Permanent. You type the name to confirm; every environment, source, token, and stored log beneath it is deleted.",
            ],
          ]}
        />
      </DocSection>
    </>
  );
}

export function TelemetrySourcesPage() {
  return (
    <>
      <DocHero
        eyebrow="Telemetry"
        icon="radio"
        title="Sources and ingestion tokens"
        description="A telemetry source is how one environment's telemetry reaches Dilanix. Its ingestion tokens are the only credentials your services need."
      />

      <DocSection title="Create a source">
        <p>
          In an environment, click <strong>Add source</strong>, name it, and
          pick its type. The type records what sends the data — today every type
          sends through the same HTTP endpoint.
        </p>
        <DocTable
          head={["Type", "Use for"]}
          rows={[
            ["OTLP", "OpenTelemetry collectors and SDKs"],
            [
              "Dilanix Python / Node / Go / PHP",
              "Services in those languages calling the HTTP endpoint",
            ],
            ["Custom HTTP", "Anything else that can send JSON over HTTPS"],
            [
              "AWS CloudWatch, Cloudflare, Kubernetes",
              "Telemetry tied to a cloud account (optionally linked to a verified target)",
            ],
          ]}
        />
      </DocSection>

      <DocSection title="Create an ingestion token">
        <Steps>
          <Step title="Open the source and click Create token">
            <p>Choose the scopes it needs and, ideally, an expiration date.</p>
          </Step>
          <Step title="Copy it once">
            <p>
              The token — <InlineCode>dtt_…</InlineCode> — is shown{" "}
              <strong>only once</strong>. Store it in your secret manager or
              deployment environment, for example as{" "}
              <InlineCode>DILANIX_INGESTION_TOKEN</InlineCode>.
            </p>
          </Step>
          <Step title="Send telemetry">
            <p>
              Your service sends it as{" "}
              <InlineCode>Authorization: Bearer &lt;token&gt;</InlineCode>. The
              token alone decides the organization, application, environment,
              and source.
            </p>
          </Step>
        </Steps>
        <DocTable
          head={["Scope", "Allows"]}
          rows={[
            [
              <InlineCode key="s">telemetry:logs:write</InlineCode>,
              "Sending logs (POST /v1/telemetry/logs)",
            ],
            [
              <InlineCode key="s">telemetry:traces:write</InlineCode>,
              "Reserved for trace ingestion",
            ],
            [
              <InlineCode key="s">telemetry:metrics:write</InlineCode>,
              "Reserved for metric ingestion",
            ],
            [
              <InlineCode key="s">telemetry:events:write</InlineCode>,
              "Reserved for event ingestion",
            ],
          ]}
        />
      </DocSection>

      <DocSection title="Keep tokens safe">
        <DocTable
          head={["Practice", "Why"]}
          rows={[
            [
              "One token per service and environment",
              "Revoke one without touching the others",
            ],
            ["Set an expiration", "A leaked token stops working on its own"],
            [
              "Only the scopes you need",
              "A logs token cannot send anything else",
            ],
            [
              "Revoke, then delete",
              "Revoke stops it immediately; delete removes the record",
            ],
          ]}
        />
        <Callout tone="important" title="A token can only send">
          An ingestion token can never read data, manage your organization, or
          call any other API — even if it leaks.
        </Callout>
      </DocSection>
    </>
  );
}

export function SendLogsPage({ baseUrl }: DocsPageProps) {
  const url = `${baseUrl}/v1/telemetry/logs`;
  return (
    <>
      <DocHero
        eyebrow="Telemetry"
        icon="send"
        title="Send logs"
        description="Ship application logs to Dilanix in batches with one HTTP call. Build a log below, see the exact request, and send a test with your own token."
      />

      <DocSection title="How it works">
        <TelemetryFlow />
      </DocSection>

      <DocSection title="Playground">
        <LogPlayground baseUrl={baseUrl} />
      </DocSection>

      <DocSection title="The request">
        <DocTable
          head={["", ""]}
          rows={[
            ["Endpoint", <InlineCode key="v">POST {url}</InlineCode>],
            [
              "Authorization",
              <InlineCode key="v">Bearer &lt;ingestion token&gt;</InlineCode>,
            ],
            ["Body", "A JSON object with a logs array of 1 to 1,000 entries"],
            [
              "Response",
              <span key="v">
                <InlineCode>202 Accepted</InlineCode> with{" "}
                <InlineCode>{`{"accepted": n}`}</InlineCode>
              </span>,
            ],
          ]}
        />
        <DocTable
          head={["Field", "Type", "Notes"]}
          rows={[
            [
              <InlineCode key="f">timestamp</InlineCode>,
              "string (date-time)",
              "Required. When the event happened, ISO 8601 with a time zone",
            ],
            [
              <InlineCode key="f">severity</InlineCode>,
              "enum",
              "Required. trace, debug, info, warn, error, fatal",
            ],
            [
              <InlineCode key="f">message</InlineCode>,
              "string",
              "Required. The log line",
            ],
            [
              <InlineCode key="f">attributes</InlineCode>,
              "object of strings",
              "Optional key/value context. Values of secret-looking keys (password, secret, authorization, api_key, …) are redacted before storage",
            ],
            [
              <InlineCode key="f">service_name</InlineCode>,
              "string",
              "Optional, e.g. payments-api",
            ],
            [
              <InlineCode key="f">service_version</InlineCode>,
              "string",
              "Optional, e.g. 1.4.2",
            ],
            [
              <InlineCode key="f">trace_id</InlineCode>,
              <span key="t">string</span>,
              "Optional, to correlate with traces",
            ],
            [<InlineCode key="f">span_id</InlineCode>, "string", "Optional"],
            [<InlineCode key="f">request_id</InlineCode>, "string", "Optional"],
          ]}
        />
      </DocSection>

      <DocSection title="In your language">
        <CodeTabs
          samples={[
            {
              label: "cURL",
              language: "bash",
              code: `curl -X POST '${url}' \\\n  -H "Authorization: Bearer $DILANIX_INGESTION_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d '{"logs": [{"timestamp": "2026-10-16T09:30:00Z", "severity": "info", "message": "Payment captured", "service_name": "payments-api"}]}'`,
            },
            {
              label: "Python",
              language: "python",
              code: `import os\nfrom datetime import datetime, timezone\n\nimport requests\n\nresponse = requests.post(\n    "${url}",\n    headers={"Authorization": f"Bearer {os.environ['DILANIX_INGESTION_TOKEN']}"},\n    json={\n        "logs": [\n            {\n                "timestamp": datetime.now(timezone.utc).isoformat(),\n                "severity": "info",\n                "message": "Payment captured",\n                "service_name": "payments-api",\n                "attributes": {"order_id": "A-1042"},\n            }\n        ]\n    },\n    timeout=10,\n)\nresponse.raise_for_status()  # 202 Accepted\nprint(response.json())  # {"accepted": 1}`,
            },
            {
              label: "Node.js",
              language: "javascript",
              code: `const response = await fetch("${url}", {\n  method: "POST",\n  headers: {\n    Authorization: \`Bearer \${process.env.DILANIX_INGESTION_TOKEN}\`,\n    "Content-Type": "application/json",\n  },\n  body: JSON.stringify({\n    logs: [\n      {\n        timestamp: new Date().toISOString(),\n        severity: "info",\n        message: "Payment captured",\n        service_name: "payments-api",\n        attributes: { order_id: "A-1042" },\n      },\n    ],\n  }),\n});\nif (response.status !== 202) throw new Error(await response.text());`,
            },
            {
              label: "Go",
              language: "go",
              code: `package main\n\nimport (\n\t"bytes"\n\t"encoding/json"\n\t"net/http"\n\t"os"\n\t"time"\n)\n\nfunc main() {\n\tbody, _ := json.Marshal(map[string]any{\n\t\t"logs": []map[string]any{{\n\t\t\t"timestamp":    time.Now().UTC().Format(time.RFC3339),\n\t\t\t"severity":     "info",\n\t\t\t"message":      "Payment captured",\n\t\t\t"service_name": "payments-api",\n\t\t}},\n\t})\n\treq, _ := http.NewRequest("POST", "${url}", bytes.NewReader(body))\n\treq.Header.Set("Authorization", "Bearer "+os.Getenv("DILANIX_INGESTION_TOKEN"))\n\treq.Header.Set("Content-Type", "application/json")\n\tresp, err := http.DefaultClient.Do(req)\n\tif err != nil || resp.StatusCode != http.StatusAccepted {\n\t\tpanic("log batch was not accepted")\n\t}\n}`,
            },
          ]}
        />
        <Callout tone="tip" title="Batch your logs">
          Send logs in batches (for example every few seconds, or every 500
          entries) instead of one request per line. A batch holds up to 1,000
          entries.
        </Callout>
      </DocSection>

      <DocSection title="Errors">
        <DocTable
          head={["Status", "Meaning", "What to do"]}
          rows={[
            ["202", "Accepted", "Nothing — the logs are stored"],
            [
              "401",
              "Missing, invalid, expired, or revoked token — or the source is archived",
              "Check the token and the source's status",
            ],
            [
              "403",
              "The token lacks telemetry:logs:write",
              "Create a token with that scope",
            ],
            [
              "422",
              "The body does not match the schema (empty batch, more than 1,000 entries, bad severity…)",
              "Fix the fields listed in the response",
            ],
          ]}
        />
      </DocSection>

      <DocSection title="Questions">
        <Faq
          items={[
            {
              question: "How do I know logs arrived?",
              answer:
                "The response says how many entries were accepted, and the source's “Last received” time in the environment updates.",
            },
            {
              question: "Can I send logs from the browser?",
              answer:
                "No — that would expose the token. Send from your backend or a log shipper.",
            },
          ]}
        />
      </DocSection>
    </>
  );
}
