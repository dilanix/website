import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { HeroBackground } from "@/components/sections/hero-background";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
} from "lucide-react";

export function HeroSection({ calendlyUrl }: { calendlyUrl: string }) {
  return (
    <section className="relative overflow-hidden">
      <HeroBackground />
      <Container className="relative pt-20 pb-16 sm:pt-28 sm:pb-24">
        <div className="border-border-soft bg-card-strong/88 shadow-[0_22px_60px_var(--shadow-card)] relative flex flex-col items-center gap-6 overflow-hidden rounded-[2rem] border px-6 py-12 text-center sm:px-10 sm:py-16">
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, color-mix(in oklab, var(--accent-secondary) 75%, transparent) 50%, transparent 100%)",
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-[8%] w-20 rotate-[18deg] bg-[linear-gradient(180deg,transparent_0%,rgba(255,255,255,0.18)_50%,transparent_100%)] opacity-30 blur-[1px]"
          />
          {/* Release Pill */}
          <div className="border-accent/30 bg-accent/10 text-accent inline-flex items-center gap-2 rounded-full border px-3.5 py-1 font-mono text-xs font-medium shadow-[0_10px_28px_var(--shadow-brand)]">
            <span className="bg-accent h-1.5 w-1.5 rounded-full" />
            <span>Independent Software Ecosystem</span>
            <span className="text-foreground/40 font-sans">|</span>
            <span>Engineered for Reliability</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-foreground max-w-3xl text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl">
            Software for problems worth solving.
          </h1>

          {/* Subtitle */}
          <p className="text-muted-foreground max-w-xl text-lg leading-relaxed text-balance sm:text-xl">
            Dilanix builds independent, high-leverage software products for
            engineering teams — combining modern cloud infrastructure,
            distributed data systems, automation, and thoughtful systems
            design.
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
          <div className="text-muted-foreground mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-xs">
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
