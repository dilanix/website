import {
  DocLink,
  Callout,
  CardGrid,
  DocHero,
  DocSection,
  DocTable,
  Faq,
  InlineCode,
  LinkCard,
  Pill,
  Screenshot,
  Step,
  Steps,
  SubHeading,
} from "@/components/docs/doc-blocks";
import { GuideEmbed } from "@/components/guides/guide-embed";
import { INTEGRATIONS_GUIDE_KEY } from "@/lib/guides/definitions/integrations";
import { SYNC_GUIDE_KEY } from "@/lib/guides/definitions/sync";
import { INFRASTRUCTURE_GUIDE_KEY } from "@/lib/guides/definitions/infrastructure";

export function ConnectAwsPage() {
  return (
    <>
      <DocHero
        eyebrow="Platform"
        icon="cloud"
        title="Connect AWS"
        description="Dilanix reads your AWS accounts through one IAM role that you create with a CloudFormation stack. The role can only read, and only what you allow."
      />

      <GuideEmbed guideKey={INTEGRATIONS_GUIDE_KEY} />

      <DocSection title="Create the connection">
        <Steps>
          <Step title="Add an AWS connection">
            <p>
              In <strong>Integrations</strong>, choose{" "}
              <strong>Amazon Web Services</strong> and name the connection.
            </p>
          </Step>
          <Step title="Launch the stack">
            <p>
              Click <strong>Launch in AWS CloudFormation</strong> while signed
              in to the AWS account you want to connect. Copy the{" "}
              <strong>External ID</strong> from Dilanix into the{" "}
              <InlineCode>ExternalId</InlineCode> parameter — it proves that
              requests for this role come from your Dilanix workspace and no
              other.
            </p>
          </Step>
          <Step title="Choose the parameters">
            <p>
              Every read permission is a parameter you can switch off. The
              defaults give Dilanix the complete picture.
            </p>
          </Step>
          <Step title="Create the stack and verify">
            <p>
              When the stack finishes, verify the connection in Dilanix. The
              account becomes a verified <strong>target</strong>. To add another
              account, launch the same stack there and verify again — or click{" "}
              <strong>Add target</strong> on the connection.
            </p>
          </Step>
        </Steps>
      </DocSection>

      <DocSection title="Stack parameters">
        <DocTable
          head={["Parameter", "Default", "What it allows"]}
          rows={[
            [
              <InlineCode key="p">EnableInventoryRead</InlineCode>,
              "true",
              "Discover resources and their configuration",
            ],
            [
              <InlineCode key="p">EnableBillingRead</InlineCode>,
              "true",
              "Read Cost Explorer totals",
            ],
            [
              <InlineCode key="p">EnableFocusBillingExport</InlineCode>,
              "true",
              "Create a private, encrypted S3 bucket and the daily FOCUS billing export Dilanix reads (deploy in us-east-1; needs billing read)",
            ],
            [
              <InlineCode key="p">EnableMetricsRead</InlineCode>,
              "true",
              "Read CloudWatch metrics",
            ],
            [
              <InlineCode key="p">EnableCloudWatchLogsRead</InlineCode>,
              "true",
              "Query CloudWatch Logs content — switch off if logs may hold data you do not want read",
            ],
            [
              <InlineCode key="p">EnableSecurityRead</InlineCode>,
              "true",
              "Read security posture and findings",
            ],
            [
              <InlineCode key="p">EnableLoadBalancerAccessLogsRead</InlineCode>,
              "true",
              "Read load balancer access logs to see which targets receive traffic",
            ],
            [
              <InlineCode key="p">EnableVpcFlowLogsRead</InlineCode>,
              "true",
              "Read VPC flow logs in S3 to see which resources exchange traffic (addresses and ports, never payloads)",
            ],
            [
              <InlineCode key="p">EnableResolverQueryLogsRead</InlineCode>,
              "true",
              "Read Route 53 Resolver query logs to learn which external hosts your resources call",
            ],
            [
              <InlineCode key="p">LogBuckets</InlineCode>,
              "empty",
              "Restrict log reading to these buckets",
            ],
          ]}
        />
        <Callout tone="note" title="Billing lives in the management account">
          Cost data for an AWS Organization is billed to its management (payer)
          account. Connect that account to see the bill for every member
          account.
        </Callout>
      </DocSection>

      <DocSection title="What Dilanix can and cannot do">
        <CardGrid>
          <div className="border-success/30 bg-success/[0.06] rounded-2xl border p-4 text-sm">
            <p className="text-success font-semibold">Can</p>
            <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-5">
              <li>Describe and list resources</li>
              <li>Read bills, metrics, and the logs you allow</li>
              <li>Read only the objects of its own billing export bucket</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-red-500/30 bg-red-500/[0.06] p-4 text-sm">
            <p className="font-semibold text-red-500">Cannot</p>
            <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-5">
              <li>Create, change, stop, or delete anything</li>
              <li>Read your other S3 buckets or exports</li>
              <li>Be assumed without your External ID</li>
            </ul>
          </div>
        </CardGrid>
      </DocSection>

      <DocSection title="Troubleshooting">
        <Faq
          items={[
            {
              question: "Verification fails",
              answer:
                "Check that the stack finished (CREATE_COMPLETE), that you pasted the External ID exactly, and that you verify in the same connection that showed that External ID.",
            },
            {
              question: "The stack fails on the FOCUS export",
              answer:
                "AWS Data Exports runs only in us-east-1, and the export needs billing read. Deploy the stack in us-east-1, or set EnableFocusBillingExport to false.",
            },
            {
              question: "Some datasets show “No permission”",
              answer:
                "The matching stack parameter is false, or the stack predates the permission. Update the stack with the latest template and the parameter set to true.",
            },
          ]}
        />
      </DocSection>
    </>
  );
}

