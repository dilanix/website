import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getProducts } from "@/lib/data/products";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Products",
  robots: { index: false, follow: false },
};

export default async function DashboardProductsPage() {
  const products = await getProducts();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Everything your organization has access to. New products you get
          access to will show up here automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => {
          const active = product.status === "active";
          const card = (
            <div
              className={cn(
                "border-foreground/10 flex h-full flex-col gap-3 rounded-xl border p-5 transition-colors",
                active && "hover:border-accent/40",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-foreground text-base font-medium">
                  {product.shortName ?? product.name}
                </p>
                <Badge tone={active ? "success" : "neutral"}>
                  {active ? "Active" : "In development"}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm">
                {product.headline}
              </p>
              {active ? (
                <span className="text-accent mt-auto flex items-center gap-1 text-sm">
                  Open dashboard
                  <ArrowRight size={14} />
                </span>
              ) : (
                <span className="text-muted-foreground mt-auto text-sm">
                  Dashboard coming soon
                </span>
              )}
            </div>
          );

          return active ? (
            <Link key={product.slug} href={`/dashboard/products/${product.slug}`}>
              {card}
            </Link>
          ) : (
            <div key={product.slug}>{card}</div>
          );
        })}
      </div>
    </div>
  );
}
