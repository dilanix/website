import { ArrowRight, MousePointerClick, Play, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { GuidedDashboardDemo } from "@/components/product/guided-dashboard-demo";
import { Reveal } from "@/components/common/reveal";

export function InteractiveDemoSection({
  calendlyUrl,
}: {
  calendlyUrl: string;
}) {
  return (
    <section
      id="demo"
      className="relative scroll-mt-20 pt-8 pb-24 sm:pt-12 sm:pb-32"
    >
      <div
        aria-hidden="true"
        className="from-accent/12 via-accent-secondary/8 pointer-events-none absolute inset-x-0 top-1/3 -z-10 h-[34rem] bg-gradient-to-r to-transparent blur-3xl"
      />
      <Container className="max-w-7xl">
        <Reveal>
          <div className="mx-auto mb-10 grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <div className="border-accent/15 bg-card-strong/70 text-accent inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-semibold tracking-[0.16em] uppercase shadow-sm backdrop-blur-sm">
                <Play size={11} fill="currentColor" />
                Product tour
              </div>
              <h2 className="mt-5 max-w-3xl text-3xl leading-tight font-semibold tracking-[-0.04em] text-balance sm:text-5xl">
                From the bill to the fix.
                <span className="text-muted-foreground block">
                  Click through the workspace.
                </span>
              </h2>
              <p className="text-muted-foreground mt-5 max-w-2xl text-base leading-7 sm:text-lg">
                Follow one story: spend you can explain, the savings worth
                making, what a change would affect, and data you know is fresh.
                It plays on its own — click any screen to take over.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Button
                href={calendlyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                See it on your own account
                <ArrowRight
                  size={15}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Button>
            </div>
          </div>
        </Reveal>

        <Reveal delayMs={100}>
          <GuidedDashboardDemo />
        </Reveal>

        <div className="text-muted-foreground mx-auto mt-6 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px]">
          <span className="flex items-center gap-1.5">
            <MousePointerClick size={13} className="text-accent" />
            Click screens, How to fix tabs, and graph nodes
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-success" />
            Sample data — no real account shown
          </span>
        </div>
      </Container>
    </section>
  );
}
