import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getProducts,
  getProductBySlug,
  getProductDashboardSnapshot,
} from "@/lib/data/products";
import { getSiteSettings } from "@/lib/data/site";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { CostOpsSimulator } from "@/components/product/costops-simulator";
import { SavingsCalculator } from "@/components/product/savings-calculator";
import { ProductFeaturesGrid } from "@/components/product/product-features-grid";
import { ProductHowItWorks } from "@/components/product/product-how-it-works";
import { ProductComparison } from "@/components/product/product-comparison";
import { ProductSecuritySection } from "@/components/product/product-security-section";
import { ProductFaq } from "@/components/product/product-faq";
import { IntegrationsMarquee } from "@/components/sections/integrations-marquee";
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product" };

  return {
    title: `${product.shortName ?? product.name} — Cloud & AI Cost Intelligence`,
    description: product.description,
    alternates: { canonical: `/products/${product.slug}` },
  };
}

export default async function ProductDetailPage({
  params,
}: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const [product, snapshot, settings] = await Promise.all([
    getProductBySlug(slug),
    getProductDashboardSnapshot(slug),
    getSiteSettings(),
  ]);

  if (!product || !snapshot) {
    notFound();
  }

  return (
    <div className="flex flex-col">
      {/* Breadcrumb Navigation */}
      <div className="border-foreground/5 bg-foreground/[0.015] border-b py-3">
        <Container>
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link
              href="/products"
              className="hover:text-foreground transition-colors"
            >
              Products
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">
              {product.shortName ?? product.name}
            </span>
          </div>
        </Container>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="from-accent/10 pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] via-transparent to-transparent" />

        <Container className="relative">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <div className="border-accent/30 bg-accent/10 text-accent inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs font-medium">
              <span className="bg-accent h-1.5 w-1.5 animate-pulse rounded-full" />
              <span>CostOps v2.4 Active & Multi-Cloud Ready</span>
            </div>

            <h1 className="text-foreground mt-6 text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl">
              Stop overpaying for Cloud & AI infrastructure.
            </h1>

            <p className="text-muted-foreground mt-6 text-lg leading-relaxed text-balance sm:text-xl">
              Real-time cost anomaly detection, token-level LLM spend
              attribution, and automated right-sizing recommendations that save
              modern engineering teams up to{" "}
              <strong className="text-foreground">35% on infrastructure</strong>
              .
            </p>

            <div className="mt-8 flex w-full flex-col items-center gap-4 sm:w-auto sm:flex-row">
              <Button
                href={settings.calendlyUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="primary"
                className="shadow-accent/10 w-full justify-center px-6 py-3 text-base shadow-lg sm:w-auto"
              >
                Book a live walkthrough
                <ArrowRight size={16} />
              </Button>
              <Button
                href="#simulator"
                variant="secondary"
                className="w-full justify-center px-6 py-3 text-base sm:w-auto"
              >
                Explore interactive sandbox
              </Button>
            </div>

            {/* Micro-Trust Indicators */}
            <div className="text-muted-foreground mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-xs">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-success" />
                2-Minute Zero-Agent Setup
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-success" />
                100% Read-Only IAM
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-accent" />
                14-Day Free Discovery
              </span>
            </div>
          </div>
        </Container>
      </section>

      {/* Integration Logos Ticker */}
      <IntegrationsMarquee />

      {/* Key Metrics Ribbon */}
      <section className="border-foreground/10 bg-card-strong border-b py-12">
        <Container>
          <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
            <div>
              <div className="text-success font-mono text-3xl font-bold sm:text-4xl">
                32%
              </div>
              <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                Average monthly cloud spend reduction
              </p>
            </div>
            <div>
              <div className="text-foreground font-mono text-3xl font-bold sm:text-4xl">
                &lt; 2 min
              </div>
              <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                Zero-agent read-only connection time
              </p>
            </div>
            <div>
              <div className="text-accent font-mono text-3xl font-bold sm:text-4xl">
                84.2%
              </div>
              <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                LLM prompt cache optimization rate
              </p>
            </div>
            <div>
              <div className="text-foreground font-mono text-3xl font-bold sm:text-4xl">
                100%
              </div>
              <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                Read-only least-privilege security
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Interactive Simulator Section */}
      <section id="simulator" className="py-24 sm:py-32">
        <Container>
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="text-accent font-mono text-xs font-medium tracking-widest uppercase">
              Live Product Experience
            </span>
            <h2 className="text-foreground mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Experience the CostOps intelligence platform
            </h2>
            <p className="text-muted-foreground mt-4 text-base">
              Interact with live simulated clusters, explore AI token usage
              metrics, and inspect ready-to-merge Terraform pull requests.
            </p>
          </div>

          <CostOpsSimulator />
        </Container>
      </section>

      {/* Deep Value Features Grid */}
      <section className="border-foreground/5 bg-foreground/[0.01] border-t py-24 sm:py-32">
        <Container>
          <ProductFeaturesGrid />
        </Container>
      </section>

      {/* Interactive ROI Savings Calculator */}
      <section className="border-foreground/5 border-t py-24 sm:py-32">
        <Container>
          <SavingsCalculator calendlyUrl={settings.calendlyUrl} />
        </Container>
      </section>

      {/* 3-Step Setup & How It Works */}
      <section className="border-foreground/5 bg-foreground/[0.01] border-t py-24 sm:py-32">
        <Container>
          <ProductHowItWorks />
        </Container>
      </section>

      {/* Comparison Matrix */}
      <section className="border-foreground/5 border-t py-24 sm:py-32">
        <Container>
          <ProductComparison />
        </Container>
      </section>

      {/* Security & Compliance Architecture */}
      <section className="border-foreground/5 bg-foreground/[0.01] border-t py-24 sm:py-32">
        <Container>
          <ProductSecuritySection />
        </Container>
      </section>

      {/* FAQ Accordion */}
      <section className="border-foreground/5 border-t py-24 sm:py-32">
        <Container>
          <ProductFaq />
        </Container>
      </section>

      {/* Bottom Conversion Banner */}
      <section className="border-foreground/10 bg-card-strong border-t py-20 sm:py-28">
        <Container className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <span className="text-accent font-mono text-xs font-medium tracking-widest uppercase">
            Get Started Today
          </span>
          <h2 className="text-foreground mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Ready to stop cloud waste and unlock true AI unit economics?
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl text-base">
            Book a 20-minute architecture discovery walkthrough. We&apos;ll
            calculate your real-time infrastructure savings live on the call.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Button
              href={settings.calendlyUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="primary"
              className="px-8 py-3 text-base"
            >
              Book a live walkthrough
              <ArrowRight size={16} />
            </Button>
            <Button
              href="/sign-in"
              variant="secondary"
              className="px-8 py-3 text-base"
            >
              Sign in to Dashboard
            </Button>
          </div>
          <p className="text-muted-foreground mt-4 font-mono text-xs">
            Zero-risk 14-day discovery scan • No credit card required • Cancel
            anytime
          </p>
        </Container>
      </section>
    </div>
  );
}
