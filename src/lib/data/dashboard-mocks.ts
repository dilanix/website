import type { Route } from "next";

export type DashboardProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: "active" | "pending" | "expired" | "disabled";
  accessExpiresAt?: string | null;
  href: Route;
  navigation: { label: string; href: Route }[];
};

export const dashboardProducts: DashboardProduct[] = [
  {
    id: "dena",
    name: "Dena Cloud Storage",
    slug: "dena",
    description:
      "High-Throughput Global Object & Block Storage for AI Datasets.",
    status: "active",
    href: "/dashboard/products/dena" as Route,
    navigation: [
      { label: "Overview", href: "/dashboard/products/dena" as Route },
      { label: "Usage", href: "/dashboard/products/dena/usage" as Route },
      {
        label: "Documentation",
        href: "/dashboard/products/dena/docs" as Route,
      },
    ],
  },
];
