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
} from "@/components/docs/doc-blocks";
import { ScoreCalculator } from "@/components/docs/widgets";

export function CostPage() {
  return (
    <>
      <DocHero
        eyebrow="Products"
        icon="dollar"
        title="Cost"
        description="See what your cloud costs, why it changes, where it goes, and stay ahead of it with budgets, anomalies, and reports."
      >
        <DocLink
          href="/dashboard/products/cost/docs"
          className="bg-accent text-accent-foreground inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium shadow-[0_10px_30px_color-mix(in_oklab,var(--accent)_30%,transparent)] transition-opacity hover:opacity-90"
        >
          Open the full Cost guide →
        </DocLink>
      </DocHero>

      <DocSection title="The screens">
        <DocTable
          head={["Screen", "Answers"]}
          rows={[
            [
              "Overview",
              "How much did we spend, against the previous period? Summary, Services, Resources, and Trends views, with drill-down",
            ],
            [
              "Explorer",
              "Any spend question — grouped, filtered, and measured your way",
            ],
            ["Saved Views", "The Explorer questions you ask again and again"],
            [
              "Budgets",
              "Are we on track? Limits with forecasts and alert thresholds",
            ],
            ["Allocations", "Which team or cost center spent what"],
            ["Anomalies", "Did spend jump unexpectedly yesterday?"],
            ["Reports", "Cost summaries delivered on a schedule as CSV or PDF"],
          ]}
        />
        <Screenshot
          src="/docs/cost-overview.png"
          alt="The Cost overview"
          url="app.dilanix.com/dashboard/products/cost"
        />
      </DocSection>

      <DocSection title="Numbers you can trust">
        <DocTable
          head={["Rule", "Why"]}
          rows={[
            [
              "Effective cost by default",
              "What you really pay after discounts, credits, Savings Plans, and Reserved Instances",
            ],
            [
              "Currencies never added",
              "USD and EUR spend are shown as two totals, never converted silently",
            ],
            [
              "The source is always named",
              "Cost Explorer totals or the detailed FOCUS export — never mixed in one number",
            ],
            [
              "Unattributed spend stays visible",
              "Tax, support, and shared charges keep their own row",
            ],
          ]}
        />
      </DocSection>

      <DocSection title="Keep reading">
        <CardGrid>
          <LinkCard
            href="/dashboard/products/cost/docs"
            icon="dollar"
            title="The full Cost guide"
            description="Every screen, field, and status explained in detail."
          />
          <LinkCard
            href="/dashboard/docs/recommendations"
            icon="lightbulb"
            title="Recommendations"
            description="Turn what Cost sees into safe savings."
          />
        </CardGrid>
      </DocSection>
    </>
  );
}

export function RecommendationsPage() {
  return (
    <>
      <DocHero
        eyebrow="Products"
        icon="lightbulb"
        title="Recommendations"
        description="Dilanix finds what you can change to pay less, checks that the change is safe, ranks it against everything else, and gives you step-by-step instructions."
      />

      <DocSection title="From finding to fix">
        <Steps>
          <Step title="Detected">
            <p>
              Analyzers check every resource each hour against its bill,
              metrics, current prices, and how it connects to other resources.
              Savings are always calculated from real prices and your real bill
              — never guessed by AI.
            </p>
          </Step>
          <Step title="Reviewed">
            <p>
              Each finding is reviewed before you see it: what is the resource
              for, is it really unused, what depends on it, what could go wrong.
              Unsafe or useless findings are never shown.
            </p>
          </Step>
          <Step title="Your input, when it matters">
            <p>
              Some things only you know — “is this a VPN gateway?”, “does this
              environment run at night?”. Dilanix suggests the likely answer;
              you confirm with one click, and it is remembered.
            </p>
          </Step>
          <Step title="Ranked">
            <p>
              Every recommendation gets a score; the best come first and each
              resource appears in only one recommendation.
            </p>
          </Step>
          <Step title="Fixed — by you">
            <p>
              <strong>How to fix</strong> gives you Console, Terraform, and CLI
              instructions. When the condition is gone, the recommendation
              resolves by itself.
            </p>
          </Step>
        </Steps>
      </DocSection>

      <DocSection title="Try the ranking">
        <p>
          The score is{" "}
          <InlineCode>monthly saving × confidence ÷ effort</InlineCode>. Move
          the controls to see how Dilanix orders its recommendations.
        </p>
        <ScoreCalculator />
        <Callout tone="tip" title="One recommendation per resource">
          When an environment-wide recommendation and a single-resource one are
          about the same resource, the better one keeps it and the other is
          marked <strong>covered by #N</strong>. Turn on{" "}
          <strong>Show covered</strong> to see them.
        </Callout>
      </DocSection>

      <DocSection title="Reading a recommendation">
        <Screenshot
          src="/docs/recommendations.png"
          alt="The recommendations list with an open recommendation"
          url="app.dilanix.com/dashboard/recommendations"
        />
        <DocTable
          head={["Status", "Means"]}
          rows={[
            [
              <Pill key="s" tone="success">
                Ready to fix
              </Pill>,
              "Reviewed and safe — open How to fix",
            ],
            [
              <Pill key="s" tone="warning">
                Needs your input
              </Pill>,
              "Answer a question so the review can finish",
            ],
            [<Pill key="s">Re-checking</Pill>, "A fresh review is running"],
            [
              <Pill key="s" tone="neutral">
                No change advised
              </Pill>,
              "The review found it should stay as it is",
            ],
          ]}
        />
      </DocSection>

      <DocSection title="How to fix">
        <DocTable
          head={["Tab", "You get"]}
          rows={[
            [
              "AWS Console",
              "Click-by-click steps and a link that opens the right resource",
            ],
            [
              "Terraform",
              "A generic example of the change — Dilanix never sees your Terraform code or state",
            ],
            [
              "AWS CLI",
              "Copyable commands with your real resource IDs and region",
            ],
          ]}
        />
        <Callout tone="note" title="Verified before you see it">
          Every CLI command is checked against AWS&apos;s own API definitions,
          every Terraform resource against the provider documentation, and every
          resource ID must come from your data. Anything that fails is removed
          and listed.
        </Callout>
        <Callout tone="danger" title="Nothing runs automatically">
          Dilanix never runs these steps. Work through the{" "}
          <strong>Before you continue</strong> checklist first.
        </Callout>
      </DocSection>

      <DocSection title="Savings Plans and reservations">
        <p>
          Commitments are sized only on usage that ran steadily for 14 days on
          resources at least 30 days old, that is not already covered, and that
          no other recommendation will clean up. The offer is always 1 year, No
          Upfront.
        </p>
        <Callout tone="warning">
          A commitment is billed for its whole term. If credits pay most of your
          bill, Dilanix says so — the saving starts when the credits stop.
        </Callout>
      </DocSection>

      <DocSection title="Questions">
        <Faq
          items={[
            {
              question: "Why is a resource I expected missing?",
              answer:
                "It may be in use, too new (most checks need 14 days of metrics), already covered by a better recommendation, or waiting for your answer.",
            },
            {
              question: "Who can act on recommendations?",
              answer:
                "Everyone can read them and open How to fix. Owners and Admins can re-check, answer questions, dismiss, and restore.",
            },
            {
              question: "Will I be notified?",
              answer:
                "Yes — new high-priority recommendations that are ready to fix are sent to your notification destinations.",
            },
          ]}
        />
      </DocSection>
    </>
  );
}
