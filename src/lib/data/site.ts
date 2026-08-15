import { siteConfig } from "@/config/site";
import type { SiteSettings } from "@/types";

const settings: SiteSettings = {
  name: siteConfig.name,
  domain: siteConfig.domain,
  description: siteConfig.description,
  url: siteConfig.url,
  social: {
    linkedin: "https://www.linkedin.com/company/dilanix",
    github: "https://github.com/dilanix",
  },
  nav: [
    { label: "Products", href: "#products" },
    { label: "Company", href: "#company" },
    { label: "Blog", href: "#" },
    { label: "Contact", href: "#" },
  ],
};

/** Stand-in for `GET /api/site-settings`. */
export async function getSiteSettings(): Promise<SiteSettings> {
  return settings;
}
