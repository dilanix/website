import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Products",
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  redirect("/dashboard/products");
}
