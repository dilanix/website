import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/common/placeholder-page";

export const metadata: Metadata = {
  title: "Terms",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <PlaceholderPage title="Terms of service">
      Dilanix&apos;s terms of service are being finalized and will be published
      here.
    </PlaceholderPage>
  );
}
