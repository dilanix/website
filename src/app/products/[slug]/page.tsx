import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getProducts,
  getProductBySlug,
  getProductDashboardSnapshot,
} from "@/lib/data/products";
import { Container } from "@/components/ui/container";
import { FeaturedProductCard } from "@/components/product/featured-product-card";

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
    title: product.shortName ?? product.name,
    description: product.description,
    alternates: { canonical: `/products/${product.slug}` },
  };
}

export default async function ProductPage({
  params,
}: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    notFound();
  }

  const snapshot = await getProductDashboardSnapshot(slug);
  if (!snapshot) {
    notFound();
  }

  return (
    <section className="py-20 sm:py-28">
      <Container>
        <Link
          href="/products"
          className="text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          ← All products
        </Link>
        <div className="mt-8">
          <FeaturedProductCard
            product={product}
            snapshot={snapshot}
            showCta={false}
            headingLevel="h1"
          />
        </div>
      </Container>
    </section>
  );
}
