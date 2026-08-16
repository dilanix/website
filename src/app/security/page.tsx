import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/data/site";
import { PlaceholderPage } from "@/components/common/placeholder-page";

export const metadata: Metadata = {
  title: "Security",
  alternates: { canonical: "/security" },
};

export default async function SecurityPage() {
  const settings = await getSiteSettings();

  return (
    <PlaceholderPage title="Security">
      Detailed security documentation will be published here as Dilanix products
      mature. If you have a security concern, contact us at{" "}
      <a
        href={`mailto:${settings.email}`}
        className="text-foreground hover:text-accent"
      >
        {settings.email}
      </a>
      .
    </PlaceholderPage>
  );
}
