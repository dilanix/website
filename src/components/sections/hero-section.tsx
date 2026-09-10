import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { HeroBackground } from "@/components/sections/hero-background";
import {
  ArrowDown,
  ArrowRight,
  DatabaseZap,
  Eye,
  ShieldCheck,
} from "lucide-react";

export function HeroSection({ calendlyUrl }: { calendlyUrl: string }) {
  return (
    <section className="relative overflow-hidden">
      <HeroBackground />
      <Container className="relative pt-16 pb-10 sm:pt-24 sm:pb-14">
        <div className="relative flex flex-col items-center px-1 py-8 text-center sm:px-10 sm:py-12">
          <div
            aria-hidden="true"
            className="bg-accent/10 pointer-events-none absolute top-1/2 left-1/2 -z-10 h-72 w-[46rem] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full blur-[110px]"
          />
          <div className="border-accent/20 bg-card-strong/72 text-accent inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[10px] font-semibold tracking-[0.14em] uppercase shadow-[0_12px_32px_var(--shadow-card)] backdrop-blur-xl">
            <span className="bg-accent h-1.5 w-1.5 rounded-full shadow-[0_0_9px_var(--accent)]" />
            <span>Independent multi-product software company</span>
          </div>

          <h1 className="text-foreground mt-7 max-w-5xl text-4xl leading-[1.02] font-semibold tracking-[-0.055em] text-balance sm:text-6xl md:text-[4.75rem]">
            Complex work deserves
            <span className="from-accent via-accent to-accent-secondary mt-2 block bg-gradient-to-r bg-clip-text text-transparent">
              software that feels obvious.
            </span>
          </h1>

          <p className="text-muted-foreground mt-7 max-w-3xl text-lg leading-relaxed text-balance sm:text-xl">
            Dilanix builds focused products across cloud cost, infrastructure,
            data, automation, observability, and security—designed to create
            measurable value without unnecessary complexity.
          </p>

          <div className="mt-9 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
            <Button
              href={calendlyUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="primary"
              className="group w-full justify-center px-6 py-3 text-base sm:w-auto"
            >
              Book a live demo
              <ArrowRight
                size={16}
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </Button>
            <Button
              href="#interactive-demo"
              variant="secondary"
              className="group w-full justify-center px-6 py-3 text-base sm:w-auto"
            >
              Explore interactive demo
              <ArrowDown
                size={15}
                className="transition-transform group-hover:translate-y-0.5"
              />
            </Button>
          </div>

          <div className="border-border-soft bg-card-strong/68 text-muted-foreground mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-2xl border px-5 py-3 text-[11px] shadow-[0_20px_52px_var(--shadow-card)] backdrop-blur-xl">
            <span className="flex items-center gap-1.5">
              <DatabaseZap size={13} className="text-accent" />
              Measurable business value
            </span>
            <span className="flex items-center gap-1.5">
              <Eye size={13} className="text-accent" />
              Focused product design
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-success" />
              Engineering-first execution
            </span>
          </div>
        </div>
      </Container>
    </section>
  );
}
