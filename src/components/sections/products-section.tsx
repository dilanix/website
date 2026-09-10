import {
  Activity,
  ArrowUpRight,
  Boxes,
  CircleDollarSign,
  Cloud,
  Package,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import type { Product } from "@/types";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/common/reveal";
import { cn } from "@/lib/utils";

function productVisual(product: Product) {
  const identity =
    `${product.slug} ${product.name} ${product.category ?? ""}`.toLowerCase();
  if (/automation|workflow/.test(identity)) {
    return {
      icon: Workflow,
      color: "text-violet-500",
      surface: "border-violet-500/20 bg-violet-500/10",
      glow: "bg-violet-500",
    };
  }
  if (/cost|billing|finops/.test(identity)) {
    return {
      icon: CircleDollarSign,
      color: "text-emerald-500",
      surface: "border-emerald-500/20 bg-emerald-500/10",
      glow: "bg-emerald-500",
    };
  }
  if (/observ|pulse|monitor|telemetr/.test(identity)) {
    return {
      icon: Activity,
      color: "text-cyan-500",
      surface: "border-cyan-500/20 bg-cyan-500/10",
      glow: "bg-cyan-500",
    };
  }
  if (/security|guard|protect/.test(identity)) {
    return {
      icon: ShieldCheck,
      color: "text-rose-500",
      surface: "border-rose-500/20 bg-rose-500/10",
      glow: "bg-rose-500",
    };
  }
  if (/infra|cloud|storage|dena/.test(identity)) {
    return {
      icon: Cloud,
      color: "text-blue-500",
      surface: "border-blue-500/20 bg-blue-500/10",
      glow: "bg-blue-500",
    };
  }
  return {
    icon: Package,
    color: "text-accent",
    surface: "border-accent/20 bg-accent/10",
    glow: "bg-accent",
  };
}

export function ProductsSection({ products }: { products: Product[] }) {
  const statusPriority: Record<Product["status"], number> = {
    active: 0,
    beta: 1,
    "in-development": 2,
    upcoming: 3,
  };
  const orderedProducts = [...products].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    if (a.status !== b.status) {
      return statusPriority[a.status] - statusPriority[b.status];
    }
    return (a.sortOrder ?? 99) - (b.sortOrder ?? 99);
  });

  return (
    <section id="products" className="relative scroll-mt-20 py-24 sm:py-32">
      <div
        aria-hidden="true"
        className="bg-accent/10 pointer-events-none absolute top-1/2 -left-52 -z-10 size-[32rem] -translate-y-1/2 rounded-full blur-[130px]"
      />
      <Container className="max-w-7xl">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading
            eyebrow="Product portfolio"
            title="One company. Focused products."
            description="Each Dilanix product is built around a distinct, expensive problem—with its own roadmap, interface, and measurable outcome."
            align="left"
          />
          <Link
            href="/products"
            className="border-border-soft bg-card-strong/70 hover:border-accent/30 inline-flex w-fit shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-sm backdrop-blur-sm"
          >
            View full portfolio <ArrowUpRight size={15} />
          </Link>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          {orderedProducts.map((product, index) => {
            const visual = productVisual(product);
            const Icon = visual.icon;
            const featured = product.featured;
            const active = product.status === "active";
            const capabilities = product.capabilities.slice(
              0,
              featured ? 4 : 2,
            );

            return (
              <Reveal
                key={product.slug}
                delayMs={Math.min(index * 70, 280)}
                className={cn(
                  "h-full",
                  featured ? "md:col-span-2 lg:col-span-4" : "lg:col-span-2",
                )}
              >
                <article
                  className={cn(
                    "border-border-soft bg-card-strong/72 group relative isolate flex h-full min-h-72 flex-col overflow-hidden rounded-[1.6rem] border shadow-[0_18px_48px_var(--shadow-card)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_26px_64px_var(--shadow-brand)]",
                    featured ? "p-7 sm:p-9" : "p-6",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "pointer-events-none absolute -top-16 -right-16 -z-10 size-44 rounded-full opacity-[0.09] blur-3xl transition-opacity group-hover:opacity-[0.16]",
                      visual.glow,
                    )}
                  />

                  <div className="flex items-start justify-between gap-4">
                    <span
                      className={cn(
                        "flex size-11 items-center justify-center rounded-xl border shadow-sm",
                        visual.color,
                        visual.surface,
                      )}
                    >
                      <Icon size={19} strokeWidth={1.8} />
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-semibold tracking-[0.12em] uppercase",
                        active
                          ? "border-success/20 bg-success/8 text-success"
                          : "border-border-soft bg-foreground/[0.025] text-muted-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "size-1 rounded-full",
                          active ? "bg-success" : "bg-muted-foreground/60",
                        )}
                      />
                      {active ? "Available" : (product.tag ?? "In development")}
                    </span>
                  </div>

                  <div className={featured ? "mt-8 max-w-3xl" : "mt-7"}>
                    <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.14em] uppercase">
                      {product.category ?? "Dilanix product"}
                    </p>
                    <h3
                      className={cn(
                        "mt-2 font-semibold tracking-[-0.035em]",
                        featured ? "text-2xl sm:text-3xl" : "text-xl",
                      )}
                    >
                      {product.name}
                    </h3>
                    <p
                      className={cn(
                        "text-muted-foreground mt-3 leading-6",
                        featured ? "max-w-3xl text-sm sm:text-base" : "text-sm",
                      )}
                    >
                      {product.headline}
                    </p>
                  </div>

                  {capabilities.length ? (
                    <ul
                      className={cn(
                        "mt-6 grid gap-2",
                        featured && "sm:grid-cols-2",
                      )}
                    >
                      {capabilities.map((capability) => (
                        <li
                          key={capability.label}
                          className="text-muted-foreground flex items-start gap-2 text-[11px] leading-5"
                        >
                          <span
                            className={cn(
                              "mt-2 size-1 shrink-0 rounded-full",
                              visual.glow,
                            )}
                          />
                          {capability.label}
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  <Link
                    href={product.ctaHref}
                    className={cn(
                      "mt-auto inline-flex items-center gap-1.5 pt-7 text-sm font-semibold after:absolute after:inset-0",
                      visual.color,
                    )}
                  >
                    {active ? "Discuss this product" : product.ctaLabel}
                    <ArrowUpRight
                      size={14}
                      className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </Link>
                </article>
              </Reveal>
            );
          })}

          {!orderedProducts.length ? (
            <div className="border-border-soft text-muted-foreground flex min-h-64 items-center justify-center rounded-[1.6rem] border border-dashed md:col-span-2 lg:col-span-6">
              <div className="text-center">
                <Boxes className="mx-auto opacity-50" size={22} />
                <p className="mt-3 text-sm">Product portfolio is loading.</p>
              </div>
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
