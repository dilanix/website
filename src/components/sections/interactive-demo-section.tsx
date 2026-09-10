import { ArrowRight, MousePointerClick, Play, ShieldCheck } from "lucide-react";
import type { ProductDashboardSnapshot } from "@/types";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { GuidedDashboardDemo } from "@/components/product/guided-dashboard-demo";
import { Reveal } from "@/components/common/reveal";

export function InteractiveDemoSection({
  productName,
  snapshot,
  calendlyUrl,
}: {
  productName: string;
  snapshot: ProductDashboardSnapshot;
  calendlyUrl: string;
}) {
  return (
    <section
      id="interactive-demo"
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
                Featured product · Guided tour
              </div>
              <h2 className="mt-5 max-w-3xl text-3xl leading-tight font-semibold tracking-[-0.04em] text-balance sm:text-5xl">
                See how we think about products.
                <span className="text-muted-foreground block">
                  Then explore the workspace yourself.
                </span>
              </h2>
              <p className="text-muted-foreground mt-5 max-w-2xl text-base leading-7 sm:text-lg">
                This interactive sample shows one Dilanix product in action:
                clear hierarchy, transparent data, and direct paths from signal
                to decision. No signup required.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Button
                href={calendlyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                Book a live demo
                <ArrowRight
                  size={15}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Button>
            </div>
          </div>
        </Reveal>

        <Reveal delayMs={100}>
          <GuidedDashboardDemo productName={productName} snapshot={snapshot} />
        </Reveal>

        <div className="text-muted-foreground mx-auto mt-6 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px]">
          <span className="flex items-center gap-1.5">
            <MousePointerClick size={13} className="text-accent" />
            Click any view to take control
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-success" />
            Clearly labeled sample data
          </span>
        </div>
      </Container>
    </section>
  );
}
