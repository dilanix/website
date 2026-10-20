import type { TourDefinition } from "../types";

export const RECOMMENDATIONS_TOUR_KEY = "workspace.recommendations";

/** Anchors the Recommendations inbox sets (`data-tour={recommendationsAnchors.x}`).
 *  Per-row anchors sit on every row and the tour shows the first; anchors in
 *  an open row's details sit on what only a ready-to-fix (or a needs-input)
 *  recommendation shows, so they point at the row the tour opened. */
export const recommendationsAnchors = {
  stats: "recommendations.stats",
  statusFilter: "recommendations.status-filter",
  productFilter: "recommendations.product-filter",
  analyzerFilter: "recommendations.analyzer-filter",
  showCovered: "recommendations.show-covered",
  search: "recommendations.search",
  rank: "recommendations.rank",
  tags: "recommendations.tags",
  resource: "recommendations.resource",
  savings: "recommendations.savings",
  state: "recommendations.state",
  rowActions: "recommendations.row-actions",
  whyThisMatters: "recommendations.why-this-matters",
  recommendedAction: "recommendations.recommended-action",
  evidence: "recommendations.evidence",
  alternatives: "recommendations.alternatives",
  rawEvidence: "recommendations.raw-evidence",
  beforeYouContinue: "recommendations.before-you-continue",
  howToFix: "recommendations.how-to-fix",
  questions: "recommendations.questions",
  questionAnswers: "recommendations.question-answers",
  continueAnalysis: "recommendations.continue-analysis",
  footer: "recommendations.footer",
} as const;

/** Actions the inbox registers for this tour (`usePageTour`). */
export const recommendationsActions = {
  openReady: "open-ready-recommendation",
  openNeedsInput: "open-recommendation-questions",
} as const;

const anchors = recommendationsAnchors;
const actions = recommendationsActions;