export function SyncPage() {
  return (
    <>
      <DocHero
        eyebrow="Platform"
        icon="refresh"
        title="Sync and data health"
        description="Dilanix keeps a fresh copy of your cloud in a few datasets. Sync is how they refresh — on a schedule, or right away."
      />

      <GuideEmbed guideKey={SYNC_GUIDE_KEY} />

      <DocSection title="Datasets">
        <DocTable
          head={["Dataset", "Brings", "Needs"]}
          rows={[
            [
              "Inventory Resources",
              "Every resource and its configuration",
              "Inventory Read",
            ],
            [
              "Cost Summary (AWS Cost Explorer)",
              "Daily totals per service",
              "Billing Read",
            ],
            [
              "Cost Usage (AWS FOCUS Data Export)",
              "The detailed bill, line by line",
              "Billing Read + FOCUS export",
            ],
            [
              "Utilization Metrics (AWS CloudWatch)",
              "CPU, memory, network, connections",
              "Metrics Read",
            ],
            [
              "Runtime Interactions",
              "Which resources talk to each other — from configuration, IAM, X-Ray, flow logs, and load balancer logs",
              "Inventory Read",
            ],
          ]}
        />
      </DocSection>

      <DocSection title="The Sync page">
        <p>
          <strong>Sync</strong> in the menu lists every connection with its last
          sync, how many datasets are healthy, and its status. Open a row to
          start a sync, see its history and jobs, or change the schedule.
        </p>
        <Screenshot
          src="/docs/sync.png"
          alt="The Sync page listing connections and their health"
          url="app.dilanix.com/dashboard/sync"
        />
        <DocTable
          head={["Status", "Meaning"]}
          rows={[
            [<Pill key="s">Syncing</Pill>, "A sync is running now"],
            [
              <Pill key="s" tone="success">
                Healthy
              </Pill>,
              "Every dataset synced on schedule",
            ],
            [
              <Pill key="s" tone="warning">
                Needs attention
              </Pill>,
              "A dataset is delayed or partly failing",
            ],
            [
              <Pill key="s" tone="warning">
                Failing
              </Pill>,
              "The last syncs failed — open the connection to see the error",
            ],
            [
              <Pill key="s" tone="neutral">
                Never synced
              </Pill>,
              "No successful sync yet",
            ],
          ]}
        />
        <Callout tone="tip">
          A spinning icon next to Sync in the menu means a sync is running; a
          red dot means something is failing.
        </Callout>
      </DocSection>

      <DocSection title="Schedules">
        <p>
          Each dataset has its own schedule, so billing does not refresh as
          often as inventory needs to. Change a dataset&apos;s interval — or
          switch it off — from the connection&apos;s{" "}
          <strong>Sync &amp; Activity</strong> tab. <strong>Sync now</strong>{" "}
          refreshes every eligible dataset, or the ones you pick.
        </p>
      </DocSection>
    </>
  );
}

