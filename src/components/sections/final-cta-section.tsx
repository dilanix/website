import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { ArrowRight, CalendarCheck, MousePointerClick } from "lucide-react";
import { Reveal } from "@/components/common/reveal";

export function FinalCtaSection({ calendlyUrl }: { calendlyUrl: string }) {
  return (
    <section className="relative pt-20 pb-24 sm:pt-24 sm:pb-32">
      <Container>
        <Reveal>
          <div className="border-accent/14 relative overflow-hidden rounded-[2rem] border bg-[linear-gradient(145deg,color-mix(in_oklab,var(--card-strong)_88%,var(--accent)_12%),color-mix(in_oklab,var(--surface)_78%,var(--accent-secondary)_22%))] px-6 py-16 text-center shadow-[0_28px_76px_var(--shadow-brand)] sm:px-12 sm:py-20">
            <div
              aria-hidden="true"
              className="absolute top-1/2 left-[35%] h-72 w-[36rem] -translate-y-1/2 rounded-full opacity-18 blur-[92px]"
              style={{ background: "var(--glow-blue)" }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-[10%] w-20 rotate-[16deg] bg-[linear-gradient(180deg,transparent_0%,rgba(255,255,255,0.16)_50%,transparent_100%)] opacity-28 blur-[1px]"
            />
            <div className="relative flex flex-col items-center gap-6">
              <span className="border-accent/20 bg-card-strong/55 text-accent inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-semibold tracking-[0.14em] uppercase backdrop-blur-sm">
                <CalendarCheck size={12} /> Focused conversation, no sales maze
              </span>
              <h2 className="max-w-3xl text-3xl font-semibold tracking-[-0.04em] text-balance sm:text-5xl">
                Which important problem should we solve together?
              </h2>
              <p className="text-muted-foreground max-w-xl text-lg leading-7">
                Explore the product portfolio, book a focused walkthrough, and
                discuss where purpose-built software can create measurable value
                for your team.
              </p>
              <div className="mt-2 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
                <Button
                  href={calendlyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="primary"
                  className="group justify-center px-6 py-3"
                >
                  Book a live demo
                  <ArrowRight
                    size={15}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </Button>
                <Button
                  href="#interactive-demo"
                  variant="secondary"
                  className="justify-center px-6 py-3"
                >
                  <MousePointerClick size={15} /> Try the demo
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
