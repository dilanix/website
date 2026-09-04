import type { SiteSettings } from "@/types";
import { Container } from "@/components/ui/container";
import { LinkedinIcon, GithubIcon } from "@/components/icons/social-icons";
import { BrandLogo } from "./brand-logo";

const columns = [
  {
    title: "Products",
    links: [
      { label: "Overview", href: "/products" },
      { label: "AWS Cost Optimization", href: "/solutions/aws-cost-optimization" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/company" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

export function Footer({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="border-border-soft mt-8 border-t">
      <Container className="grid gap-12 py-16 md:grid-cols-[1.5fr_repeat(3,1fr)] md:py-20">
        <div className="flex flex-col gap-4">
          <BrandLogo className="h-8 w-auto" />
          <p className="text-muted-foreground max-w-xs text-sm">
            {settings.description}
          </p>
          {settings.social.linkedin || settings.social.github ? (
            <div className="mt-2 flex items-center gap-4">
              {settings.social.linkedin ? (
                <a
                  href={settings.social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Dilanix on LinkedIn"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <LinkedinIcon className="h-5 w-5" />
                </a>
              ) : null}
              {settings.social.github ? (
                <a
                  href={settings.social.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Dilanix on GitHub"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <GithubIcon className="h-5 w-5" />
                </a>
              ) : null}
            </div>
          ) : null}
        </div>

        {columns.map((column) => (
          <div key={column.title} className="flex flex-col gap-3">
            <h3 className="text-foreground text-sm font-medium">
              {column.title}
            </h3>
            <ul className="flex flex-col gap-2.5">
              {column.links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>

      <div className="border-border-soft border-t">
        <Container className="py-6">
          <p className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} {settings.name}. All rights reserved.
          </p>
        </Container>
      </div>
    </footer>
  );
}
