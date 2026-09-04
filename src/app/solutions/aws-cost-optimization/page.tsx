import type { Metadata } from "next";
import { getFeaturedProduct, getProductDashboardSnapshot } from "@/lib/data/products";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { FeaturedProductCard } from "@/components/product/featured-product-card";

export const metadata: Metadata = {
  title: "AWS Cost Optimization Platform — FOCUS 1.2 & Cost Explorer",
  description:
    "Dilanix CostOps is an AWS cost optimization platform built on FOCUS 1.2 billing data and AWS Cost Explorer, giving engineering and finance teams a single, trustworthy cost overview across accounts and services.",
  alternates: { canonical: "/solutions/aws-cost-optimization" },
};

const pillars = [
  {
    title: "One cost overview, two trusted sources",
    body: "Every number is backed by either an AWS Cost Explorer or FOCUS 1.2 read, and the overview always shows which dataset actually answered — no silent blending of incompatible totals.",
  },
  {
    title: "Resource-level FOCUS 1.2 detail",
    body: "FOCUS Data Export rows expose service, resource, region, SKU, and charge category, with billed, effective, list, and contracted cost all present per row so switching metric never re-fetches.",
  },
  {
    title: "Per-connection, per-account visibility",
    body: "Cost data is scoped to each connected AWS account, so multi-account and multicloud organizations can see spend and savings opportunities account by account, not just as one blended total.",
  },
];

const faqs = [
  {
    question: "What makes this different from just using AWS Cost Explorer?",
    answer:
      "Cost Explorer gives you rolled-up totals per service. Dilanix CostOps reads Cost Explorer and FOCUS 1.2 Data Export side by side, so you get both the fast top-line view and resource-level detail (SKU, region, charge category) needed for real AWS cost optimization work — in one place.",
  },
  {
    question: "What is FOCUS cost data and why does it matter?",
    answer:
      "FOCUS (FinOps Open Cost & Usage Specification) is a vendor-neutral, standardized billing export. FOCUS 1.2 rows carry billed, effective, list, and contracted cost per resource, which is what lets you find AWS cost optimization opportunities — like idle reservations or oversized instances — that a rolled-up Cost Explorer total hides.",
  },
  {
    question: "Does this work for multi-account or multicloud AWS setups?",
    answer:
      "Yes. Each AWS connection is read independently, so cost and savings recommendations stay scoped per account rather than getting averaged away across an entire organization.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

export default async function AwsCostOptimizationPage() {
  const product = await getFeaturedProduct();
  const snapshot = product
    ? await getProductDashboardSnapshot(product.slug)
    : undefined;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <section className="py-20 sm:py-28">
        <Container className="max-w-3xl text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
            AWS Cost Optimization, Backed by FOCUS 1.2 Cost Data
          </h1>
          <p className="text-muted-foreground mt-6 text-lg leading-relaxed sm:text-xl">
            Dilanix CostOps unifies AWS Cost Explorer and FOCUS 1.2 Data
            Export billing into one cost overview, so you always know where
            cloud spend goes and where AWS cost optimization opportunities
            are hiding — per account, per service, per resource.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button href="/contact" variant="primary">
              Talk to us about AWS cost optimization
            </Button>
            <Button href="/products" variant="secondary">
              See the product
            </Button>
          </div>
        </Container>
      </section>

      {product && snapshot ? (
        <section className="border-foreground/5 border-t py-20 sm:py-24">
          <Container>
            <FeaturedProductCard
              product={product}
              snapshot={snapshot}
              headingLevel="h2"
            />
          </Container>
        </section>
      ) : null}

      <section className="border-foreground/5 border-t py-20 sm:py-28">
        <Container>
          <SectionHeading
            eyebrow="How it works"
            title="Cost optimization needs both the summary and the detail"
            description="Rolled-up totals tell you spend is growing. Resource-level FOCUS data tells you why — and what to do about it."
          />
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {pillars.map((pillar) => (
              <div
                key={pillar.title}
                className="border-border-soft bg-card-strong/78 rounded-2xl border p-6"
              >
                <h3 className="text-foreground text-lg font-semibold">
                  {pillar.title}
                </h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  {pillar.body}
                </p>
              </div>
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

      <section className="border-foreground/5 border-t py-20 sm:py-28">
        <Container className="flex flex-col items-center gap-6 text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            See your AWS cost breakdown, unified.
          </h2>
          <Button href="/contact" variant="primary">
            Talk to us
          </Button>
        </Container>
      </section>
    </>
  );
}
