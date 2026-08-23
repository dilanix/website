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
    description: "High-Throughput Global Object & Block Storage for AI Datasets.",
    status: "active",
    href: "/dashboard/products/dena" as Route,
    navigation: [
      { label: "Overview", href: "/dashboard/products/dena" as Route },
      { label: "Usage", href: "/dashboard/products/dena/usage" as Route },
      { label: "Documentation", href: "/dashboard/products/dena/docs" as Route },
    ],
  },
];

export async function getBilling() {
  return {
    plan: {
      name: "Growth Plan",
      price: "$499 / month",
      status: "Active",
      nextDate: "September 18, 2026",
    },
    usage: [
      { label: "Connected Workspaces", value: "3" },
      { label: "Active Team Seats", value: "12 / 20" },
      { label: "API Requests (30d)", value: "1.42M" },
    ],
    payment: {
      name: "Corporate Visa ending in 4242",
      expiry: "Expires 08/2028",
    },
    invoices: [
      { id: "INV-2026-08", date: "Aug 01, 2026", amount: "$499.00", status: "Paid" },
      { id: "INV-2026-07", date: "Jul 01, 2026", amount: "$499.00", status: "Paid" },
      { id: "INV-2026-06", date: "Jun 01, 2026", amount: "$499.00", status: "Paid" },
      { id: "INV-2026-05", date: "May 01, 2026", amount: "$449.00", status: "Paid" },
    ],
  };
}
