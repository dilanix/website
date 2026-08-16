import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/common/placeholder-page";

export const metadata: Metadata = {
  title: "Careers",
  alternates: { canonical: "/careers" },
};

export default function CareersPage() {
  return (
    <PlaceholderPage title="Careers">
      Dilanix isn&apos;t hiring yet, but we&apos;re building toward it. Open
      roles will be posted here.
    </PlaceholderPage>
  );
}
