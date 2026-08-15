import { CircleDashed } from "lucide-react";
import type { Product } from "@/types";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/common/reveal";

export function EcosystemSection({ product }: { product: Product }) {
  return (
    <section id="company-ecosystem" className="py-24 sm:py-32">
      <Container>
        <SectionHeading
          title="One company. Focused products."
          description="We build independent software products around problems where technology can create measurable value."
        />

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          <Reveal delayMs={0}>
            <a
              href={product.ctaHref}
              className="group border-foreground/10 bg-foreground/[0.03] hover:border-foreground/20 flex h-full min-h-56 flex-col justify-between rounded-xl border p-6 transition-colors duration-300"
            >
              <div className="flex items-center gap-2">
                <span className="bg-success h-1.5 w-1.5 rounded-full" />
                <span className="text-success text-xs font-medium tracking-wide uppercase">
                  Active
                </span>
              </div>
              <div>
                <p className="text-foreground text-lg font-semibold">
                  {product.name}
                </p>
                <p className="text-muted-foreground mt-2 text-sm">
                  {product.headline}
                </p>
              </div>
              <span className="text-muted-foreground group-hover:text-foreground text-sm transition-colors">
                Learn more →
              </span>
            </a>
          </Reveal>

          {[0, 1].map((index) => (
            <Reveal key={index} delayMs={(index + 1) * 100}>
              <div className="border-foreground/15 bg-foreground/[0.015] flex h-full min-h-56 flex-col justify-between rounded-xl border border-dashed p-6">
                <div className="text-muted-foreground flex items-center gap-2">
                  <CircleDashed size={14} className="animate-spin-slow" />
                  <span className="text-xs font-medium tracking-wide uppercase">
                    In development
                  </span>
                </div>
                <div className="border-foreground/15 h-9 w-9 rounded-md border border-dashed" />
              </div>
            </Reveal>
          ))}
        </div>

        <p className="text-muted-foreground mt-8 text-center text-sm">
          More products are being built.
        </p>
      </Container>
    </section>
  );
}
