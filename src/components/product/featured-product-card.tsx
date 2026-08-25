import type { Product, ProductDashboardSnapshot } from "@/types";
import { Badge } from "@/components/ui/badge";
import { DashboardMockup } from "@/components/product/dashboard-mockup";

export function FeaturedProductCard({
  product,
  snapshot,
  showCta = true,
  headingLevel = "h3",
}: {
  product: Product;
  snapshot: ProductDashboardSnapshot;
  /** Hide the drill-in CTA when the card is already rendered on its own detail page. */
  showCta?: boolean;
  /**
   * The card is reused at different points in the heading hierarchy: nested
   * under a section's own h2 (homepage, /products), or as a page's only
   * heading (the /products/[slug] detail page, where it should be the h1).
   */
  headingLevel?: "h1" | "h2" | "h3";
}) {
  const Heading = headingLevel;

  return (
    <div className="group border-border-soft from-card-strong/92 to-surface/72 hover:border-accent/22 hover:-translate-y-1 shadow-[0_20px_56px_var(--shadow-card)] hover:shadow-[0_28px_68px_var(--shadow-brand)] relative grid gap-10 overflow-hidden rounded-[1.75rem] border bg-gradient-to-br p-6 transition-all duration-300 sm:p-8 lg:grid-cols-2 lg:items-center lg:gap-12 lg:p-12">
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-[-12%] w-20 rotate-[16deg] bg-[linear-gradient(180deg,transparent_0%,rgba(255,255,255,0.32)_50%,transparent_100%)] opacity-0 blur-[1px] transition-opacity duration-300 group-hover:opacity-100 motion-reduce:hidden"
      />
      <div className="flex flex-col gap-6">
        {product.eyebrow ? (
          <Badge tone="accent">{product.eyebrow.toUpperCase()}</Badge>
        ) : null}

        <div>
          <p className="text-muted-foreground text-sm font-medium">
            {product.name}
          </p>
          <Heading className="mt-2 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {product.headline}
          </Heading>
        </div>

        <p className="text-muted-foreground text-base">{product.description}</p>

        <ul className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          {product.capabilities.map((capability) => (
            <li
              key={capability.label}
              className="text-foreground flex items-start gap-2.5 text-sm"
            >
              <span className="bg-accent mt-1.5 h-1 w-1 shrink-0 rounded-full" />
              {capability.label}
            </li>
          ))}
        </ul>

        {showCta ? (
          <a
            href={product.ctaHref}
            className="text-foreground hover:text-accent inline-flex w-fit items-center gap-1.5 text-sm font-medium transition-colors"
          >
            {product.ctaLabel}
            <span
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:translate-x-1"
            >
              →
            </span>
          </a>
        ) : null}
      </div>

      <div className="transition-transform duration-300 group-hover:-translate-y-1">
        <DashboardMockup
          productName={product.shortName ?? product.name}
          snapshot={snapshot}
        />
      </div>
    </div>
  );
}
