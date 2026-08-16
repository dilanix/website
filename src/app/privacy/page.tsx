import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/data/site";
import { PlaceholderPage } from "@/components/common/placeholder-page";

export const metadata: Metadata = {
  title: "Privacy",
  alternates: { canonical: "/privacy" },
};

export default async function PrivacyPage() {
  const settings = await getSiteSettings();

  return (
    <PlaceholderPage title="Privacy policy">
      Dilanix&apos;s privacy policy is being finalized and will be published
      here. Questions in the meantime can go to{" "}
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
