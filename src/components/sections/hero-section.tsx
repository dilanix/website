import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { HeroBackground } from "@/components/sections/hero-background";
import {
  ArrowRight,
  Boxes,
  CircleDollarSign,
  Cloud,
  DatabaseZap,
  Eye,
  ShieldCheck,
  Workflow,
} from "lucide-react";

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
              <span>
                Technology Intelligence &amp; Cost Management Platform
              </span>
            </div>

            <h1 className="text-foreground mt-7 max-w-3xl text-4xl leading-[1.02] font-semibold tracking-[-0.055em] text-balance sm:text-6xl lg:text-[4.4rem]">
              See the technology you run.
              <span className="from-accent via-accent to-accent-secondary mt-2 block bg-gradient-to-r bg-clip-text text-transparent">
                Control what it costs.
              </span>
            </h1>

            <p className="text-muted-foreground mt-7 max-w-2xl text-lg leading-relaxed text-balance sm:text-xl">
              Dilanix connects infrastructure context, resource intelligence,
              and technology spend in one operating view—so engineering and
              finance can understand, optimize, and govern technology together.
            </p>

            <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Button
                href={calendlyUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="primary"
                className="group w-full justify-center px-6 py-3 text-base sm:w-auto"
              >
                Book a platform demo
                <ArrowRight
                  size={16}
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </Button>
              <Button
                href="#platform"
                variant="secondary"
                className="group w-full justify-center px-6 py-3 text-base sm:w-auto"
              >
                Explore the platform
                <ArrowRight
                  size={15}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Button>
            </div>

            <div className="text-muted-foreground mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[11px]">
              <span className="flex items-center gap-1.5">
                <DatabaseZap size={13} className="text-accent" />
                Unified technology context
              </span>
              <span className="flex items-center gap-1.5">
                <Eye size={13} className="text-accent" />
                Transparent cost data
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-success" />
                Governed action
              </span>
            </div>
          </div>

          <div className="border-border-soft bg-card-strong/72 relative mx-auto w-full max-w-xl overflow-hidden rounded-[1.75rem] border p-5 shadow-[0_28px_80px_var(--shadow-brand)] backdrop-blur-xl sm:p-6">
            <div
              aria-hidden="true"
              className="bg-accent/12 pointer-events-none absolute -top-24 -right-20 size-64 rounded-full blur-[80px]"
            />
            <div className="border-border-soft/70 flex items-center justify-between border-b pb-4">
              <div>
                <p className="text-muted-foreground text-[9px] font-semibold tracking-[0.16em] uppercase">
                  Dilanix platform
                </p>
                <p className="mt-1 text-sm font-semibold">
                  Technology context + cost data
                </p>
              </div>
              <span className="border-success/20 bg-success/8 text-success rounded-full border px-2.5 py-1 text-[9px] font-semibold tracking-wide uppercase">
                Connected
              </span>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              {[
                { icon: Cloud, label: "Technology sources" },
                { icon: Boxes, label: "Resources" },
                { icon: CircleDollarSign, label: "Cost data" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="border-border-soft bg-surface/65 rounded-xl border p-3 text-center"
                >
                  <Icon className="text-accent mx-auto" size={15} />
                  <p className="text-muted-foreground mt-2 text-[10px] leading-4">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            <div className="relative my-4 flex justify-center">
              <div className="bg-border-soft absolute top-1/2 h-px w-3/4" />
              <span className="border-accent/20 bg-card-strong text-accent relative flex size-9 items-center justify-center rounded-full border shadow-sm">
                <Workflow size={15} />
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="border-accent/18 bg-accent/7 rounded-2xl border p-4">
                <div className="flex items-center gap-2">
                  <Eye className="text-accent" size={16} />
                  <h2 className="text-sm font-semibold">
                    Technology Intelligence
                  </h2>
                </div>
                <p className="text-muted-foreground mt-2 text-[11px] leading-5">
                  Inventory, application context, utilization, and ownership.
                </p>
              </div>
              <div className="border-success/18 bg-success/7 rounded-2xl border p-4">
                <div className="flex items-center gap-2">
                  <CircleDollarSign className="text-success" size={16} />
                  <h2 className="text-sm font-semibold">Cost Management</h2>
                </div>
                <p className="text-muted-foreground mt-2 text-[11px] leading-5">
                  Spend, allocation, anomalies, budgets, and optimization.
                </p>
              </div>
            </div>

            <div className="border-border-soft bg-foreground/[0.025] text-muted-foreground mt-3 flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-[10px] font-medium">
              Understand <ArrowRight size={11} /> Prioritize
              <ArrowRight size={11} /> Optimize <ArrowRight size={11} /> Govern
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