export function InfrastructurePage() {
  return (
    <>
      <DocHero
        eyebrow="Platform"
        icon="network"
        title="Infrastructure graph"
        description="A live map of your resources and how they connect — with the evidence for every line, so you always know whether a connection is configured, observed, or only possible."
      />

      <GuideEmbed guideKey={INFRASTRUCTURE_GUIDE_KEY} />

      <DocSection title="Two ways to look">
        <DocTable
          head={["Mode", "Shows"]}
          rows={[
            [
              "Provisioned",
              "How the infrastructure is built: accounts, VPCs, subnets, security groups, and what is attached to what",
            ],
            [
              "Runtime",
              "How services interact: which resources actually call each other, external hosts, and the internet",
            ],
          ]}
        />
        <Screenshot
          src="/docs/infrastructure.png"
          alt="The infrastructure graph"
          url="app.dilanix.com/dashboard/products/infrastructure"
        />
      </DocSection>

      <DocSection title="Evidence behind every line">
        <p>
          Each relationship carries its strongest evidence. Click a line to see
          every piece of it.
        </p>
        <DocTable
          head={["Evidence", "Means"]}
          rows={[
            [
              <Pill key="e" tone="success">
                Observed
              </Pill>,
              "Traffic was seen (flow logs, load balancer logs, traces)",
            ],
            [
              <Pill key="e" tone="success">
                Configured
              </Pill>,
              "The configuration says so (a target group points at a service)",
            ],
            [
              <Pill key="e">User confirmed</Pill>,
              "Someone in your organization confirmed it",
            ],
            [
              <Pill key="e" tone="neutral">
                Permitted
              </Pill>,
              "A rule allows it, but nothing shows it happens",
            ],
            [
              <Pill key="e" tone="neutral">
                Inferred
              </Pill>,
              "A likely connection that is not proven",
            ],
          ]}
        />
      </DocSection>

      <DocSection title="The resource inspector">
        <p>Click a resource to open its inspector:</p>
        <DocTable
          head={["Tab", "Shows"]}
          rows={[
            ["Overview", "What it is, where it runs, its size and status"],
            ["Relationships", "Everything it connects to, with evidence"],
            [
              "Traffic",
              "Whether its traffic can be seen at all, and from which sources",
            ],
            ["External", "External hosts it calls or exchanges traffic with"],
            ["Network", "Its VPC, subnets, and addresses"],
            ["Security", "Security groups and rules"],
            ["Tags", "Its tags"],
            ["Raw data", "Exactly what was collected"],
          ]}
        />
        <Callout tone="important" title="“Not visible” is not “unused”">
          When no traffic source covers a resource (no flow log on its VPC,
          access logs off), the graph says its traffic is{" "}
          <strong>not visible</strong> — it never concludes that nothing uses
          it. The Traffic tab tells you what to enable.
        </Callout>
      </DocSection>
    </>
  );
}

