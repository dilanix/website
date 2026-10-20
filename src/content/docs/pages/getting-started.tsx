import {
  CardGrid,
  Callout,
  DocHero,
  DocSection,
  DocTable,
  Faq,
  InlineCode,
  LinkCard,
  Pill,
  Reveal,
  Screenshot,
  Step,
  Steps,
} from "@/components/docs/doc-blocks";
import { PlatformFlow } from "@/components/docs/flow-diagram";

export function WelcomePage() {
  return (
    <>
      <DocHero
        eyebrow="Documentation"
        icon="sparkles"
        title="Welcome to Dilanix"
        description="Dilanix connects to your cloud, understands what you run and what it costs, and tells you — safely and step by step — how to run it better. This documentation shows you every part of it."
      >
        <div className="flex flex-wrap gap-2">
          <Pill>Read-only by design</Pill>
          <Pill tone="success">Every change reviewed for safety</Pill>
          <Pill tone="neutral">REST API for your services</Pill>
        </div>
      </DocHero>

      <DocSection title="How Dilanix works">
        <p>
          Dilanix reads your cloud through a read-only role, keeps a fresh copy
          of what it learns in a few shared datasets, and builds every product
          on top of them. Hover any box to see what it does.
        </p>
        <PlatformFlow />
        <Callout tone="important" title="Dilanix never changes your cloud">
          It reads configuration, bills, and metrics. Every change it suggests
          is something you carry out yourself, with instructions it prepares for
          you.
        </Callout>
      </DocSection>

      <DocSection title="Start here">
        <CardGrid columns={3}>
          <LinkCard
            href="/dashboard/docs/quickstart"
            icon="rocket"
            title="Quickstart"
            description="From an empty workspace to your first numbers in four steps."
          />
          <LinkCard
            href="/dashboard/docs/concepts"
            icon="boxes"
            title="Core concepts"
            description="The handful of words everything else is built on."
          />
          <LinkCard
            href="/dashboard/docs/connect-aws"
            icon="cloud"
            title="Connect AWS"
            description="Create the read-only role and verify your accounts."
          />
        </CardGrid>
      </DocSection>

      <DocSection title="Explore the products">
        <CardGrid>
          <LinkCard
            href="/dashboard/docs/cost"
            icon="dollar"
            title="Cost"
            description="Spend and trends, budgets, allocations, anomalies, and scheduled reports."
          />
          <LinkCard
            href="/dashboard/docs/recommendations"
            icon="lightbulb"
            title="Recommendations"
            description="Reviewed, ranked savings — each with a How to fix guide."
          />
          <LinkCard
            href="/dashboard/docs/infrastructure"
            icon="network"
            title="Infrastructure graph"
            description="Every resource and how they connect, with the evidence for each link."
          />
          <LinkCard
            href="/dashboard/docs/send-logs"
            icon="send"
            title="Telemetry"
            description="Send your application logs to Dilanix with a scoped token."
          />
        </CardGrid>
      </DocSection>

      <DocSection title="For developers">
        <CardGrid>
          <LinkCard
            href="/dashboard/docs/api"
            icon="code"
            title="API overview"
            description="Base URL, authentication, errors, and conventions."
          />
          <LinkCard
            href="/dashboard/docs/api-reference"
            icon="braces"
            title="API reference"
            description="Every client endpoint with schemas, code samples, and Try it."
          />
        </CardGrid>
      </DocSection>
    </>
  );
}

