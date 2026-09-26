import { getProducts, getProductDashboardSnapshot } from "@/lib/data/products";
import { getSiteSettings } from "@/lib/data/site";
import { HeroSection } from "@/components/sections/hero-section";
import { FinalCtaSection } from "@/components/sections/final-cta-section";
import { InteractiveDemoSection } from "@/components/sections/interactive-demo-section";
import { PlatformSection } from "@/components/sections/platform-section";
import { AudienceSection } from "@/components/sections/audience-section";

export default async function Home() {
  const products = await getProducts();
  const featuredProduct =
    products.find((product) => product.featured) ?? products[0];
  if (!featuredProduct) {
    throw new Error("Expected a featured product to be configured.");
  }

  const [snapshot, settings] = await Promise.all([
    getProductDashboardSnapshot(featuredProduct.slug),
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
      <PlatformSection />
      <InteractiveDemoSection
        productName={featuredProduct.shortName ?? featuredProduct.name}
        snapshot={snapshot}
        calendlyUrl={settings.calendlyUrl}
      />
      <AudienceSection />
      <FinalCtaSection calendlyUrl={settings.calendlyUrl} />
    </div>
  );
}
