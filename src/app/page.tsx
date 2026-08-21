import {
  getFeaturedProduct,
  getProductDashboardSnapshot,
} from "@/lib/data/products";
import { getPhilosophyPrinciples } from "@/lib/data/philosophy";
import { getTechnologyCategories } from "@/lib/data/technology";
import { getCompanyPage } from "@/lib/data/company";
import { getSiteSettings } from "@/lib/data/site";
import { HeroSection } from "@/components/sections/hero-section";
import { IntegrationsMarquee } from "@/components/sections/integrations-marquee";
import { ProductsSection } from "@/components/sections/products-section";
import { ProblemSolutionSection } from "@/components/sections/problem-solution-section";
import { SavingsCalculator } from "@/components/product/savings-calculator";
import { EcosystemSection } from "@/components/sections/ecosystem-section";
import { PhilosophySection } from "@/components/sections/philosophy-section";
import { TechnologySection } from "@/components/sections/technology-section";
import { CompanySection } from "@/components/sections/company-section";
import { FinalCtaSection } from "@/components/sections/final-cta-section";
import { Container } from "@/components/ui/container";

export default async function Home() {
  const featuredProduct = await getFeaturedProduct();
  if (!featuredProduct) {
    throw new Error("Expected a featured product to be configured.");
  }

  const [snapshot, principles, categories, company, settings] =
    await Promise.all([
      getProductDashboardSnapshot(featuredProduct.slug),
      getPhilosophyPrinciples(),
      getTechnologyCategories(),
      getCompanyPage(),
      getSiteSettings(),
    ]);

  if (!snapshot) {
    throw new Error(
      `Expected a dashboard snapshot for "${featuredProduct.slug}".`,
    );
  }

  return (
    <>
      <HeroSection calendlyUrl={settings.calendlyUrl} />
      <IntegrationsMarquee />
      <ProductsSection product={featuredProduct} snapshot={snapshot} />
      <ProblemSolutionSection />

      {/* Interactive Savings Calculator on Homepage */}
      <section className="border-foreground/5 bg-foreground/[0.01] border-t py-24 sm:py-32">
        <Container>
          <SavingsCalculator calendlyUrl={settings.calendlyUrl} />
        </Container>
      </section>

      <EcosystemSection product={featuredProduct} />
      <PhilosophySection principles={principles} />
      <TechnologySection categories={categories} />
      <CompanySection company={company} />
      <FinalCtaSection />
    </>
  );
}
