import type { Metadata } from "next";
import {
  ArrowRight,
  BadgeCheck,
  Database,
  Gauge,
  HardDrive,
  Layers,
  Moon,
  Network,
  PiggyBank,
  Receipt,
  Scale,
  Search,
  ShieldCheck,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { getSiteSettings } from "@/lib/data/site";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/common/reveal";
import { GuidedDashboardDemo } from "@/components/product/guided-dashboard-demo";

export const metadata: Metadata = {
  title: "AWS Cost Optimization — Ranked, Verified Savings",
  description:
    "Dilanix finds AWS savings with over 30 checks, reviews each one for safety, ranks them by saving, confidence, and effort, and gives verified Console, Terraform, and CLI steps — all from your real bill and a read-only role.",
  alternates: { canonical: "/solutions/aws-cost-optimization" },
};

const flow: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Search,
    title: "Detect",
    text: "Every hour, each resource is checked against its bill, its CloudWatch metrics, current AWS prices, and what depends on it.",
  },
  {
    icon: ShieldCheck,
    title: "Review",
    text: "Each finding is reviewed before you see it: what the resource is for, whether it is really unused, and what could break.",
  },
  {
    icon: Scale,
    title: "Rank",
    text: "Monthly saving × confidence ÷ effort. The best come first, and each resource appears in only one recommendation.",
  },
  {
    icon: Wrench,
    title: "Fix",
    text: "Console, Terraform, and CLI steps for your resource. You run them; the recommendation resolves itself when the change lands.",
  },
];

const checks: { icon: LucideIcon; title: string; items: string[] }[] = [
  {
    icon: Gauge,
    title: "Rightsizing",
    items: [
      "EC2 instances and Auto Scaling groups",
      "RDS instances and storage",
      "ElastiCache nodes",
      "ECS Fargate tasks and ECS capacity on EC2",
      "Burstable instances paying for extra CPU credits",
      "EBS volumes with more IOPS or throughput than they use",
    ],
  },
  {
    icon: Moon,
    title: "Idle and unused",
    items: [
      "Idle EC2, RDS, ElastiCache, DynamoDB, and Fargate",
      "Load balancers and NAT gateways without traffic",
      "Instances stopped for weeks but still paying for storage",
      "Unattached EBS volumes and unused Elastic IPs",
      "Environments that can sleep outside working hours",
    ],
  },
  {
    icon: HardDrive,
    title: "Storage",
    items: [
      "EBS gp2 to gp3",
      "S3 Intelligent-Tiering",
      "Old S3 object versions and incomplete uploads",
      "ECR image lifecycle",
    ],
  },
  {
    icon: Network,
    title: "Networking",
    items: [
      "NAT gateway consolidation",
      "Free S3 and DynamoDB gateway endpoints instead of NAT traffic",
    ],
  },
  {
    icon: Layers,
    title: "Modernization",
    items: [
      "Previous-generation EC2 instances",
      "Graviton for Lambda and Fargate",
      "Fargate Spot",
      "DynamoDB capacity mode and Lambda provisioned concurrency",
      "RDS Multi-AZ standbys you may not need",
    ],
  },
  {
    icon: PiggyBank,
    title: "Commitments",
    items: [
      "Compute Savings Plans over EC2 and Fargate",
      "RDS and ElastiCache reservations",
      "Sized only on steady usage left after the cleanup",
      "Credit-aware — tells you when credits already cover the bill",
    ],
  },
];

const foundation: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Receipt,
    title: "Your real bill",
    text: "The FOCUS 1.2 Data Export line by line, plus Cost Explorer totals — effective cost after discounts, credits, and commitments.",
  },
  {
    icon: Gauge,
    title: "How busy it really is",
    text: "CloudWatch CPU, memory, network, and connections over at least 14 days before anything is called idle or oversized.",
  },
  {
    icon: Database,
    title: "Current AWS prices",
    text: "Savings come from the AWS Price List for your region and your bill — never estimated by AI.",
  },
  {
    icon: Network,
    title: "What depends on it",
    text: "The infrastructure graph shows who talks to a resource, so a “unused” database that something still reads is never flagged.",
  },
];

