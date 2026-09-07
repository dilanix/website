import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { HeroBackground } from "@/components/sections/hero-background";
import { ArrowRight, ShieldCheck, Zap, Sparkles } from "lucide-react";

export function HeroSection({ calendlyUrl }: { calendlyUrl: string }) {
  return (
    <section className="relative overflow-hidden">
      <HeroBackground />
      <Container className="relative pt-20 pb-14 sm:pt-28 sm:pb-20">
        <div className="relative flex flex-col items-center gap-6 px-1 py-8 text-center sm:px-10 sm:py-12">
          <div
            aria-hidden="true"
            className="bg-accent/10 pointer-events-none absolute top-1/2 left-1/2 -z-10 h-72 w-[46rem] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full blur-[110px]"
          />
          {/* Release Pill */}
          <div className="border-accent/30 bg-accent/10 text-accent inline-flex items-center gap-2 rounded-full border px-3.5 py-1 font-mono text-xs font-medium shadow-[0_10px_28px_var(--shadow-brand)]">
            <span className="bg-accent h-1.5 w-1.5 rounded-full" />
            <span>Independent Software Ecosystem</span>
            <span className="text-foreground/40 font-sans">|</span>
            <span>Engineered for Reliability</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-foreground max-w-4xl text-4xl leading-[1.08] font-semibold tracking-[-0.04em] text-balance sm:text-6xl md:text-7xl">
            Software for problems{" "}
            <span className="from-accent to-accent-secondary bg-gradient-to-r bg-clip-text text-transparent">
              worth solving.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed text-balance sm:text-xl">
            Dilanix builds independent, high-leverage software products for
            engineering teams — combining modern cloud infrastructure,
            distributed data systems, automation, and thoughtful systems design.
          </p>

          {/* CTAs */}
          <div className="mt-4 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
            <Button
              href={calendlyUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="primary"
              className="group w-full justify-center px-6 py-3 text-base sm:w-auto"
            >
              Get started
              <ArrowRight
                size={16}
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </Button>
            <Button
              href="/products"
              variant="secondary"
              className="group w-full justify-center px-6 py-3 text-base sm:w-auto"
            >
              Explore products
            </Button>
          </div>

          {/* Value Trust Points */}
          <div className="border-border-soft bg-card-strong/68 text-muted-foreground mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-2xl border px-5 py-3 font-mono text-xs shadow-[0_20px_52px_var(--shadow-card)] backdrop-blur-xl">
            <span className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-accent" />
              Zero-Bloat Architecture
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-success" />
              Enterprise-Grade Security
            </span>
            <span className="flex items-center gap-1.5">
              <Zap size={13} className="text-accent" />
              High-Throughput Systems
            </span>
          </div>
        </div>
      </Container>
    </section>
  );
}
