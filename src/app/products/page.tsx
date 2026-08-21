import type { Metadata } from "next";
import Link from "next/link";
import {
  getFeaturedProduct,
  getProductDashboardSnapshot,
  getUpcomingProducts,
} from "@/lib/data/products";
import { getSiteSettings } from "@/lib/data/site";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { FeaturedProductCard } from "@/components/product/featured-product-card";
import { SavingsCalculator } from "@/components/product/savings-calculator";
import { IntegrationsMarquee } from "@/components/sections/integrations-marquee";
import {
  CircleDashed,
  CheckCircle2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Products — Dilanix Software Ecosystem",
  description:
    "Explore the Dilanix product ecosystem, starting with CostOps — our multi-cloud and AI cost intelligence platform.",
  alternates: { canonical: "/products" },
};

export default async function ProductsPage() {
  const [featuredProduct, upcomingProducts, settings] = await Promise.all([
    getFeaturedProduct(),
    getUpcomingProducts(),
    getSiteSettings(),
  ]);

  if (!featuredProduct) {
    throw new Error("Expected a featured product to be configured.");
  }

  const snapshot = await getProductDashboardSnapshot(featuredProduct.slug);
  if (!snapshot) {
    throw new Error(
      `Expected a dashboard snapshot for "${featuredProduct.slug}".`,
    );
  }

  return (
    <div className="flex flex-col">
      {/* Products Header */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="from-accent/10 pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] via-transparent to-transparent" />

        <Container className="relative">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-accent font-mono text-xs font-medium tracking-widest uppercase">
              Software Ecosystem
            </span>
            <h1 className="text-foreground mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              Software for problems worth solving.
            </h1>
            <p className="text-muted-foreground mt-4 text-lg text-balance">
              Dilanix builds independent, high-leverage software products—each
              engineered around one expensive, measurable infrastructure
              challenge.
            </p>
          </div>
        </Container>
      </section>

      {/* Flagship Featured Product: CostOps */}
      <section className="pb-20">
        <Container>
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-success h-2 w-2 rounded-full" />
              <span className="text-foreground font-mono text-xs font-semibold tracking-wider uppercase">
                Flagship Active Product
              </span>
            </div>
            <Link
              href="/products/costops"
              className="text-accent flex items-center gap-1 font-mono text-xs hover:underline"
            >
              View Full Product Deep Dive →
            </Link>
          </div>

          <FeaturedProductCard
            product={featuredProduct}
            snapshot={snapshot}
            headingLevel="h2"
          />
        </Container>
      </section>

      {/* Integration Marquee */}
      <IntegrationsMarquee />

      {/* Upcoming Products Pipeline */}
      <section className="border-foreground/5 bg-foreground/[0.01] border-t py-24 sm:py-32">
        <Container>
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <span className="text-accent font-mono text-xs font-medium tracking-widest uppercase">
              Product Roadmap
            </span>
            <h2 className="text-foreground mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              What we are building next
            </h2>
            <p className="text-muted-foreground mt-4 text-base">
              Each product in our ecosystem solves a distinct, mission-critical
              engineering bottleneck while integrating seamlessly with our core
              platform.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {upcomingProducts.map((p, idx) => {
              const code = p.sortOrder
                ? String(p.sortOrder).padStart(2, "0")
                : String(idx + 2).padStart(2, "0");
              const features = p.features ?? [];
              return (
                <div
                  key={p.slug}
                  className="border-foreground/10 bg-card-strong hover:border-foreground/20 flex flex-col justify-between rounded-2xl border p-8 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground/40 font-mono text-2xl font-bold">
                        {code}
                      </span>
                      <span className="border-foreground/10 bg-foreground/5 text-muted-foreground inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-xs">
                        <CircleDashed size={12} className="animate-spin-slow" />
                        {p.tag ?? p.status}
                      </span>
                    </div>

                    <h3 className="text-foreground mt-6 text-2xl font-semibold tracking-tight">
                      {p.name}
                    </h3>
                    <p className="text-foreground/80 mt-2 text-sm font-medium">
                      {p.headline}
                    </p>
                    <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                      {p.description}
                    </p>

                    {features.length > 0 && (
                      <ul className="mt-6 grid grid-cols-2 gap-2.5">
                        {features.map((feat) => (
                          <li
                            key={feat}
                            className="text-foreground/80 flex items-center gap-2 text-xs"
                          >
                            <CheckCircle2
                              size={13}
                              className="text-accent shrink-0"
                            />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="border-foreground/5 mt-8 flex items-center justify-between border-t pt-6">
                    <span className="text-muted-foreground font-mono text-xs">
                      Early Access Program
                    </span>
                    <Link
                      href={(p.ctaHref || "/contact") as never}
                      className="text-accent flex items-center gap-1 text-xs font-medium hover:underline"
                    >
                      {p.ctaLabel || "Request Early Access →"}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ROI Savings Estimator */}
      <section className="border-foreground/5 border-t py-24 sm:py-32">
        <Container>
          <SavingsCalculator calendlyUrl={settings.calendlyUrl} />
        </Container>
      </section>

      {/* Bottom CTA */}
      <section className="border-foreground/10 bg-card-strong border-t py-20">
        <Container className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <h2 className="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">
            Have an expensive infrastructure problem?
          </h2>
          <p className="text-muted-foreground mt-3 text-sm">
            We partner closely with high-scale engineering teams to develop
            focused software solutions.
          </p>
          <div className="mt-6 flex gap-3">
            <Button
              href={settings.calendlyUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="primary"
            >
              Book a consultation
            </Button>
            <Button href="/contact" variant="secondary">
              Contact our engineers
            </Button>
          </div>
        </Container>
      </section>
    </div>
  );
}
