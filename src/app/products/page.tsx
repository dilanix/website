import type { Metadata } from "next";
import {
  getFeaturedProduct,
  getProductDashboardSnapshot,
} from "@/lib/data/products";
import { Container } from "@/components/ui/container";
import { FeaturedProductCard } from "@/components/product/featured-product-card";
import { EcosystemSection } from "@/components/sections/ecosystem-section";

export const metadata: Metadata = {
  title: "Products",
  description:
    "The Dilanix product ecosystem, starting with CostOps — our cloud and AI cost intelligence platform.",
  alternates: { canonical: "/products" },
};

export default async function ProductsPage() {
  const featuredProduct = await getFeaturedProduct();
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
    <>
      <section className="py-20 sm:py-28">
        <Container>
          <div className="text-center">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Products
            </h1>
            <p className="text-muted-foreground mt-4 text-lg">
              Focused products built to solve expensive, complex problems.
            </p>
          </div>
          <div className="mt-16">
            <FeaturedProductCard
              product={featuredProduct}
              snapshot={snapshot}
              headingLevel="h2"
            />
          </div>
        </Container>
      </section>

      <EcosystemSection product={featuredProduct} />
    </>
  );
}
