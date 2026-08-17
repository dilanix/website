import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getProductBySlug } from "@/lib/data/products";
import { Badge } from "@/components/ui/badge";
import { ProductTabs } from "@/components/dashboard/product-tabs";

export default async function ProductDashboardLayout({
  children,
  params,
}: LayoutProps<"/dashboard/products/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/dashboard"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeft size={14} />
          Products
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {product.shortName ?? product.name}
          </h1>
          <Badge tone={product.status === "active" ? "success" : "neutral"}>
            {product.status === "active" ? "Active" : "In development"}
          </Badge>
        </div>
      </div>

      <ProductTabs slug={slug} />

      {children}
    </div>
  );
}
