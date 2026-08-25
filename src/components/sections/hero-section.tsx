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
      <Container className="relative flex flex-col items-center gap-6 pt-20 pb-16 text-center sm:pt-28 sm:pb-24">
        {/* Release Pill */}
        <div className="border-accent/30 bg-accent/10 text-accent inline-flex items-center gap-2 rounded-full border px-3.5 py-1 font-mono text-xs font-medium">
          <span className="bg-accent h-1.5 w-1.5 animate-pulse rounded-full" />
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
          engineering teams — combining modern cloud infrastructure, distributed
          data systems, automation, and thoughtful systems design.
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
            Get started
            <ArrowRight size={16} />
          </Button>
          <Button
            href="/products"
            variant="secondary"
            className="w-full justify-center px-6 py-3 text-base sm:w-auto"
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
      </Container>
    </section>
  );
}