export const recommendationsTour: TourDefinition = {
  key: RECOMMENDATIONS_TOUR_KEY,
  version: 1,
  title: "Recommendations",
  description: "How savings are found, checked and ranked, and how to act.",
  section: "workspace",
  route: "/dashboard/recommendations",
  steps: [
    {
      id: "welcome",
      title: "Welcome to Recommendations",
      body: "Every saving Dilanix finds across your cloud connections lands in this inbox, ranked by what to act on first. This tour shows how a recommendation is found and checked, how to read one, and how to act on it.",
    },
    {
      id: "how-found",
      title: "How Dilanix finds them",
      body: "Every 6 hours — and right after a connection's first successful sync — Dilanix's analyzers look through your inventory, metrics, prices and infrastructure graph: idle or oversized instances, databases and caches, unattached volumes, idle load balancers, whole environments that could run on a schedule, Savings Plans and Reserved Instances worth buying, and more.\nLow usage is only a lead. Before anything shows here, Dilanix reviews what the resource is for and recommends only a change that is safe.",
    },
    {
      id: "stats",
      target: anchors.stats,
      placement: "bottom",
      title: "At a glance",
      body: "Recommendations — how many match your filters.\nNeed your input — active ones waiting for an answer only you can give.\nReady to fix — active ones fully checked, with a recommended action and a step-by-step guide.",
    },
    {
      id: "status-filter",
      target: anchors.statusFilter,
      placement: "bottom",
      title: "Filter by status",
      body: "All, or one status:\nActive — still applies.\nDismissed — you set it aside. It stays dismissed even if it's found again, until you restore it.\nResolved — Dilanix's latest complete check no longer finds it, e.g. after you fixed it. If it comes back, it's active again.\nYour choice is remembered in this browser.",
    },
    {
      id: "product-filter",
      target: anchors.productFilter,
      placement: "bottom",
      title: "Product",
      body: "Which Dilanix product found it. Today recommendations come from Cost; other products add theirs to this same inbox.",
    },
    {
      id: "analyzer-filter",
      target: anchors.analyzerFilter,
      placement: "bottom",
      title: "Analyzer",
      body: "The check that found it — e.g. cost.aws.ebs.unattached for unattached EBS volumes. Pick one to see a single kind of recommendation.",
    },
    {
      id: "show-covered",
      target: anchors.showCovered,
      placement: "bottom",
      title: "Show covered",
      body: "Dilanix lists one recommendation per resource. When several change the same resources — say, scheduling a whole environment and stopping one instance in it — the best one is listed and the others are covered by it. Tick this to see those too.",
    },
    {
      id: "search",
      target: anchors.search,
      placement: "bottom",
      title: "Search",
      body: "Finds recommendations by title or summary among those loaded.",
    },
    {
      id: "rank",
      target: anchors.rank,
      placement: "right",
      title: "Ranked by what to act on first",
      body: "#1 is the best to act on: its monthly saving × how confident Dilanix is ÷ how much effort the change takes (stopping something is less work than a migration). Ready-to-fix recommendations always come before those needing your input. The top three are highlighted.",
    },
    {
      id: "tags",
      target: anchors.tags,
      placement: "bottom",
      title: "Tags",
      body: "The product that found it, its priority (set by the analyzer, mostly by how much it saves — shown once it's ready to fix), its status, and covered by #N when a better-ranked recommendation already changes the same resources.",
    },
    {
      id: "resource",
      target: anchors.resource,
      placement: "bottom",
      title: "What it changes",
      body: "The resource — its kind, name, ID and region. Some recommendations cover more: a whole environment, with how many resources it groups, or an AWS account, for a Savings Plan or Reserved Instance purchase.",
    },
    {
      id: "savings",
      target: anchors.savings,
      placement: "bottom",
      title: "Potential savings",
      body: "Up to how much a month it saves, priced from AWS's own price list. Shown only once a recommendation is ready to fix — Dilanix never puts a figure on a change it doesn't recommend. Estimates may change after a re-check.",
    },
    {
      id: "state",
      target: anchors.state,
      placement: "left",
      title: "Where it stands",
      body: "Ready to fix — checked, with a recommended action.\nNeeds your input — Dilanix needs an answer only you know, e.g. what the resource is for.\nNo change advised — the check found nothing safe to change.\nRe-checking — a check is running now.\nDismissed or Resolved — see the status filter.",
    },
    {
      id: "row-actions",
      target: anchors.rowActions,
      placement: "left",
      title: "Details and more actions",
      body: "Details opens the full recommendation. ⋮ offers:\nRe-check — runs Dilanix's review again on the latest metrics, graph and your answers.\nDismiss — sets it aside.\nRestore — brings a dismissed one back.\nA change to one recommendation can reorder the others.",
    },
    {
      id: "why-this-matters",
      target: anchors.whyThisMatters,
      prepare: actions.openReady,
      placement: "right",
      title: "Why this matters",
      body: "What Dilanix found and why it costs you, with how confident it is. Confirmed by you means the decision rests on answers you gave.",
    },
    {
      id: "recommended-action",
      target: anchors.recommendedAction,
      prepare: actions.openReady,
      placement: "right",
      title: "Recommended action",
      body: "The one change Dilanix recommends, with its risk and monthly saving, how to check it worked (Validation), how to undo it (Rollback), and its pros and cons.",
    },
    {
      id: "evidence",
      target: anchors.evidence,
      prepare: actions.openReady,
      placement: "right",
      title: "Evidence",
      body: "The facts the recommendation rests on: usage over the last 14 days, prices, configuration and what depends on the resource.",
    },
    {
      id: "alternatives",
      target: anchors.alternatives,
      prepare: actions.openReady,
      placement: "top",
      title: "Alternatives",
      body: "Other ways to save on the same resource, each with its own risk, saving and How to fix guide.",
    },
    {
      id: "raw-evidence",
      target: anchors.rawEvidence,
      prepare: actions.openReady,
      placement: "top",
      title: "Raw evidence",
      body: "The underlying data exactly as the analyzer recorded it, with when each fact was observed. Below it: the analyzer that found it, and when it was first detected and last seen.",
    },
    {
      id: "before-you-continue",
      target: anchors.beforeYouContinue,
      prepare: actions.openReady,
      placement: "left",
      title: "Before you continue",
      body: "What to check or prepare before applying the change — tick items off as you go (ticks aren't saved) — and the risks to keep in mind.",
    },
    {
      id: "how-to-fix",
      target: anchors.howToFix,
      prepare: actions.openReady,
      placement: "top",
      title: "How to fix",
      body: "Step-by-step instructions for this exact resource in the AWS Console, with Terraform or with the AWS CLI, checked against AWS's own documentation. Dilanix never changes anything in your account itself. Terraform is a generic example, since Dilanix doesn't see your code.",
    },
    {
      id: "questions",
      target: anchors.questions,
      prepare: actions.openNeedsInput,
      placement: "left",
      title: "Answer what only you know",
      body: "Low usage doesn't tell whether something is safe to change — a quiet instance may be your VPN. Dilanix asks only questions that change the decision, like what the resource is for or when it must be available.",
    },
    {
      id: "question-answers",
      target: anchors.questionAnswers,
      prepare: actions.openNeedsInput,
      placement: "left",
      title: "Suggested answers",
      body: "Where tags or evidence point to an answer, it's preselected and Suggested says why — check it before you confirm. Each answer shows what it leads to and how much it saves. Follow-up questions appear only when an answer needs them.",
    },
    {
      id: "continue-analysis",
      target: anchors.continueAnalysis,
      prepare: actions.openNeedsInput,
      placement: "top",
      title: "Continue analysis",
      body: "Dilanix finishes its review with your answers — you can watch it here — and the recommendation becomes ready to fix, or no change is advised. Answers are kept for 180 days (I'm not sure: 7) and reused, so you're never asked twice. An answer about an environment applies to all of its resources.",
    },
    {
      id: "footer",
      target: anchors.footer,
      placement: "top",
      title: "The rest of the list",
      body: "The top 10 show first. Show all lists every one loaded; Load more fetches the next page.",
    },
    {
      id: "finish",
      title: "You're all set",
      body: "New recommendations appear here as Dilanix's analyzers find them, and the ranking updates as they change. Replay this tour anytime from Help & Support.",
    },
  ],
};
