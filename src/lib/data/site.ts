import { siteConfig } from "@/config/site";
import type { SiteSettings } from "@/types";

const settings: SiteSettings = {
  name: siteConfig.name,
  domain: siteConfig.domain,
  description: siteConfig.description,
  url: siteConfig.url,
  email: "hello@dilanix.org",
  calendlyUrl: "https://calendly.com/koxlikyan1995/15min",
  // No verified LinkedIn/GitHub URLs exist yet — add them here once real
  // profiles are live rather than inventing placeholders.
  social: {},
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
