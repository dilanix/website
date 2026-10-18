import { env } from "@/env";
import { siteConfig } from "@/config/site";
import type { SiteSettings } from "@/types";

const defaultSettings: SiteSettings = {
  name: siteConfig.name,
  domain: siteConfig.domain,
  description: siteConfig.description,
  url: siteConfig.url,
  email: "contact@dilanix.org",
  calendlyUrl: "https://calendly.com",
  social: {},
  nav: [
    {
      label: "Product",
      children: [
        {
          label: "Overview",
          href: "/products",
          description: "Cost and Infrastructure on one platform",
        },
        {
          label: "How it works",
          href: "/#platform",
          description: "From a read-only connection to ranked savings",
        },
        {
          label: "Product tour",
          href: "/#demo",
          description: "Click through the real dashboard",
        },
        {
          label: "Security",
          href: "/#trust",
          description: "Read-only access and verified commands",
        },
      ],
    },
    { label: "Solutions", href: "/solutions/aws-cost-optimization" },
    {
      label: "Company",
      children: [
        {
          label: "About",
          href: "/company",
          description: "What we build and how we build it",
        },
        { label: "Blog", href: "/blog", description: "Notes from the team" },
        { label: "Contact", href: "/contact", description: "Talk to us" },
      ],
    },
  ],
};

type ApiSiteSettingsResponse = {
  settings: Record<string, unknown>;
};

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/v1/site/settings`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(2500),
    });
    if (res.ok) {
      const data: ApiSiteSettingsResponse = await res.json();
      const s = data.settings;
      const general = (s.general_settings as Record<string, unknown>) || {};
      return {
        name: (general.name as string) ?? defaultSettings.name,
        domain: (general.domain as string) ?? defaultSettings.domain,
        description:
          (general.description as string) ?? defaultSettings.description,
        url: (general.url as string) ?? defaultSettings.url,
        email: (s.support_email as string) ?? defaultSettings.email,
        calendlyUrl: (s.calendly_url as string) ?? defaultSettings.calendlyUrl,
        social:
          (general.social as SiteSettings["social"]) ?? defaultSettings.social,
        nav: defaultSettings.nav,
      };
    }
  } catch {
    // Fallback to static site config
  }
  return defaultSettings;
}