const faqs = [
  {
    question: "Is Dilanix only for AWS?",
    answer:
      "No. Dilanix is a cross-platform cost and infrastructure platform, built provider-neutral from the start. AWS is the first provider it connects to today; more cloud providers are coming.",
  },
  {
    question:
      "How is this different from AWS Cost Explorer or Trusted Advisor?",
    answer:
      "They tell you something may be oversized or idle. Dilanix checks the finding against your bill, metrics, current prices, and what depends on the resource, removes the ones that are unsafe, ranks what is left by saving, confidence, and effort, and gives you verified steps to apply each one.",
  },
  {
    question: "Does Dilanix change anything in my AWS account?",
    answer:
      "No. The IAM role it uses can only describe, list, and read. Every How to fix guide is instructions for you to follow — Dilanix never runs them.",
  },
  {
    question: "Where do the savings numbers come from?",
    answer:
      "From current AWS prices for your region and your own billing data. AI is used to review findings and write the explanation, never to produce a dollar amount.",
  },
  {
    question: "Are the CLI commands and Terraform safe to copy?",
    answer:
      "Every CLI command is validated against AWS's own API definitions, every Terraform resource against the provider documentation, and every resource ID must exist in your data. Anything that fails is removed and listed. Terraform is always a generic example, because Dilanix never sees your code or state.",
  },
  {
    question: "What is FOCUS cost data and why does it matter?",
    answer:
      "FOCUS (FinOps Open Cost & Usage Specification) is a standard billing export. Its line-by-line rows carry billed, effective, list, and contracted cost per resource — the detail needed to know what a single resource really costs.",
  },
  {
    question: "Does it work with several AWS accounts?",
    answer:
      "Yes. One connection can hold several accounts, and an AWS Organization's management account brings the bill for every member account.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
};

export default async function AwsCostOptimizationPage() {
  const settings = await getSiteSettings();

  return (
    <div className="home-atmosphere relative isolate overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <section className="relative py-20 sm:py-28">
        <div className="from-accent/10 pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] via-transparent to-transparent" />
        <Container className="relative max-w-3xl text-center">
          <span className="border-accent/20 bg-card-strong/72 text-accent inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[10px] font-semibold tracking-[0.14em] uppercase">
            <span className="bg-accent size-1.5 rounded-full shadow-[0_0_9px_var(--accent)]" />
            Solution · AWS cost optimization
          </span>
          <h1 className="mt-6 text-4xl font-semibold tracking-[-0.045em] text-balance sm:text-6xl">
            AWS savings you can trust — and apply.
          </h1>
          <p className="text-muted-foreground mt-6 text-lg leading-relaxed text-balance sm:text-xl">
            Over 30 checks across compute, databases, storage, networking, and
            commitments. Each finding is reviewed for safety, ranked, and comes
            with verified steps for your exact resource.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              href={settings.calendlyUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="primary"
              className="group"
            >
              Book a demo
              <ArrowRight
                size={15}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Button>
            <Button href="/products#cost" variant="secondary">
              The Cost product
            </Button>
          </div>
          <div className="text-muted-foreground mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[11px]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-success" /> Read-only IAM
              role
            </span>
            <span className="flex items-center gap-1.5">
              <Receipt size={13} className="text-accent" /> Savings from your
              real bill
            </span>
            <span className="flex items-center gap-1.5">
              <BadgeCheck size={13} className="text-success" /> Nothing runs
              automatically
            </span>
          </div>
          <p className="text-muted-foreground mt-4 text-xs">
            Dilanix is cross-platform — AWS is the first provider it connects
            to, with more cloud providers coming.
          </p>
        </Container>
      </section>

      <section className="pb-20">
        <Container className="max-w-7xl">
          <Reveal>
            <GuidedDashboardDemo
              views={["recommendations", "cost"]}
              label="Cost optimization preview"
            />
          </Reveal>
        </Container>
      </section>

      <section className="border-foreground/5 border-t py-20 sm:py-28">
        <Container className="max-w-7xl">
          <SectionHeading
            eyebrow="How it works"
            title="From finding to fix, without the guesswork."
            description="A recommendation only reaches you after it has been checked, reviewed, and ranked."
          />
          <ol className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {flow.map((step, index) => (
              <Reveal key={step.title} delayMs={index * 70}>
                <li className="border-border-soft bg-card-strong/68 flex h-full flex-col rounded-[1.4rem] border p-6 shadow-[0_18px_48px_var(--shadow-card)] backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <span className="border-accent/20 bg-accent/8 text-accent flex size-11 items-center justify-center rounded-xl border">
                      <step.icon size={18} />
                    </span>
                    <span className="text-muted-foreground/55 font-mono text-[10px]">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold tracking-[-0.02em]">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground mt-2 text-sm leading-6">
                    {step.text}
                  </p>
                </li>
              </Reveal>
            ))}
          </ol>
        </Container>
      </section>

      <section className="border-foreground/5 border-t py-20 sm:py-28">
        <Container className="max-w-7xl">
          <SectionHeading
            eyebrow="What it checks"
            title="Over 30 AWS checks, grouped by where the money goes."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {checks.map((group, index) => (
              <Reveal key={group.title} delayMs={(index % 3) * 70}>
                <article className="border-border-soft bg-card-strong/64 h-full rounded-[1.4rem] border p-6 shadow-[0_18px_48px_var(--shadow-card)] backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <span className="border-success/20 bg-success/8 text-success flex size-10 items-center justify-center rounded-xl border">
                      <group.icon size={17} />
                    </span>
                    <h3 className="text-base font-semibold tracking-[-0.02em]">
                      {group.title}
                    </h3>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {group.items.map((item) => (
                      <li
                        key={item}
                        className="text-muted-foreground flex gap-2.5 text-sm leading-5"
                      >
                        <span className="bg-success mt-2 size-1.5 shrink-0 rounded-full" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-foreground/5 border-t py-20 sm:py-28">
        <Container className="max-w-7xl">
          <SectionHeading
            eyebrow="Built on real data"
            title="Four sources behind every recommendation."
            description="Rolled-up totals tell you spend is growing. These tell you why — and whether a change is safe."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {foundation.map((item) => (
              <article
                key={item.title}
                className="border-border-soft bg-card-strong/64 h-full rounded-[1.4rem] border p-6"
              >
                <span className="border-accent/20 bg-accent/8 text-accent flex size-10 items-center justify-center rounded-xl border">
                  <item.icon size={17} />
                </span>
                <h3 className="mt-5 text-base font-semibold tracking-[-0.02em]">
                  {item.title}
                </h3>
                <p className="text-muted-foreground mt-2 text-sm leading-6">
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-foreground/5 border-t py-20 sm:py-28">
        <Container className="max-w-3xl">
          <SectionHeading
            eyebrow="FAQ"
            title="AWS cost optimization, answered"
            align="left"
            className="mb-12"
          />
          <div className="flex flex-col divide-y divide-[var(--border-soft)]">
            {faqs.map((faq) => (
              <div key={faq.question} className="py-6 first:pt-0">
                <h3 className="text-foreground text-base font-semibold">
                  {faq.question}
                </h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-foreground/10 bg-card-strong border-t py-20">
        <Container className="flex flex-col items-center gap-4 text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Find out what your AWS really needs to cost.
          </h2>
          <p className="text-muted-foreground max-w-xl text-sm">
            Give Dilanix read-only access, let the first sync finish, and walk
            through your ranked savings with us.
          </p>
          <Button
            href={settings.calendlyUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="primary"
            className="mt-2"
          >
            Book a demo
          </Button>
        </Container>
      </section>
    </div>
  );
}
