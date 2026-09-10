import { getProducts, getProductDashboardSnapshot } from "@/lib/data/products";
import { getPhilosophyPrinciples } from "@/lib/data/philosophy";
import { getTechnologyCategories } from "@/lib/data/technology";
import { getCompanyPage } from "@/lib/data/company";
import { getSiteSettings } from "@/lib/data/site";
import { HeroSection } from "@/components/sections/hero-section";
import { ProductsSection } from "@/components/sections/products-section";
import { PhilosophySection } from "@/components/sections/philosophy-section";
import { TechnologySection } from "@/components/sections/technology-section";
import { CompanySection } from "@/components/sections/company-section";
import { FinalCtaSection } from "@/components/sections/final-cta-section";
import { InteractiveDemoSection } from "@/components/sections/interactive-demo-section";

export default async function Home() {
  const products = await getProducts();
  const featuredProduct =
    products.find((product) => product.featured) ?? products[0];
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
    <div className="home-atmosphere relative isolate overflow-hidden">
      <HeroSection calendlyUrl={settings.calendlyUrl} />
      <InteractiveDemoSection
        productName={featuredProduct.shortName ?? featuredProduct.name}
        snapshot={snapshot}
        calendlyUrl={settings.calendlyUrl}
      />
      <ProductsSection products={products} />
      <PhilosophySection principles={principles} />
      <TechnologySection categories={categories} />
      <CompanySection company={company} />
      <FinalCtaSection calendlyUrl={settings.calendlyUrl} />
    </div>
  );
}