export function NotificationsPage() {
  return (
    <>
      <DocHero
        eyebrow="Platform"
        icon="bell"
        title="Notifications"
        description="Set up where alerts and reports go once, then pick those destinations wherever Dilanix sends something."
      />

      <DocSection title="Channels and destinations">
        <p>
          A <strong>channel</strong> is how Dilanix reaches a service (for
          example your Slack bot). A <strong>destination</strong> is a place on
          that channel (a Slack channel, an email address). Reports and alerts
          are sent to destinations.
        </p>
        <DocTable
          head={["Channel", "You provide", "Destination"]}
          rows={[
            [
              "Slack",
              "A Bot User OAuth token (xoxb-…), or nothing for Incoming Webhook mode",
              "A channel ID or name — or an Incoming Webhook URL",
            ],
            ["Telegram", "A bot token", "A chat or group ID"],
            [
              "Email",
              "Optional sender name and reply-to address",
              "An email address",
            ],
            [
              "Webhook",
              "Timeout and an HTTPS requirement",
              "A URL, with an optional signing secret to verify requests come from Dilanix",
            ],
          ]}
        />
      </DocSection>

      <DocSection title="What gets sent">
        <DocTable
          head={["Event", "When"]}
          rows={[
            [
              "Report generated",
              "A Cost report was generated — with the file attached",
            ],
            [
              "High-priority recommendation",
              "A new high-priority recommendation is ready to fix",
            ],
            [
              "Budget threshold reached",
              "A budget crosses an alert threshold (sent by email to the budget's recipients)",
            ],
          ]}
        />
        <Callout tone="tip">
          Every delivery is kept in Notifications, so you can download a past
          report again.
        </Callout>
      </DocSection>
    </>
  );
}

export function OrganizationPage() {
  return (
    <>
      <DocHero
        eyebrow="Platform"
        icon="users"
        title="Organization, roles, and API keys"
        description="Everyone in an organization sees the same data; their role decides what they can change."
      />

      <DocSection title="Roles">
        <DocTable
          head={["Role", "Can see", "Can change"]}
          rows={[
            [
              "Owner",
              "Everything",
              "Everything — connections, budgets, reports, recommendations, members",
            ],
            ["Admin", "Everything", "Everything (today the same as Owner)"],
            ["Member", "Everything", "Nothing — read only"],
            ["Viewer", "Everything", "Nothing — read only"],
          ]}
        />
        <SubHeading>Examples</SubHeading>
        <DocTable
          head={["Action", "Owner / Admin", "Member / Viewer"]}
          rows={[
            ["View cost, recommendations, the graph", "Yes", "Yes"],
            ["Open a How to fix guide", "Yes", "Yes"],
            ["Create budgets, allocations, reports", "Yes", "No"],
            ["Re-check, answer, dismiss recommendations", "Yes", "No"],
            ["Connect cloud accounts, create telemetry tokens", "Yes", "No"],
          ]}
        />
      </DocSection>

      <DocSection title="API keys">
        <p>
          <strong>API Keys</strong> (when enabled for your organization) creates
          keys for programmatic access, with full access or restricted to the
          products you pick. A key is shown <strong>once</strong> when you
          create it — store it in your secret manager. Keys are stored only as a
          hash, can expire, and can be revoked at any time.
        </p>
        <Callout tone="note" title="Which credential should I use?">
          To send telemetry, use an <strong>ingestion token</strong> from the
          telemetry source. Endpoints that accept API keys — read access to
          Recommendations, Cost, and Inventory — are planned; see the{" "}
          <DocLink
            href="/dashboard/docs/api"
            className="text-accent underline-offset-2 hover:underline"
          >
            API overview
          </DocLink>
          .
        </Callout>
      </DocSection>

      <DocSection title="Keep going">
        <CardGrid>
          <LinkCard
            href="/dashboard/docs/api"
            icon="code"
            title="API overview"
            description="Credentials, API keys, and conventions."
          />
          <LinkCard
            href="/dashboard/docs/telemetry-sources"
            icon="radio"
            title="Ingestion tokens"
            description="Scoped credentials for sending telemetry."
          />
        </CardGrid>
      </DocSection>
    </>
  );
}
