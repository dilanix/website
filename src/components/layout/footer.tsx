import type { SiteSettings } from "@/types";
import { Container } from "@/components/ui/container";
import { LinkedinIcon, GithubIcon } from "@/components/icons/social-icons";

const columns = [
  {
    title: "Company",
    links: [
      { label: "About", href: "#company" },
      { label: "Contact", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Careers", href: "#" },
    ],
  },
  {
    title: "Products",
    links: [{ label: "CostOps", href: "#products" }],
  },
  {
    title: "Resources",
    links: [
      { label: "Security", href: "#" },
      { label: "Status", href: "#" },
      { label: "Documentation", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
    ],
  },
];

export function Footer({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="border-foreground/5 border-t">
      <Container className="grid gap-12 py-16 md:grid-cols-[1.4fr_repeat(4,1fr)] md:py-20">
        <div className="flex flex-col gap-4">
          <span className="text-foreground text-sm font-semibold tracking-[0.25em]">
            DILANIX
          </span>
          <p className="text-muted-foreground max-w-xs text-sm">
            {settings.description}
          </p>
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

      <div className="border-foreground/5 border-t">
        <Container className="py-6">
          <p className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} {settings.name}. All rights reserved.
          </p>
        </Container>
      </div>
    </footer>
  );
}
