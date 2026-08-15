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
      className="border-foreground/5 scroll-mt-16 border-t py-24 sm:py-32"
    >
      <Container>
        <SectionHeading
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
