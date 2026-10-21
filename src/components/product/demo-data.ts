/**
 * Sample data for the marketing site's product previews. The shapes are the
 * ones Core returns, so the demo renders through the dashboard's own
 * components. Every name and ID is invented.
 */
import type {
  CoreGraphEdge,
  CoreGraphNode,
  CoreGraphNodeDetail,
  CoreRecommendationAIReview,
  CoreRecommendationFixGuide,
} from "@/lib/core/api";

export const DEMO_WORKSPACE = "Dilanix";
export const DEMO_USER = {
  firstName: "Alex",
  lastName: "Morgan",
  email: "alex@example.com",
};

export const DEMO_PRODUCTS = [
  {
    slug: "cost",
    name: "Cost",
    description:
      "Track cloud spend across providers, set budgets, detect cost anomalies, and surface savings recommendations.",
  },
  {
    slug: "infrastructure",
    name: "Infrastructure",
    description:
      "Inventory resources across providers and give teams operational visibility into infrastructure state.",
  },
] as const;

export function formatUsd(value: number) {
  const digits = Number.isInteger(value) ? 0 : 2;
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

// ── Recommendations ─────────────────────────────────────────────────────────

export interface DemoRecommendation {
  id: string;
  rank: number;
  title: string;
  summary: string;
  priority: "high" | "medium" | "low";
  family: string;
  category: string;
  resourceKind: string;
  resourceName: string;
  resourceDetail: string;
  savingUsd: number;
  savingLabel: string;
  state: { tone: "success" | "warning"; label: string };
  /** For the hero reel: the verified CLI command of the preferred fix. */
  command: string;
  verifiedAgainst: string;
  status: "ready" | "input";
}

export const demoRecommendations: DemoRecommendation[] = [
  {
    id: "rec-rds",
    rank: 1,
    title: "Rightsize RDS instance orders-db (db.r6g.2xlarge)",
    summary:
      "orders-db peaked at 31% CPU and 42% of its memory over 14 days. One size down keeps headroom above every observed peak and halves the instance price.",
    priority: "high",
    family: "rds",
    category: "database",
    resourceKind: "RDS db instance",
    resourceName: "orders-db",
    resourceDetail: "db.r6g.2xlarge | eu-west-1",
    savingUsd: 1840,
    savingLabel: "1,840 USD",
    state: { tone: "success", label: "Ready to fix" },
    command:
      "aws rds modify-db-instance --db-instance-identifier orders-db --db-instance-class db.r6g.xlarge --no-apply-immediately --region eu-west-1",
    verifiedAgainst: "rds ModifyDBInstance",
    status: "ready",
  },
  {
    id: "rec-schedule",
    rank: 2,
    title: "Stop the staging environment outside business hours",
    summary:
      "14 staging resources run around the clock while their traffic stops every evening and weekend. Confirm the hours staging is used to finish the review.",
    priority: "high",
    family: "ecs",
    category: "container",
    resourceKind: "Environment",
    resourceName: "staging",
    resourceDetail: "14 resources | eu-west-1",
    savingUsd: 1120,
    savingLabel: "1,120 USD",
    state: { tone: "warning", label: "Needs your input" },
    command: "",
    verifiedAgainst: "",
    status: "input",
  },
  {
    id: "rec-sp",
    rank: 3,
    title: "Compute Savings Plan — 1 year, No Upfront",
    summary:
      "EC2 and Fargate ran at least 3.10 USD/hour of steady usage for 14 days, after the cleanup above. A plan at that commitment covers it at a lower rate.",
    priority: "medium",
    family: "ec2",
    category: "compute",
    resourceKind: "Savings Plan",
    resourceName: "Compute · 3.10 USD/hour",
    resourceDetail: "EC2 and Fargate",
    savingUsd: 612.4,
    savingLabel: "612.40 USD",
    state: { tone: "success", label: "Ready to fix" },
    command: "",
    verifiedAgainst: "",
    status: "ready",
  },
  {
    id: "rec-gp3",
    rank: 4,
    title: "Migrate EBS volume api-data-vol from gp2 to gp3",
    summary:
      "gp3 gives this 2 TiB volume the same baseline performance for 20% less, and the change runs online without detaching it.",
    priority: "medium",
    family: "ec2",
    category: "storage",
    resourceKind: "EC2 volume",
    resourceName: "api-data-vol",
    resourceDetail: "vol-0c2d4e6f8a1b3c5d7 | eu-west-1",
    savingUsd: 45.06,
    savingLabel: "45.06 USD",
    state: { tone: "success", label: "Ready to fix" },
    command:
      "aws ec2 modify-volume --volume-id vol-0c2d4e6f8a1b3c5d7 --volume-type gp3 --region eu-west-1",
    verifiedAgainst: "ec2 ModifyVolume",
    status: "ready",
  },
  {
    id: "rec-nat",
    rank: 5,
    title: "Idle NAT gateway dev-natgw-1 (nat-0a1b2c3d4e5f6a7b8)",
    summary:
      "This development NAT gateway carried no traffic and no active connections for 14 days while its hourly charge kept running.",
    priority: "medium",
    family: "ec2",
    category: "network",
    resourceKind: "EC2 nat gateway",
    resourceName: "dev-natgw-1",
    resourceDetail: "nat-0a1b2c3d4e5f6a7b8 | eu-west-1",
    savingUsd: 35.04,
    savingLabel: "35.04 USD",
    state: { tone: "success", label: "Ready to fix" },
    command:
      "aws ec2 delete-nat-gateway --nat-gateway-id nat-0a1b2c3d4e5f6a7b8 --region eu-west-1",
    verifiedAgainst: "ec2 DeleteNatGateway",
    status: "ready",
  },
];

export const demoReview: CoreRecommendationAIReview = {
  outcome: "completed",
  summary:
    "orders-db is sized for roughly twice its real load. Moving one size down within the same Graviton family keeps the engine, storage and Multi-AZ setup unchanged.",
  reasoning: null,
  detected_issue:
    "orders-db peaked at 31% CPU and 42% of its memory over the last 14 days.",
  evidence_summary: [
    "CPU averaged 12% and peaked at 31% over 14 days (CloudWatch, 5-minute data).",
    "Freeable memory never fell below 58% of the instance's 64 GiB.",
    "db.r6g.xlarge costs 0.52 USD/hour less in eu-west-1 (AWS Price List).",
    "The instance is reached by orders-api and billing-worker only (VPC flow logs).",
  ],
  confidence: "high",
  evidence_quality: null,
  risk_level: "low",
  risk_notes: [
    "The class change restarts the instance; Multi-AZ shortens it to a failover.",
  ],
  open_questions: [],
  questions: [],
  options: [
    {
      title: "Downsize to db.r6g.xlarge",
      description:
        "Change the instance class during the next maintenance window. Storage, engine version and parameter group stay as they are.",
      pros: ["Halves the instance price", "Same engine and storage"],
      cons: ["A brief failover while the class changes"],
      risk_level: "low",
      is_preferred: true,
      action_type: "resize",
      expected_monthly_savings: "1840.00",
      prerequisites: [
        "Confirm no batch job is scheduled in the maintenance window.",
        "Check that the latest automated snapshot completed.",
      ],
      validation_steps: [
        "CPU stays below 70% for a week after the change.",
        "Application error rates stay flat.",
      ],
      rollback: ["Modify the instance back to db.r6g.2xlarge."],
    },
    {
      title: "Keep the current size",
      description:
        "Leave orders-db as it is if a seasonal peak is expected soon.",
      pros: ["No change"],
      cons: ["Keeps paying for unused capacity"],
      risk_level: "low",
      is_preferred: false,
      action_type: "keep",
      expected_monthly_savings: null,
      prerequisites: [],
      validation_steps: [],
      rollback: [],
    },
  ],
  facts: [],
  analysis_rounds: 1,
  critic_rounds: 1,
  tool_calls: 4,
  model: "demo",
  reviewed_at: "2026-10-16T08:00:00Z",
};

export const demoFixGuide: CoreRecommendationFixGuide = {
  status: "ready",
  provider: "aws",
  provider_label: "AWS",
  option_index: 0,
  option_title: "Downsize to db.r6g.xlarge",
  action_type: "resize",
  summary:
    "Change orders-db to db.r6g.xlarge in its next maintenance window. Nothing else about the database changes.",
  resource: {
    provider: "aws",
    resource_type: "rds:db",
    external_id: "orders-db",
    name: "orders-db",
    region: "eu-west-1",
    arn: null,
  },
  prerequisites: [
    "An automated snapshot of orders-db from the last 24 hours.",
    "Permission to call rds:ModifyDBInstance.",
  ],
  warnings: [],
  methods: [
    {
      method: "console",
      available: true,
      unavailable_reason: null,
      scope: "customer_resource",
      note: null,
      links: [
        {
          label: "Open orders-db in the AWS Console",
          url: "https://eu-west-1.console.aws.amazon.com/rds/home?region=eu-west-1#database:id=orders-db",
          kind: "console",
        },
      ],
      steps: [
        {
          title: "Open orders-db and choose Modify",
          detail: "Amazon RDS → Databases → orders-db → Modify.",
          code: null,
        },
        {
          title: "Set the instance class to db.r6g.xlarge",
          detail: "Under Instance configuration, pick db.r6g.xlarge.",
          code: null,
        },
        {
          title: "Apply during the next maintenance window",
          detail:
            "Choose Continue, then “Apply during the next scheduled maintenance window”.",
          code: null,
        },
      ],
      validation: [
        {
          title: "The instance shows db.r6g.xlarge after the window",
          detail: null,
          code: null,
        },
      ],
      rollback: [
        {
          title: "Modify the instance back to db.r6g.2xlarge",
          detail: null,
          code: null,
        },
      ],
    },
    {
      method: "terraform",
      available: true,
      unavailable_reason: null,
      scope: "generic_example",
      note: "Dilanix never sees your Terraform code or state — match this to your own resource.",
      links: [
        {
          label: "aws_db_instance",
          url: "https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/db_instance",
          kind: "terraform_registry",
        },
      ],
      steps: [
        {
          title: "Change the instance class",
          detail: null,
          code: {
            language: "hcl",
            content:
              'resource "aws_db_instance" "orders" {\n  # ...\n  instance_class    = "db.r6g.xlarge"\n  apply_immediately = false\n}',
            placeholders: [],
          },
        },
        {
          title: "Plan and apply",
          detail: null,
          code: {
            language: "bash",
            content: "terraform plan\nterraform apply",
            placeholders: [],
          },
        },
      ],
      validation: [],
      rollback: [],
    },
    {
      method: "cli",
      available: true,
      unavailable_reason: null,
      scope: "customer_resource",
      note: null,
      links: [
        {
          label: "modify-db-instance",
          url: "https://docs.aws.amazon.com/cli/latest/reference/rds/modify-db-instance.html",
          kind: "cli_reference",
        },
      ],
      steps: [
        {
          title: "Schedule the class change",
          detail: null,
          code: {
            language: "bash",
            content:
              "aws rds modify-db-instance --db-instance-identifier orders-db --db-instance-class db.r6g.xlarge --no-apply-immediately --region eu-west-1",
            placeholders: [],
          },
        },
      ],
      validation: [
        {
          title: "Check the pending change",
          detail: null,
          code: {
            language: "bash",
            content:
              "aws rds describe-db-instances --db-instance-identifier orders-db --query 'DBInstances[0].PendingModifiedValues' --region eu-west-1",
            placeholders: [],
          },
        },
      ],
      rollback: [],
    },
  ],
  documentation: [],
  omitted: [],
  model: null,
  generated_at: null,
};

// ── Cost ────────────────────────────────────────────────────────────────────

/** Daily effective cost for the first 17 days of the month. */
export const demoDailySpend = [
  2610, 2580, 2655, 2702, 2541, 2398, 2380, 2620, 2588, 2602, 2574, 2566, 2490,
  2338, 2310, 2541, 2524,
];

export const demoCostDrivers = {
  increases: [
    { service: "Amazon ElastiCache", from: 2810, to: 3210 },
    { service: "Amazon CloudWatch", from: 640, to: 905 },
  ],
  decreases: [
    { service: "Amazon EC2", from: 20890, to: 18420 },
    { service: "NAT Gateway", from: 5022, to: 4150 },
  ],
};

// ── Sync ────────────────────────────────────────────────────────────────────

export const demoDatasets = [
  {
    key: "inventory.resources",
    name: "Inventory Resources",
    lastSuccessful: "12m ago",
    schedule: "Every 1 h",
  },
  {
    key: "billing.cost_summary",
    name: "Cost Summary (AWS Cost Explorer)",
    lastSuccessful: "2h ago",
    schedule: "Every 6 h",
  },
  {
    key: "billing.cost_usage",
    name: "Cost Usage (AWS FOCUS Data Export)",
    lastSuccessful: "2h ago",
    schedule: "Every 6 h",
  },
  {
    key: "metrics.utilization",
    name: "Utilization Metrics (AWS CloudWatch)",
    lastSuccessful: "38m ago",
    schedule: "Every 1 h",
  },
  {
    key: "graph.interactions",
    name: "Runtime Interactions (config, IAM, X-Ray, Flow Logs, AI)",
    lastSuccessful: "18m ago",
    schedule: "Every 1 h",
  },
];

// ── Infrastructure graph ────────────────────────────────────────────────────

function node(
  id: string,
  name: string,
  resource_type: string,
  category: string,
  provider_resource_type: string,
): CoreGraphNode {
  return {
    id,
    target_id: "demo-target",
    provider: "aws",
    provider_resource_type,
    resource_type,
    category,
    external_id: name,
    name,
    region: "eu-west-1",
    status: "available",
    lifecycle_status: "active",
  };
}

export const demoGraphNodes: Record<string, CoreGraphNode> = {
  vpc: node("vpc", "prod-vpc", "network.vpc", "network", "ec2:vpc"),
  alb: node(
    "alb",
    "web-alb",
    "network.load_balancer",
    "network",
    "elasticloadbalancing:loadbalancer",
  ),
  api: node(
    "api",
    "orders-api",
    "container.service",
    "container",
    "ecs:service",
  ),
  worker: node(
    "worker",
    "billing-worker",
    "container.service",
    "container",
    "ecs:service",
  ),
  db: node("db", "orders-db", "database.instance", "database", "rds:db"),
  cache: node(
    "cache",
    "sessions",
    "cache.cluster",
    "cache",
    "elasticache:cluster",
  ),
  queue: node(
    "queue",
    "orders-queue",
    "messaging.queue",
    "messaging",
    "sqs:queue",
  ),
  bucket: node("bucket", "invoices", "storage.bucket", "storage", "s3:bucket"),
  fn: node(
    "fn",
    "notify-customer",
    "compute.function",
    "compute",
    "lambda:function",
  ),
};

export type DemoEvidence =
  "configured" | "permitted" | "observed" | "inferred" | "user_confirmed";

export const demoGraphEdges: {
  id: string;
  source: string;
  target: string;
  type: string;
  kinds: DemoEvidence[];
  label: string;
}[] = [
  {
    id: "e-internet-alb",
    source: "internet",
    target: "alb",
    type: "exposes",
    kinds: ["configured"],
    label: "HTTPS 443",
  },
  {
    id: "e-alb-api",
    source: "alb",
    target: "api",
    type: "targets",
    kinds: ["observed", "configured"],
    label: "TCP 8080",
  },
  {
    id: "e-api-db",
    source: "api",
    target: "db",
    type: "connects_to",
    kinds: ["observed"],
    label: "connects · TCP 5432",
  },
  {
    id: "e-api-cache",
    source: "api",
    target: "cache",
    type: "connects_to",
    kinds: ["observed"],
    label: "connects · TCP 6379",
  },
  {
    id: "e-api-queue",
    source: "api",
    target: "queue",
    type: "writes_to",
    kinds: ["permitted"],
    label: "writes",
  },
  {
    id: "e-worker-queue",
    source: "worker",
    target: "queue",
    type: "reads_from",
    kinds: ["permitted"],
    label: "reads",
  },
  {
    id: "e-worker-db",
    source: "worker",
    target: "db",
    type: "connects_to",
    kinds: ["observed"],
    label: "connects · TCP 5432",
  },
  {
    id: "e-worker-bucket",
    source: "worker",
    target: "bucket",
    type: "writes_to",
    kinds: ["permitted"],
    label: "writes",
  },
  {
    id: "e-queue-fn",
    source: "queue",
    target: "fn",
    type: "triggers",
    kinds: ["configured"],
    label: "triggers",
  },
];

const PRODUCERS: Record<DemoEvidence, string> = {
  configured: "aws.config",
  permitted: "aws.iam",
  observed: "aws.vpc_flow_logs",
  inferred: "ai.inference",
  user_confirmed: "user",
};

/** The inspector's view of one resource: its detail and its neighbors. */
export function demoResourceDetail(id: string): {
  detail: CoreGraphNodeDetail;
  edges: CoreGraphEdge[];
  peers: CoreGraphNode[];
} | null {
  const resource = demoGraphNodes[id];
  if (!resource || id === "vpc") return null;
  const related = demoGraphEdges.filter(
    (edge) =>
      edge.source !== "internet" && (edge.source === id || edge.target === id),
  );
  const edges: CoreGraphEdge[] = related.map((edge) => ({
    id: edge.id,
    source_resource_id: edge.source,
    target_resource_id: edge.target,
    relationship_type: edge.type,
    first_seen_at: "2026-09-02T10:00:00Z",
    last_seen_at: "2026-10-17T07:40:00Z",
    evidence: edge.kinds.map((kind) => ({
      kind,
      producer: PRODUCERS[kind],
      attributes: {},
      confidence: null,
      endpoint_identity: "exact" as const,
      first_observed_at: "2026-09-02T10:00:00Z",
      last_observed_at: "2026-10-17T07:40:00Z",
    })),
  }));
  const peerIds = new Set(
    related.map((edge) => (edge.source === id ? edge.target : edge.source)),
  );
  return {
    detail: {
      node: resource,
      connection_id: "demo-connection",
      provider_resource_key: resource.external_id,
      zone: "eu-west-1a",
      tags: { environment: "production", team: "commerce" },
      extra: {},
      capacity: {},
      first_seen_at: "2026-09-02T10:00:00Z",
      last_seen_at: "2026-10-17T07:40:00Z",
    },
    edges,
    peers: [...peerIds].map((peer) => demoGraphNodes[peer]).filter(Boolean),
  };
}
