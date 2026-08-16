import type { Metadata } from "next";
import { getFeaturedProduct } from "@/lib/data/products";
import { getPhilosophyPrinciples } from "@/lib/data/philosophy";
import { getTechnologyCategories } from "@/lib/data/technology";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { PhilosophySection } from "@/components/sections/philosophy-section";
import { TechnologySection } from "@/components/sections/technology-section";
import { EcosystemSection } from "@/components/sections/ecosystem-section";

export const metadata: Metadata = {
  title: "Company",
  description:
    "Dilanix builds focused software products around difficult, measurable problems.",
  alternates: { canonical: "/company" },
};

export default async function CompanyPage() {
  const [featuredProduct, principles, categories] = await Promise.all([
    getFeaturedProduct(),
    getPhilosophyPrinciples(),
    getTechnologyCategories(),
  ]);

  if (!featuredProduct) {
    throw new Error("Expected a featured product to be configured.");
  }

  return (
    <>
      <section className="py-20 sm:py-28">
        <Container className="max-w-2xl text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Building useful software.
          </h1>
          <p className="text-muted-foreground mt-6 text-lg">
            Dilanix builds focused software products around difficult,
            measurable problems.
          </p>
        </Container>
      </section>

      <section className="border-foreground/5 border-t py-20 sm:py-24">
        <Container className="max-w-3xl">
          <h2 className="text-muted-foreground mb-6 text-xs font-medium tracking-widest uppercase">
            What we build
          </h2>
          <p className="text-foreground text-lg">
            Dilanix builds independent software products, each around one
            expensive, well-defined problem. Our first product is{" "}
            {featuredProduct.shortName ?? featuredProduct.name}, which gives
            engineering teams visibility into what their cloud and AI
            infrastructure actually costs. More products will follow the same
            approach: pick a problem worth solving, and build the smallest thing
            that solves it well.
          </p>
        </Container>
      </section>

      <PhilosophySection principles={principles} title="How we work" />
      <TechnologySection categories={categories} title="What we value" />
      <EcosystemSection product={featuredProduct} />

      <section className="border-foreground/5 border-t py-20 sm:py-28">
        <Container className="flex flex-col items-center gap-6 text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            See what we&apos;re building.
          </h2>
          <Button href="/products" variant="primary">
            Explore products
          </Button>
        </Container>
      </section>
    </>
  );
}
