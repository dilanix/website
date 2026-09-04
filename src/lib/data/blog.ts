import { env } from "@/env";
import type { BlogPost } from "@/types";

const fallbackPosts: BlogPost[] = [
  {
    slug: "aws-cost-explorer-vs-focus-cost-data",
    title: "AWS Cost Explorer vs. FOCUS Cost Data: Which Should Drive Your Cost Optimization?",
    excerpt:
      "Cost Explorer and FOCUS 1.2 Data Export answer different questions. Here's how to tell which one you're actually looking at, and why AWS cost optimization work needs both.",
    category: "AWS Cost Optimization",
    readTime: "6 min read",
    author: {
      name: "Dilanix Engineering",
      role: "Cost Platform Team",
    },
    publishedAt: "Sep 02, 2026",
    status: "published",
    content: `Most teams start AWS cost optimization with the AWS Cost Explorer console — and for a first pass, that's the right call. But once spend is high enough to justify a dedicated optimization effort, Cost Explorer's rolled-up totals stop being enough, and that's where FOCUS 1.2 Data Export becomes the more useful source.

Here's the distinction that matters, and how to use both without confusing yourself about which number you're looking at.

---

### What Cost Explorer actually gives you

AWS Cost Explorer aggregates billing data into service-level and account-level totals with a handful of grouping dimensions (service, linked account, usage type, tag). It's fast, it's built into the console, and it's the right tool for "is spend trending up or down this month."

What it doesn't give you: consistent, resource-level detail across billed vs. effective vs. list vs. contracted cost, in one row, that you can filter by SKU or charge category. For that, you need a FOCUS export.

### What FOCUS 1.2 gives you that Cost Explorer doesn't

FOCUS (the FinOps Open Cost & Usage Specification) is a standardized billing export format maintained by the FinOps Foundation. AWS's FOCUS 1.2 Data Export produces resource-level rows that carry:

- **Service, resource, and region** — not just a service category, but which specific resource generated the charge.
- **SKU and charge category** — usage, purchase commitment, tax, credit, etc., broken out instead of netted into one number.
- **Four cost metrics per row** — billed cost, effective cost, list cost, and contracted cost, so you can switch the lens (what you were actually charged vs. what a Savings Plan or Reserved Instance made it effectively cost) without re-running a query.

That last point is the one that actually changes AWS cost optimization decisions. A resource that looks expensive at list cost might already be well-optimized once a commitment discount is applied at effective cost — and you can't tell the difference from a Cost Explorer total alone.

---

### A practical rule of thumb

Use Cost Explorer to notice that something changed. Use FOCUS data to find out what, specifically, changed and whether it's worth acting on.

If your organization is running AWS cost optimization purely off Cost Explorer dashboards, the fastest upgrade isn't a new tool — it's turning on a FOCUS 1.2 Data Export and asking the same questions at resource granularity. Dilanix CostOps reads both sources side by side for exactly this reason: Cost Explorer for the fast read, FOCUS for the one that holds up under scrutiny.`,
  },
  {
    slug: "aws-cost-optimization-checklist-focus-data",
    title: "A Practical AWS Cost Optimization Checklist Built Around FOCUS Data",
    excerpt:
      "A concrete, resource-level checklist for finding AWS cost optimization opportunities using FOCUS 1.2 billed, effective, list, and contracted cost fields.",
    category: "AWS Cost Optimization",
    readTime: "7 min read",
    author: {
      name: "Dilanix Infrastructure",
      role: "Cloud Architecture Team",
    },
    publishedAt: "Aug 26, 2026",
    status: "published",
    content: `Generic AWS cost optimization advice ("right-size your instances," "delete unused volumes") is true but unhelpful without a way to find the specific resources it applies to. FOCUS 1.2 Data Export gives you the fields to make each of these checks concrete instead of anecdotal.

---

### 1. Compare list cost to effective cost, per resource

If a resource's list cost and effective cost are nearly identical, it isn't covered by a Savings Plan or Reserved Instance — and depending on how consistently it runs, that's either fine (spiky, unpredictable usage) or a missed commitment-discount opportunity (steady, predictable usage). Sort by the gap between the two to find the highest-value candidates first.

### 2. Group by SKU and charge category, not just service

"EC2" as a line item hides the difference between on-demand compute, data transfer, and EBS volumes attached to those instances. FOCUS's charge-category field lets you separate usage charges from purchase commitments from credits, so a spend spike shows up as what it actually is instead of an undifferentiated jump in "EC2."

### 3. Find resource-level cost with no matching usage signal

Storage volumes, load balancers, and idle read replicas all show up as ordinary line items in a rolled-up total. At the resource level, a volume with steady billed cost and no corresponding compute activity is the pattern to flag — that's usually leftover infrastructure from a terminated instance or a finished experiment, not a workload that needs optimizing so much as deleting.

### 4. Track contracted cost against actual commitment utilization

Contracted cost tells you what you agreed to pay under a Savings Plan or Reserved Instance commitment. If effective cost across covered resources sits meaningfully below what the commitment was sized for, you're paying for capacity you aren't using — a different problem than resource-level waste, and one that only shows up when you can see contracted cost next to the resources it's meant to cover.

### 5. Re-run the same checks per account, not just org-wide

In a multi-account AWS setup, an org-wide FOCUS rollup can hide a badly optimized account behind several well-optimized ones. Scoping each of the checks above to one connected account at a time is what actually surfaces the account that needs attention.

---

None of this requires guesswork — it's a direct read of fields FOCUS 1.2 already exports. The gap is almost always tooling: whether your cost platform actually surfaces billed, effective, list, and contracted cost per resource, or just gives you one blended number per service. That gap is exactly what Dilanix CostOps's FOCUS cost usage view is built to close.`,
  },
  {
    slug: "reducing-llm-token-spend-in-production",
    title: "How to Reduce OpenAI & Anthropic Token Spend by 40% in Production",
    excerpt:
      "A deep dive into semantic caching, prompt compression, structured outputs, and multi-tier model routing that cut our production AI inference bills almost in half.",
    category: "AI & LLM Ops",
    readTime: "6 min read",
    author: {
      name: "Dilanix Engineering",
      role: "AI Systems Team",
    },
    publishedAt: "Aug 14, 2026",
    status: "published",
    content: `As modern software products integrate large language models (LLMs) deeper into critical user paths, API inference costs often become the fastest-growing line item on the infrastructure bill.

Many engineering teams wake up to unexpected spikes: batch summarization loops, un-cached system prompts, or over-reliance on flagship frontier models for simple classification tasks.

Here are the four high-impact architectural patterns we implemented to systematically cut LLM spend by 40% while preserving (and in some cases improving) end-to-end latency and output quality.

---

### 1. Multi-Tier Semantic Model Routing

Not every user query requires a 100B+ frontier model like GPT-4o or Claude 3.5 Sonnet. A significant portion of production tasks—such as intent extraction, schema mapping, sentiment analysis, or routing—can be executed with equal accuracy by smaller, high-throughput models like GPT-4o-mini or Claude 3.5 Haiku at a fraction of the cost.

By routing requests based on dynamic complexity scoring, we shifted **62% of raw inference volume** to tier-1 models, slashing blended input/output costs instantly.

---

### 2. Aggressive Prompt Normalization and Semantic Caching

Prompt prefix caching is one of the highest leverage features in modern LLM APIs, but it only works if your system prompts and context prefixes are strictly deterministic:

- **Anchor Common System Instructions**: Place fixed instructions, tool definitions, and few-shot examples at the exact beginning of the payload.
- **Isolate Dynamic Context**: Append user query parameters and volatile timestamps at the very end to maximize cache hit rates.
- **Local Embedding-Based Cache**: For repetitive queries, store deterministic prompt-hash / response pairs in Redis with a 24-hour TTL.

Provider cache hits increased from 18% to **84%**, reducing input token costs for cached requests by up to 50–75%.

---

### 3. Structured Outputs Over Verbose Conversational Formatting

Unstructured chat completions often waste hundreds of completion tokens on polite conversational filler. By strictly enforcing JSON Schema or tool-calling modes:
- Output token consumption dropped by an average of **31%**.
- Parsing failures and retry loops were eliminated completely.
- Downstream microservices process typed responses 4x faster.

---

### 4. Continuous Token Anomaly Radar

Real-time telemetry and structured threshold alarms catch infinite retry loops and prompt regressions within 60 seconds of deployment.`,
  },
  {
    slug: "detecting-ghost-cloud-infrastructure",
    title: "Detecting Ghost Cloud Infrastructure: From Orphaned EBS to Idle RDS Replicas",
    excerpt:
      "A practical guide to finding and eliminating forgotten cloud resources that silently inflate your AWS, GCP, and Azure invoices every month.",
    category: "Cloud Architecture",
    readTime: "5 min read",
    author: {
      name: "Dilanix Infrastructure",
      role: "Cloud Architecture Team",
    },
    publishedAt: "Aug 02, 2026",
    status: "published",
    content: `In fast-moving engineering organizations, resources get spun up for feature branches, benchmark experiments, staging environments, and load testing. All too often, when the pull request is merged or the experiment concludes, the compute instances are terminated—but the associated storage volumes, snapshots, load balancers, and static IPs keep billing forever.

We call this **Ghost Infrastructure**.

---

### The 4 Most Common Sources of Cloud Waste

1. **Unattached EBS Volumes & Stale Snapshots**: When an EC2 instance is terminated without DeleteOnTermination enabled, the attached volume persists in available state. A single 500GB gp3 volume costs ~$40/month. Multiply that across 30 developer staging cycles, and you are burning over $1,200/month on zero utility.
2. **Idle RDS Read Replicas**: Read replicas created during high-traffic marketing events or seasonal peaks frequently stay provisioned at multi-AZ production tiers with 0% CPU and zero active connections for months.
3. **Idle Elastic Load Balancers (ALB/NLB)**: ALBs carry a flat hourly charge (~$0.0225/hr plus LCU hours) regardless of whether they receive any traffic. Orphaned staging ALBs often account for 5–10% of total networking spend.
4. **Overprovisioned Container Clusters (EKS/ECS)**: Request/limit misconfigurations lead to Kubernetes nodes running at 15–20% average CPU utilization while horizontal pod autoscalers cannot pack pods efficiently.

---

### Automated Auditing with Infrastructure-as-Code

Continuous non-invasive heuristics across all connected cloud regions allow automated verification and clean remediation branches.`,
  },
  {
    slug: "mastering-unit-economics-in-ai-saas",
    title: "Mastering Unit Economics in AI SaaS: Cost per Tenant, Query, and Active User",
    excerpt:
      "Why gross margins in AI-enabled SaaS require real-time cost attribution down to the customer tenant and API endpoint level.",
    category: "Architecture",
    readTime: "7 min read",
    author: {
      name: "Alex Vane",
      role: "Lead Systems Architect",
    },
    publishedAt: "Jul 21, 2026",
    status: "published",
    content: `Traditional SaaS enjoyed 80%+ gross margins because incremental compute per user was negligible. With AI SaaS, every customer interaction triggers expensive GPU or foundation model calls. If your top 5% of power users consume 60% of your inference budget, standard flat-rate pricing can quickly turn high-value accounts unprofitable.

---

### The Three Unit Metrics Every Modern SaaS Must Track

1. **Cost per Active Tenant (CPAT)**: Total infrastructure and model spend attributed to each customer workspace.
2. **Cost per Completed Task / Workflow**: Direct cost to fulfill a discrete user outcome (e.g. generating an automated report or analyzing a document).
3. **Margin per Feature Category**: Understanding which product capabilities are profitable vs. which act as margin drains.

---

### End-to-End Attribution

By tagging API requests at the gateway level with tenant and feature identifiers, telemetry correlates raw cloud bills with model usage logs, giving your product and finance teams complete visibility into true gross margins.`,
  },
  {
    slug: "multi-cloud-finops-in-2026",
    title: "Multi-Cloud Strategy in 2026: Balancing AWS, GCP, and Specialized AI Clusters",
    excerpt:
      "Strategies for unifying telemetry when your primary workload runs in AWS, data analytics in GCP BigQuery, and frontier inference on specialized AI clouds.",
    category: "Cloud Architecture",
    readTime: "6 min read",
    author: {
      name: "Dilanix Research",
      role: "Systems Strategy",
    },
    publishedAt: "Jul 08, 2026",
    status: "published",
    content: `The modern tech stack is rarely single-cloud. High-growth teams leverage AWS for core microservices, GCP for Vertex AI and BigQuery, and direct OpenAI/Anthropic APIs for LLM generation.

Managing disparate billing consoles, currency differences, and delayed exports creates blind spots that make forecasting difficult.

Unified telemetry provides a single source of truth across all cloud providers and AI vendors, enabling centralized budget guardrails and reliable operations.`,
  },
];

