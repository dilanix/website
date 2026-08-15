import { siteConfig } from "@/config/site";
import type { SiteSettings } from "@/types";

const settings: SiteSettings = {
  name: siteConfig.name,
  domain: siteConfig.domain,
  description: siteConfig.description,
  url: siteConfig.url,
  email: "hello@dilanix.org",
  social: {
    linkedin: "https://www.linkedin.com/company/dilanix",
    github: "https://github.com/dilanix",
  },
  nav: [
    { label: "Products", href: "/products" },
    { label: "Company", href: "/company" },
    { label: "Blog", href: "/blog" },
    { label: "Contact", href: "/contact" },
  ],
};

// TODO: replace with `fetch(`${env.NEXT_PUBLIC_API_URL}/site-settings`)` once the backend ships.
export async function getSiteSettings(): Promise<SiteSettings> {
  return settings;
}
