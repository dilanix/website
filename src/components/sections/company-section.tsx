import type { CompanyPage } from "@/types";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/common/reveal";

export function CompanySection({ company }: { company: CompanyPage }) {
  return (
    <section id="company" className="relative scroll-mt-16 py-24 sm:py-32">
      <div
        aria-hidden="true"
        className="bg-accent-secondary/18 pointer-events-none absolute top-1/2 left-1/2 -z-10 h-80 w-[52rem] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full blur-[110px]"
      />
      <Container className="max-w-3xl text-center">
        <Reveal>
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {company.headline}
          </h2>
          <p className="text-muted-foreground mt-6 text-lg leading-relaxed">
            {company.body}
          </p>
          <a
            href={company.ctaHref}
            className="text-foreground hover:text-accent mt-8 inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
          >
            {company.ctaLabel}
            <span aria-hidden="true">→</span>
          </a>
        </Reveal>
      </Container>
    </section>
  );
}
