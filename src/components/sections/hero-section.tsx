import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { HeroBackground } from "@/components/sections/hero-background";
import { HeroReel } from "@/components/sections/hero-reel";
import { ArrowRight, BadgeCheck, Lock, Receipt } from "lucide-react";

export function HeroSection({ calendlyUrl }: { calendlyUrl: string }) {
  return (
    <section className="relative overflow-hidden">
      <HeroBackground />
      <Container className="relative pt-14 pb-16 sm:pt-20 sm:pb-24">
        <div className="relative grid items-center gap-14 py-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16 lg:py-14">
          <div
            aria-hidden="true"
            className="bg-accent/10 pointer-events-none absolute top-1/3 left-1/3 -z-10 h-72 w-[42rem] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full blur-[110px]"
          />
          <div className="flex flex-col items-start text-left">
            <div className="border-accent/20 bg-card-strong/72 text-accent inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[10px] font-semibold tracking-[0.14em] uppercase shadow-[0_12px_32px_var(--shadow-card)] backdrop-blur-xl">
              <span className="bg-accent h-1.5 w-1.5 rounded-full shadow-[0_0_9px_var(--accent)]" />
              <span>Cloud cost and infrastructure intelligence</span>
            </div>

            <h1 className="text-foreground mt-7 max-w-3xl text-4xl leading-[1.02] font-semibold tracking-[-0.055em] text-balance sm:text-6xl lg:text-[4.4rem]">
              Know what your cloud runs.
              <span className="from-accent via-accent to-accent-secondary mt-2 block bg-gradient-to-r bg-clip-text text-transparent">
                Pay only for what it needs.
              </span>
            </h1>

            <p className="text-muted-foreground mt-7 max-w-2xl text-lg leading-relaxed text-balance sm:text-xl">
              Dilanix maps every resource in your accounts, reads your real
              bill, and learns how your services connect. Then it ranks the
              savings that are safe to make — and shows you exactly how to make
              them.
            </p>

            <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Button
                href={calendlyUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="primary"
                className="group w-full justify-center px-6 py-3 text-base sm:w-auto"
              >
                Book a demo
                <ArrowRight
                  size={16}
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </Button>
              <Button
                href="#demo"
                variant="secondary"
                className="group w-full justify-center px-6 py-3 text-base sm:w-auto"
              >
                Take the product tour
                <ArrowRight
                  size={15}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Button>
            </div>

            <p className="text-muted-foreground mt-8 flex flex-wrap items-center gap-2 text-xs">
              <span className="border-border-soft bg-card-strong/70 text-foreground inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-semibold">
                <span className="bg-success size-1.5 rounded-full" />
                AWS today
              </span>
              <span className="border-border-soft inline-flex items-center rounded-full border border-dashed px-2.5 py-1">
                More cloud providers coming
              </span>
            </p>

            <div className="text-muted-foreground mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[11px]">
              <span className="flex items-center gap-1.5">
                <Lock size={13} className="text-accent" />
                Read-only access
              </span>
              <span className="flex items-center gap-1.5">
                <Receipt size={13} className="text-accent" />
                Savings from your real bill
              </span>
              <span className="flex items-center gap-1.5">
                <BadgeCheck size={13} className="text-success" />
                Every fix verified, nothing auto-applied
              </span>
            </div>
          </div>

          <HeroReel />
        </div>
      </Container>
    </section>
  );
}
