import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { HeroBackground } from "@/components/sections/hero-background";
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Zap,
} from "lucide-react";

export function HeroSection({ calendlyUrl }: { calendlyUrl: string }) {
  return (
    <section className="relative overflow-hidden">
      <HeroBackground />
      <Container className="relative flex flex-col items-center gap-6 pt-20 pb-16 text-center sm:pt-28 sm:pb-24">
        {/* Release Pill */}
        <Link
          href="/products/costops"
          className="group border-accent/30 bg-accent/10 text-accent hover:bg-accent/15 hover:border-accent/50 inline-flex items-center gap-2 rounded-full border px-3.5 py-1 font-mono text-xs font-medium transition-colors"
        >
          <span className="bg-accent h-1.5 w-1.5 animate-pulse rounded-full" />
          <span>CostOps v2.4 Live</span>
          <span className="text-foreground/40 font-sans">|</span>
          <span className="inline-flex items-center gap-0.5 transition-transform group-hover:translate-x-0.5">
            Cloud & AI Cost Intelligence <ArrowRight size={12} />
          </span>
        </Link>

        {/* Main Headline */}
        <h1 className="text-foreground max-w-3xl text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl">
          Software for problems worth solving.
        </h1>

        {/* Subtitle */}
        <p className="text-muted-foreground max-w-xl text-lg leading-relaxed text-balance sm:text-xl">
          Dilanix builds high-leverage software for engineering teams —
          combining multi-cloud cost intelligence, AI inference optimization,
          automation, and thoughtful product design.
        </p>

        {/* CTAs */}
        <div className="mt-4 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
          <Button
            href={calendlyUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="primary"
            className="shadow-accent/10 w-full justify-center px-6 py-3 text-base shadow-lg sm:w-auto"
          >
            Book a live demo
            <ArrowRight size={16} />
          </Button>
          <Button
            href="/products/costops"
            variant="secondary"
            className="w-full justify-center px-6 py-3 text-base sm:w-auto"
          >
            Explore CostOps
          </Button>
        </div>

        {/* Value Trust Points */}
        <div className="text-muted-foreground mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-xs">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-success" />
            32% Avg Cloud Savings
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-success" />
            100% Read-Only Security
          </span>
          <span className="flex items-center gap-1.5">
            <Zap size={13} className="text-accent" />
            2-Min Zero-Agent Setup
          </span>
        </div>
      </Container>
    </section>
  );
}
