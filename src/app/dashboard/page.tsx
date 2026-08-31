import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDashboardSession } from "@/lib/dashboard/session";

export const metadata: Metadata = {
  title: "Products",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const { organization } = await getDashboardSession();
  redirect(organization ? "/dashboard/products" : "/dashboard/settings");
}
