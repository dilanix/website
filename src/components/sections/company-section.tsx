import type { CompanyPage } from "@/types";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/common/reveal";

export function CompanySection({ company }: { company: CompanyPage }) {
  return (
    <section
      id="company"
      className="border-foreground/5 scroll-mt-16 border-t py-24 sm:py-32"
    >
      <Container className="max-w-3xl">
        <Reveal>
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {company.headline}
          </h2>
          <p className="text-muted-foreground mt-6 text-lg">{company.body}</p>
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
