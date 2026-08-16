import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/common/placeholder-page";

export const metadata: Metadata = {
  title: "Status",
  alternates: { canonical: "/status" },
};

export default function StatusPage() {
  return (
    <PlaceholderPage title="Status">
      A live status page will appear here once Dilanix products are running in
      production.
    </PlaceholderPage>
  );
}