export function QuickstartPage() {
  return (
    <>
      <DocHero
        eyebrow="Getting started"
        icon="rocket"
        title="Quickstart"
        description="Four steps take you from an empty workspace to cost numbers, an infrastructure graph, and your first recommendations. Plan on about ten minutes, plus AWS's first billing export."
      />

      <DocSection title="1. Connect your AWS account">
        <Steps>
          <Step title="Add a connection">
            <p>
              Open <strong>Integrations</strong> and add an <strong>AWS</strong>{" "}
              connection. Give it a name you will recognize, such as “Company
              AWS”.
            </p>
          </Step>
          <Step title="Launch the CloudFormation stack">
            <p>
              Click <strong>Launch in AWS CloudFormation</strong>. AWS opens
              with the Dilanix template already selected. Paste the{" "}
              <strong>External ID</strong> Dilanix shows you into the
              stack&apos;s <InlineCode>ExternalId</InlineCode> parameter and
              create the stack. It creates one read-only IAM role.
            </p>
          </Step>
          <Step title="Verify">
            <p>
              Back in Dilanix, verify the connection. The AWS account appears as
              a verified <strong>target</strong>. Repeat for every account you
              want to see.
            </p>
          </Step>
        </Steps>
        <Screenshot
          src="/docs/integrations.png"
          alt="The Integrations page with a connected AWS account"
          url="app.dilanix.com/dashboard/integrations"
        />
      </DocSection>

      <DocSection title="2. Choose what Dilanix may read">
        <p>
          On the connection&apos;s <strong>Access</strong> tab, turn on the
          capabilities you want. Each one maps to a dataset; together they
          decide which products have data.
        </p>
        <DocTable
          head={["Capability", "Unlocks"]}
          rows={[
            [
              "Inventory Read",
              "Resource lists, the Infrastructure graph (including which resources talk to each other), and most recommendations",
            ],
            [
              "Billing Read",
              "Every Cost view; with the FOCUS export, per-resource and per-tag detail too",
            ],
            [
              "Metrics Read",
              "How busy each resource is — what idle and oversized recommendations rely on",
            ],
            ["Security Read", "Security posture data for products that use it"],
          ]}
        />
      </DocSection>

      <DocSection title="3. Run your first sync">
        <p>
          Open <strong>Sync</strong> in the menu and click{" "}
          <strong>Sync now</strong> — or just wait: every dataset then refreshes
          on its own schedule.
        </p>
        <Callout tone="tip" title="How long until I see data?">
          Inventory and Cost Explorer totals arrive within minutes. AWS writes
          the detailed FOCUS billing export once a day, so the{" "}
          <strong>first delivery can take up to 24 hours</strong>.
          Recommendations need about 14 days of metrics to judge a resource.
        </Callout>
      </DocSection>

      <DocSection title="4. Explore">
        <Reveal>
          <CardGrid>
            <LinkCard
              href="/dashboard/products/cost"
              icon="dollar"
              title="Open Cost"
              description="See this month's spend against the last one."
            />
            <LinkCard
              href="/dashboard/recommendations"
              icon="lightbulb"
              title="Open Recommendations"
              description="The top 10 things worth changing, ranked."
            />
            <LinkCard
              href="/dashboard/products/infrastructure"
              icon="network"
              title="Open Infrastructure"
              description="Your resources as a live graph."
            />
            <LinkCard
              href="/dashboard/notifications"
              icon="bell"
              title="Set up notifications"
              description="Get budget alerts and reports in Slack or email."
            />
          </CardGrid>
        </Reveal>
      </DocSection>

      <DocSection title="Common questions">
        <Faq
          items={[
            {
              question: "Is there a guided tour?",
              answer:
                "Yes — the Infrastructure graph and Cost's Overview, Explorer and Budgets pages each show a short tour the first time you open them. Replay any of them from Help & Support, the question-mark button at the top of every dashboard page.",
            },
            {
              question: "Do I need the FOCUS billing export?",
              answer:
                "No — Cost works with Cost Explorer totals alone. The export adds per-resource, per-tag, and per-charge detail, which allocations, scoped budgets, the Resources view, and most savings estimates rely on.",
            },
            {
              question: "Can I connect several AWS accounts?",
              answer:
                "Yes. One connection can hold several verified accounts (targets), each with its own name such as “Prod” or “Dev”. You can also add more connections.",
            },
            {
              question: "Can Dilanix change anything in my account?",
              answer:
                "No. The role it uses only has read permissions, and Dilanix never runs commands for you — How to fix guides are instructions you carry out yourself.",
            },
          ]}
        />
      </DocSection>
    </>
  );
}

export function ConceptsPage() {
  return (
    <>
      <DocHero
        eyebrow="Getting started"
        icon="boxes"
        title="Core concepts"
        description="A few words come up everywhere in Dilanix. Knowing them makes every screen easier to read."
      />

      <DocSection title="Your workspace">
        <DocTable
          head={["Concept", "What it is", "Example"]}
          rows={[
            [
              "Organization",
              "Your workspace. Everything you see belongs to exactly one organization, and nothing crosses between organizations.",
              "Acme Inc.",
            ],
            [
              "Member and role",
              "A person in the organization, with a role that decides what they can change.",
              "Jane — Admin",
            ],
            [
              "Product",
              "A part of Dilanix you use: Cost, Infrastructure, and so on.",
              "Cost",
            ],
          ]}
        />
      </DocSection>

      <DocSection title="Your cloud">
        <DocTable
          head={["Concept", "What it is", "Example"]}
          rows={[
            [
              "Connection",
              "Your link to a cloud provider: the read-only role, its settings, and what it may read.",
              "Company AWS",
            ],
            [
              "Target",
              "One account inside a connection. A connection can hold several.",
              "AWS account 1111 2222 3333 — “Prod”",
            ],
            [
              "Capability",
              "A kind of data a connection may read, switched on per connection.",
              "Billing, Inventory, Metrics",
            ],
            [
              "Dataset",
              "A collection of normalized data Dilanix keeps fresh for each target.",
              "Inventory Resources, Cost Usage (FOCUS)",
            ],
            [
              "Sync",
              "One refresh of one or more datasets — on a schedule, or when you click Sync now.",
              "Hourly inventory sync",
            ],
          ]}
        />
      </DocSection>

      <DocSection title="Your applications">
        <DocTable
          head={["Concept", "What it is", "Example"]}
          rows={[
            [
              "Application",
              "A service you run, independent of any cloud account.",
              "payments-api",
            ],
            [
              "Environment",
              "Where an application runs.",
              "production, staging",
            ],
            [
              "Telemetry source",
              "How telemetry for one environment enters Dilanix.",
              "payments-api production logs",
            ],
            [
              "Ingestion token",
              "A secret your service sends telemetry with — scoped to one source, revocable, optionally expiring.",
              "dtt_…",
            ],
          ]}
        />
      </DocSection>

      <DocSection title="What Dilanix tells you">
        <DocTable
          head={["Concept", "What it is"]}
          rows={[
            [
              "Recommendation",
              "A reviewed, safe change that saves money, ranked against all others.",
            ],
            [
              "Evidence",
              "The facts behind a recommendation or a relationship — always shown, never hidden.",
            ],
            [
              "Anomaly",
              "A day whose spend jumped well above the previous week's average.",
            ],
            ["Budget", "A spending limit with alerts before you reach it."],
          ]}
        />
      </DocSection>
    </>
  );
}
