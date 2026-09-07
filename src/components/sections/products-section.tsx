import type { Product, ProductDashboardSnapshot } from "@/types";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { FeaturedProductCard } from "@/components/product/featured-product-card";
import { Reveal } from "@/components/common/reveal";

export function ProductsSection({
  product,
  snapshot,
}: {
  product: Product;
  snapshot: ProductDashboardSnapshot;
}) {
  return (
    <section
      id="products"
      className="relative scroll-mt-16 pt-14 pb-24 sm:pt-20 sm:pb-32"
    >
      <div
        aria-hidden="true"
        className="bg-accent/12 pointer-events-none absolute top-1/2 right-[-12rem] -z-10 h-[32rem] w-[32rem] -translate-y-1/2 rounded-full blur-[120px]"
      />
      <Container>
        <SectionHeading
          eyebrow="Featured product"
          title="Products"
          description="Focused products built to solve expensive, complex problems."
        />
        <Reveal className="mt-16" delayMs={100}>
          <FeaturedProductCard product={product} snapshot={snapshot} />
        </Reveal>
      </Container>
    </section>
  );
}
