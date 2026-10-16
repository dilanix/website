import {
  Callout,
  CardGrid,
  CodeTabs,
  DocHero,
  DocSection,
  DocTable,
  InlineCode,
  LinkCard,
  Pill,
  Step,
  Steps,
} from "@/components/docs/doc-blocks";
import type { DocsPageProps } from "./types";

export function ApiOverviewPage({ baseUrl }: DocsPageProps) {
  return (
    <>
      <DocHero
        eyebrow="Developers"
        icon="code"
        title="API overview"
        description="The Dilanix API is for your own code: your services send telemetry today, and read access with API keys is on the way. Every call uses a key you create in Dilanix — never a person's password."
      />

      <DocSection title="Base URL">
        <CodeTabs
          samples={[{ label: "Base URL", language: "text", code: baseUrl }]}
        />
        <p>
          Every path starts with <InlineCode>/v1</InlineCode>. The key you send
          decides which organization a request belongs to — nothing in the
          request can change that.
        </p>
      </DocSection>

      <DocSection title="Credentials">
        <DocTable
          head={["Credential", "Looks like", "Use it for", "Status"]}
          rows={[
            [
              "Ingestion token",
              <InlineCode key="f">dtt_…</InlineCode>,
              "Sending logs from one telemetry source",
              <Pill key="s" tone="success">
                Available
              </Pill>,
            ],
            [
              "API key",
              <InlineCode key="f">dil_live_…</InlineCode>,
              "Reading Recommendations, Cost, and Inventory data",
              <Pill key="s" tone="warning">
                Planned
              </Pill>,
            ],
          ]}
        />
        <Callout tone="important">
          Keep keys in a secret manager or environment variable, never in source
          code. Both are shown only once when you create them and can be revoked
          at any time.
        </Callout>
      </DocSection>

      <DocSection title="Ingestion tokens">
        <Steps>
          <Step title="Create a telemetry source">
            <p>
              In <strong>Applications</strong>, open the environment your
              service runs in and add a source.
            </p>
          </Step>
          <Step title="Create a token">
            <p>
              The token belongs to that one source and carries the{" "}
              <InlineCode>telemetry:logs:write</InlineCode> scope.
            </p>
          </Step>
          <Step title="Send logs">
            <p>
              Send <InlineCode>Authorization: Bearer &lt;token&gt;</InlineCode>{" "}
              with <InlineCode>POST /v1/telemetry/logs</InlineCode>.
            </p>
          </Step>
        </Steps>
        <CodeTabs
          samples={[
            {
              label: "cURL",
              language: "bash",
              code: `curl -X POST '${baseUrl}/v1/telemetry/logs' \\\n  -H "Authorization: Bearer $DILANIX_INGESTION_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d '{"logs": [{"timestamp": "2026-10-16T09:30:00Z", "severity": "info", "message": "Payment captured"}]}'\n# → 202 {"accepted": 1}`,
            },
          ]}
        />
      </DocSection>

      <DocSection title="API keys">
        <p>
          Create keys on the <strong>API Keys</strong> page (when enabled for
          your organization). A key looks like{" "}
          <InlineCode>dil_live_1a2b3c4d.&lt;secret&gt;</InlineCode>: the part
          before the dot stays visible in the list, the secret is shown once.
        </p>
        <DocTable
          head={["Access", "Means"]}
          rows={[
            [
              "Full",
              "Every product your organization can use — follows your plan as it changes",
            ],
            ["Restricted", "Only the products you pick when creating the key"],
          ]}
        />
        <Callout tone="warning" title="Planned">
          No endpoint accepts API keys yet. Read access to Recommendations,
          Cost, and Inventory with an API key is planned; this page and the API
          reference will list those endpoints when they are available.
        </Callout>
      </DocSection>

      <DocSection title="Conventions">
        <DocTable
          head={["Topic", "Convention"]}
          rows={[
            ["Format", "JSON in and out; send Content-Type: application/json"],
            ["IDs", "UUIDs"],
            ["Time", "ISO 8601 with a time zone, e.g. 2026-10-16T09:30:00Z"],
            [
              "Tenancy",
              "Your key decides the organization; another organization's data is never visible",
            ],
          ]}
        />
      </DocSection>

      <DocSection title="Errors">
        <p>
          Errors answer with an HTTP status and a JSON body:{" "}
          <InlineCode>{`{"detail": "Could not validate credentials"}`}</InlineCode>
          . Validation errors (422) list each invalid field.
        </p>
        <DocTable
          head={["Status", "Meaning"]}
          rows={[
            ["400", "The request is not valid for this resource"],
            ["401", "Missing, invalid, expired, or revoked credential"],
            [
              "403",
              "The credential does not allow this (for example, a missing scope)",
            ],
            ["422", "The body or parameters do not match the schema"],
          ]}
        />
      </DocSection>

      <DocSection title="Explore every endpoint">
        <CardGrid>
          <LinkCard
            href="/dashboard/docs/api-reference"
            icon="braces"
            title="API reference"
            description="Schemas, code samples, and Try it for every endpoint you can call."
          />
          <LinkCard
            href="/dashboard/docs/send-logs"
            icon="send"
            title="Send logs"
            description="The ingestion endpoint with a live playground."
          />
        </CardGrid>
      </DocSection>
    </>
  );
}
