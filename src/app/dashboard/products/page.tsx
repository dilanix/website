import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Boxes } from "lucide-react";
import { redirect } from "next/navigation";
import { getAccessToken } from "@/lib/auth/session";
import { getMe } from "@/lib/auth/api";
import { listOrganizationProducts } from "@/lib/core/api";
import { toDashboardProduct } from "@/lib/dashboard/products";
import {
  PageHeader,
  StatusBadge,
  EmptyState,
} from "@/components/dashboard/primitives";

export const metadata: Metadata = {
  title: "Products",
  robots: { index: false, follow: false },
};

export default async function ProductsPage() {
  const token = await getAccessToken();
  if (!token) redirect("/sign-in");
  const me = await getMe(token);
  const organization = me.organizations[0];
  const products = organization
    ? (await listOrganizationProducts(organization.organization_id, token)).map(
        toDashboardProduct,
      )
    : [];
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Products"
        description="Products available to your organization."
      />
      {products.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <article
              key={product.id}
              className="border-foreground/10 group data-[active=true]:hover:border-accent/40 flex min-h-52 flex-col rounded-xl border p-5 transition-colors"
              data-active={product.status === "active"}
            >
              <div className="flex items-start justify-between gap-4">
                <span className="bg-foreground/5 text-muted-foreground flex h-9 w-9 items-center justify-center rounded-lg">
                  <Boxes size={17} />
                </span>
                <StatusBadge
                  status={
                    product.status === "active"
                      ? "success"
                      : product.status === "pending"
                        ? "warning"
                        : "neutral"
                  }
                >
                  {product.status.charAt(0).toUpperCase() +
                    product.status.slice(1)}
                </StatusBadge>
              </div>
              <h2 className="mt-5 font-medium">{product.name}</h2>
              <p className="text-muted-foreground mt-2 text-sm leading-6">
                {product.description}
              </p>
              {product.status === "active" ? (
                <Link
                  href={product.href}
                  className="text-accent focus-visible:outline-accent mt-auto inline-flex items-center gap-1 pt-5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4"
                >
                  Open dashboard{" "}
                  <ArrowRight
                    size={14}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              ) : (
                <div className="text-muted-foreground mt-auto pt-5 text-xs">
                  {product.status === "expired" && product.accessExpiresAt
                    ? `Access expired ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(product.accessExpiresAt))}`
                    : product.status === "pending"
                      ? "Access has not started yet"
                      : "Contact your organization administrator"}
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No products"
          description="Products enabled for your organization will appear here."
        />
      )}
    </div>
  );
}
