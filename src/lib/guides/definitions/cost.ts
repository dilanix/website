import type { GuideDefinition } from "../types";

export const COST_GUIDE_KEY = "guide.cost";

export const costGuide: GuideDefinition = {
  key: COST_GUIDE_KEY,
  version: 1,
  title: "How Cost works",
  description:
    "Every Cost page: spend, Explorer, budgets, allocations, anomalies, reports.",
  product: "cost",
  tours: [
    "cost.overview",
    "cost.explorer",
    "cost.budgets",
    "cost.allocations",
    "cost.anomalies",
    "cost.saved-views",
    "cost.reports",
  ],
  scenes: [
    {
      id: "intro",
      title: "Your cloud bill, explained",
      caption:
        "Cost turns your AWS bills into spend you can read, question and control. Overview summarizes it, Explorer answers your own questions, Budgets set limits, Allocations split it between teams, Anomalies catch spikes, Saved Views keep queries and Reports deliver it.",
      durationMs: 12000,
    },
    {
      id: "data",
      title: "Where the numbers come from",
      caption:
        "With Billing Read, Dilanix syncs two datasets from the account that pays the bill: Cost Explorer's daily summary and the stack's line-by-line FOCUS export. A number uses FOCUS only when it's complete for everything in view — otherwise Cost Explorer — never a mix. Recent months are re-read on every sync, as AWS corrects charges late.",
      durationMs: 14000,
    },
    {
      id: "scope",
      title: "Whose spend",
      caption:
        "Show every connection, one connection, or one of its accounts — e.g. just production. Only connections with billing access are listed, and the choice carries over between Overview, Explorer and Allocations.",
      durationMs: 10000,
    },
    {
      id: "measures",
      title: "Which cost",
      caption:
        "Effective cost, the default, is what you really pay: after discounts, with Savings Plans and Reserved Instances spread over the time they cover. Billed cost is what the invoice shows, List cost the public on-demand price, Contracted cost your negotiated rate.",
      durationMs: 13000,
    },
    {
      id: "period-totals",
      title: "Period, totals and pacing",
      caption:
        "Month to date by default; 1 day, 3 days, a week, 30 days or a custom range. Every total is per currency — never added together — and compared with the period just before, of equal length. Budget pacing projects spend to the period's end.",
      durationMs: 12000,
    },
    {
      id: "views",
      title: "Four ways to look",
      caption:
        "Summary is the overview. Services and Resources list detailed charges for one connection — pick it in the scope first. Trends compares spend over time with the period before.",
      durationMs: 10000,
    },
    {
      id: "attention",
      title: "Needs attention",
      caption:
        "Budgets that are over or forecast to overrun, and open anomalies, with links straight to them. When nothing needs you, it's a single all-clear line.",
      durationMs: 9000,
    },
    {
      id: "breakdown",
      title: "Break it down, drill in",
      caption:
        "Split spend by provider, billing account, service, region, resource or any tag. Each row has this period and the last, the change and a status — New, Up, Down, Flat or Gone. Click a row to drill in, e.g. a service, then its regions.",
      durationMs: 13000,
    },
    {
      id: "drivers-trend",
      title: "Why it changed, where it's heading",
      caption:
        "Drivers lists the services that grew or shrank the most. The trajectory shows cumulative spend, projected to the period's end from the daily rate so far, with detected anomalies marked on the line.",
      durationMs: 12000,
    },
    {
      id: "net-cost",
      title: "From usage to net cost",
      caption:
        "Gross usage, tax, credits and other adjustments add up to net cost — what you're actually billed — with what discounts saved against list prices. By charge type explains a low total: usually a credit offsetting usage.",
      durationMs: 12000,
    },
    {
      id: "explorer-build",
      title: "Explorer: ask your own question",
      caption:
        "Pick dates, a cost measure and daily, weekly or monthly rows. Group by one or more dimensions or a tag key — untagged spend shows as Unassigned — and add filters: is, is any of, is none of. Run query; your last query waits next time.",
      durationMs: 14000,
    },
    {
      id: "explorer-results",
      title: "Reading the results",
      caption:
        "Totals per currency and the number of rows, the charge types behind them, then the rows — Summary with a bar for each one's share, or Detailed with every dimension in its own column.",
      durationMs: 11000,
    },
    {
      id: "saved-views",
      title: "Saved views",
      caption:
        "Save a grouping, granularity and filters you check often. Keep it to yourself or share it with your organization — only you can edit it. In Explorer, pick it under Saved view and Run view on any dates.",
      durationMs: 12000,
    },
    {
      id: "budget-create",
      title: "Budgets: set a limit",
      caption:
        "An amount in your billing currency — spend in other currencies is pointed out, never counted. Monthly, quarterly and annual budgets follow the calendar in UTC and restart on their own; a custom range has fixed dates. Conditions narrow what it counts, e.g. Tag environment is production.",
      durationMs: 14000,
    },
    {
      id: "budget-alerts",
      title: "Alerts and status",
      caption:
        "Thresholds are percentages of the amount: at 50, 80 and 100 an email goes to the budget's recipients, once per period — add 120 to hear about an overrun. Dilanix checks every hour. Each budget reads On track, Forecast to overrun or Over budget; pause it to stop alerts.",
      durationMs: 14000,
    },
    {
      id: "allocations",
      title: "Allocations: who spent what",
      caption:
        "Rules give spend to a team, cost center or business unit. The first enabled rule, by priority, whose conditions match a charge claims it — an empty one claims what's left. Unmatched spend stays Unallocated. A new rule re-splits past periods too.",
      durationMs: 14000,
    },
    {
      id: "anomaly-detect",
      title: "Anomalies: spikes caught early",
      caption:
        "Every hour, Dilanix compares each connected account's spend yesterday with its average over the 7 days before, per currency. At least 50% — and 1 currency unit — above it is an anomaly: low up to 99%, medium from 100%, high from 300%. Drops are never flagged.",
      durationMs: 13000,
    },
    {
      id: "anomaly-triage",
      title: "Work through them",
      caption:
        "Open means nobody has looked yet. Acknowledge says someone is on it; Resolve closes it once explained or fixed, and Reopen brings it back. Details shows what grew. Open ones also show on the Overview.",
      durationMs: 11000,
    },
    {
      id: "reports",
      title: "Reports, delivered",
      caption:
        "A CSV or PDF of a cost period — last 7 or 30 days, last month, month to date, last quarter or year — on demand or daily, weekly or monthly in UTC, or on a cron. It goes to email, Slack, Telegram or a webhook set up in Notifications. Generate & send runs one now.",
      durationMs: 14000,
    },
    {
      id: "savings",
      title: "From cost to savings",
      caption:
        "Recommendations ranks what you can change to pay less, checked to be safe. Budget alerts email their recipients; generated reports and new high-priority recommendations go to your notification destinations.",
      durationMs: 11000,
    },
    {
      id: "outro",
      title: "Every page has a tour",
      caption:
        "Overview, Explorer, Budgets, Allocations, Anomalies, Saved Views and Reports each have a step-by-step tour of their real controls — start one from the end of this video, or anytime from Help & Support.",
      durationMs: 10000,
    },
  ],
};
