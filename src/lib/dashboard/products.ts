import type { Route } from "next";
import type { CoreProduct } from "@/lib/core/api";
import type { DashboardProduct } from "@/lib/data/dashboard-mocks";

const productNavigation: Record<string, { label: string; suffix: string }[]> = {
  dena: [
    { label: "Overview", suffix: "" },
    { label: "Usage", suffix: "/usage" },
    { label: "Docs", suffix: "/docs" },
  ],
  pulse: [
    { label: "Overview", suffix: "" },
    { label: "Usage", suffix: "/usage" },
    { label: "Docs", suffix: "/docs" },
  ],
  guard: [
    { label: "Overview", suffix: "" },
    { label: "Usage", suffix: "/usage" },
    { label: "Docs", suffix: "/docs" },
  ],
};

export function toDashboardProduct(
  product: CoreProduct,
): DashboardProduct {
  const base = `/dashboard/products/${product.slug}`;
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description ?? "No description provided.",
    status: product.access_status,
    accessExpiresAt: product.access_expires_at,
    href: base as Route,
    navigation: (
      productNavigation[product.slug] ?? [
        { label: "Overview", suffix: "" },
        { label: "Usage", suffix: "/usage" },
        { label: "Docs", suffix: "/docs" },
      ]
    ).map((item) => ({
      label: item.label,
      href: `${base}${item.suffix}` as Route,
    })),
  };
}
