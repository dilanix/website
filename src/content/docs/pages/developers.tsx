import {
  Callout,
  CardGrid,
  CodeTabs,
  DocHero,
  DocSection,
  DocTable,
  InlineCode,
  LinkCard,
  Step,
  Steps,
} from "@/components/docs/doc-blocks";
import type { DocsPageProps } from "./types";

export function ApiOverviewPage({ baseUrl, organizationId }: DocsPageProps) {
  return (
    <>
      <DocHero
        eyebrow="Developers"
        icon="code"
        title="API overview"
        description="Everything in Dilanix is available over a JSON REST API: the same API the dashboard uses. Your services send telemetry with an ingestion token; your scripts read data as a user."
      />

      <DocSection title="Base URL">
        <CodeTabs
          samples={[{ label: "Base URL", language: "text", code: baseUrl }]}
        />
        <p>
          Every path starts with <InlineCode>/v1</InlineCode>. Your
          organization&apos;s ID — <InlineCode>{organizationId}</InlineCode> —
          goes into every{" "}
          <InlineCode>/v1/organizations/{"{organization_id}"}/…</InlineCode>{" "}
          path. Examples in this documentation already use it.
        </p>
      </DocSection>

      <DocSection title="Two kinds of credentials">
        <DocTable
          head={["Credential", "Used by", "Can do"]}
          rows={[
            [
              "Ingestion token (dtt_…)",
              "Your services and log shippers",
              "Only send telemetry for its one source",
            ],
            [
              "Access token",
              "Your scripts and integrations, as a Dilanix user",
              "Whatever that user's role allows",
            ],
          ]}
        />
        <Callout tone="important">
          Never put a user&apos;s access token or password in an application.
          Services send telemetry with an ingestion token.
        </Callout>
      </DocSection>

      <DocSection title="Get an access token">
        <Steps>
          <Step title="Sign in">
            <p>
              Exchange email and password for tokens. The access token lasts
              about an hour; the refresh token gets a new one without the
              password.
            </p>
          </Step>
          <Step title="Call the API">
            <p>
              Send{" "}
              <InlineCode>
                Authorization: Bearer &lt;access_token&gt;
              </InlineCode>{" "}
              with every request.
            </p>
          </Step>
          <Step title="Refresh before it expires">
            <p>
              <InlineCode>expires_in</InlineCode> says when; call{" "}
              <InlineCode>/v1/auth/refresh</InlineCode> with the refresh token.
            </p>
          </Step>
        </Steps>
        <CodeTabs
          samples={[
            {
              label: "cURL",
              language: "bash",
              code: `# 1. Sign in\ncurl -X POST '${baseUrl}/v1/auth/login' \\\n  -H "Content-Type: application/json" \\\n  -d '{"email": "you@company.com", "password": "your-password"}'\n# → {"access_token": "…", "refresh_token": "…", "token_type": "bearer", "expires_in": 3600, …}\n\n# 2. Call the API\ncurl '${baseUrl}/v1/organizations/${organizationId}/recommendations?limit=10' \\\n  -H "Authorization: Bearer $DILANIX_TOKEN"\n\n# 3. Refresh\ncurl -X POST '${baseUrl}/v1/auth/refresh' \\\n  -H "Content-Type: application/json" \\\n  -d '{"refresh_token": "…"}'`,
            },
            {
              label: "Python",
              language: "python",
              code: `import os\nimport requests\n\nBASE = "${baseUrl}"\n\ntokens = requests.post(\n    f"{BASE}/v1/auth/login",\n    json={"email": os.environ["DILANIX_EMAIL"], "password": os.environ["DILANIX_PASSWORD"]},\n    timeout=30,\n).json()\nheaders = {"Authorization": f"Bearer {tokens['access_token']}"}\n\nme = requests.get(f"{BASE}/v1/auth/me", headers=headers, timeout=30).json()\norganization_id = me["organizations"][0]["organization_id"]\n\nrecommendations = requests.get(\n    f"{BASE}/v1/organizations/{organization_id}/recommendations",\n    headers=headers,\n    params={"limit": 10},\n    timeout=30,\n).json()\nfor item in recommendations["items"]:\n    print(item["rank"], item["title"])`,
            },
            {
              label: "Node.js",
              language: "javascript",
              code: `const BASE = "${baseUrl}";\n\nconst tokens = await fetch(\`\${BASE}/v1/auth/login\`, {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify({ email: process.env.DILANIX_EMAIL, password: process.env.DILANIX_PASSWORD }),\n}).then((response) => response.json());\n\nconst headers = { Authorization: \`Bearer \${tokens.access_token}\` };\nconst me = await fetch(\`\${BASE}/v1/auth/me\`, { headers }).then((response) => response.json());\nconst organizationId = me.organizations[0].organization_id;\n\nconst { items } = await fetch(\n  \`\${BASE}/v1/organizations/\${organizationId}/recommendations?limit=10\`,\n  { headers },\n).then((response) => response.json());\nconsole.log(items.map((item) => item.title));`,
            },
          ]}
        />
      </DocSection>

      <DocSection title="Conventions">
        <DocTable
          head={["Topic", "Convention"]}
          rows={[
            ["Format", "JSON in and out; send Content-Type: application/json"],
            ["IDs", "UUIDs"],
            ["Time", "ISO 8601 in UTC, e.g. 2026-10-16T09:30:00Z"],
            [
              "Money",
              "Decimal strings with a separate currency — never floats, never mixed currencies",
            ],
            [
              "Lists",
              "limit and offset query parameters; responses carry items and total",
            ],
            [
              "Tenancy",
              "Everything is scoped to your organization; another organization's IDs answer 404",
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
            ["401", "Missing or expired credentials"],
            ["403", "Your role or plan does not allow this"],
            ["404", "Not found — or not in your organization"],
            [
              "409",
              "Conflicts with the current state (for example, already running)",
            ],
            ["422", "The body or parameters do not match the schema"],
            [
              "429",
              "Too many requests, or the AI budget for the month is used up",
            ],
          ]}
        />
      </DocSection>

      <DocSection title="Explore every endpoint">
        <CardGrid>
          <LinkCard
            href="/dashboard/docs/api-reference"
            icon="braces"
            title="API reference"
            description="Schemas, code samples, and Try it for every client endpoint."
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
