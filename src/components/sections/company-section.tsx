import type { CompanyPage } from "@/types";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/common/reveal";
import { ArrowUpRight, Building2 } from "lucide-react";

export function CompanySection({ company }: { company: CompanyPage }) {
  return (
    <section id="company" className="relative scroll-mt-20 py-20 sm:py-24">
      <div
        aria-hidden="true"
        className="bg-accent-secondary/18 pointer-events-none absolute top-1/2 left-1/2 -z-10 h-80 w-[52rem] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full blur-[110px]"
      />
      <Container className="max-w-6xl">
        <Reveal>
          <div className="border-border-soft bg-card-strong/65 relative overflow-hidden rounded-[1.75rem] border p-7 shadow-[0_22px_60px_var(--shadow-card)] backdrop-blur-xl sm:p-10 lg:grid lg:grid-cols-[0.75fr_1.25fr] lg:items-center lg:gap-14">
            <div>
              <span className="border-accent/15 bg-accent/8 text-accent flex size-11 items-center justify-center rounded-xl border">
                <Building2 size={19} />
              </span>
              <p className="text-accent mt-5 text-[10px] font-semibold tracking-[0.16em] uppercase">
                The company behind the products
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-balance sm:text-3xl">
                {company.headline}
              </h2>
            </div>
            <div className="mt-7 lg:mt-0">
              <p className="text-muted-foreground text-base leading-7">
                {company.body}
              </p>
              <a
                href={company.ctaHref}
                className="text-foreground hover:text-accent mt-7 inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
              >
                {company.ctaLabel}
                <ArrowUpRight size={14} />
              </a>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
