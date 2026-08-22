import { env } from "@/env";
import type { BlogPost } from "@/types";

const fallbackPosts: BlogPost[] = [
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
