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
