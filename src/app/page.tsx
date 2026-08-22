import {
  getFeaturedProduct,
  getProductDashboardSnapshot,
} from "@/lib/data/products";
import { getPhilosophyPrinciples } from "@/lib/data/philosophy";
import { getTechnologyCategories } from "@/lib/data/technology";
import { getCompanyPage } from "@/lib/data/company";
import { getSiteSettings } from "@/lib/data/site";
import { HeroSection } from "@/components/sections/hero-section";
import { ProductsSection } from "@/components/sections/products-section";
import { ProblemSolutionSection } from "@/components/sections/problem-solution-section";
import { EcosystemSection } from "@/components/sections/ecosystem-section";
import { PhilosophySection } from "@/components/sections/philosophy-section";
import { TechnologySection } from "@/components/sections/technology-section";
import { CompanySection } from "@/components/sections/company-section";
import { FinalCtaSection } from "@/components/sections/final-cta-section";

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
      <ProductsSection product={featuredProduct} snapshot={snapshot} />
      <ProblemSolutionSection />
      <EcosystemSection product={featuredProduct} />
      <PhilosophySection principles={principles} />
      <TechnologySection categories={categories} />
      <CompanySection company={company} />
      <FinalCtaSection />
    </>
  );
}