type ApiBlogPostDto = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content?: string;
  category: string;
  read_time: string;
  author_name: string;
  author_role: string | null;
  status: "draft" | "published" | "archived";
  published_at: string | null;
  cover_image_url: string | null;
  tags: string[];
};

type ApiBlogListDto = {
  items: ApiBlogPostDto[];
  total: number;
  categories: string[];
};

function mapDtoToBlogPost(dto: ApiBlogPostDto): BlogPost {
  let formattedDate = "Aug 2026";
  if (dto.published_at) {
    try {
      formattedDate = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }).format(new Date(dto.published_at));
    } catch {}
  }

  return {
    slug: dto.slug,
    title: dto.title,
    excerpt: dto.excerpt,
    category: dto.category,
    readTime: dto.read_time,
    author: {
      name: dto.author_name,
      role: dto.author_role || "Engineering",
    },
    publishedAt: formattedDate,
    status: dto.status === "published" ? "published" : "draft",
    content: dto.content,
  };
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/v1/blog?limit=50`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = (await res.json()) as ApiBlogListDto;
      if (data.items && data.items.length > 0) {
        return data.items.map(mapDtoToBlogPost);
      }
    }
  } catch {
    // Fallback to local
  }
  return fallbackPosts.filter((post) => post.status === "published");
}

export async function getBlogPostBySlug(
  slug: string,
): Promise<BlogPost | undefined> {
  try {
    const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/v1/blog/${slug}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = (await res.json()) as ApiBlogPostDto;
      return mapDtoToBlogPost(data);
    }
  } catch {
    // Fallback to local
  }
  return fallbackPosts.find(
    (post) => post.slug === slug && post.status === "published",
  );
}
