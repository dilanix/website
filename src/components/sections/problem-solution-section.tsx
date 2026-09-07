import { XCircle, CheckCircle2 } from "lucide-react";
import { Container } from "@/components/ui/container";

export function ProblemSolutionSection() {
  return (
    <section className="relative py-24 sm:py-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-28 -bottom-28 -z-10 bg-[linear-gradient(180deg,transparent_0%,color-mix(in_oklab,var(--accent-secondary)_8%,var(--background))_25%,color-mix(in_oklab,var(--accent)_7%,var(--background))_75%,transparent_100%)]"
      />
      <div
        aria-hidden="true"
        className="bg-accent-secondary/16 pointer-events-none absolute top-1/2 left-1/2 -z-10 h-80 w-[54rem] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full blur-[110px]"
      />
      <Container className="relative">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-accent font-mono text-xs font-medium tracking-widest uppercase">
            Engineering Principles
          </span>
          <h2 className="text-foreground mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Why modern infrastructure requires focused tooling
          </h2>
          <p className="text-muted-foreground mt-4 text-base">
            Complex distributed environments, AI workloads, and mission-critical
            cloud deployments demand precision engineering without bloat.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          {/* Problem Card */}
          <div className="bg-card-strong/82 rounded-[1.6rem] border border-rose-500/14 p-6 shadow-[0_22px_54px_var(--shadow-card)] backdrop-blur-xl sm:p-8">
            <div className="flex items-center gap-2 font-mono text-xs font-semibold tracking-wider text-rose-500 uppercase">
              <XCircle size={16} />
              The Monolithic Status Quo
            </div>
            <h3 className="text-foreground mt-3 text-xl font-semibold">
              Bloated suites & maintenance overhead
            </h3>
            <ul className="text-muted-foreground mt-6 space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 font-mono text-xs text-rose-500">
                  ✕
                </span>
                <span>
                  <strong className="text-foreground">
                    Over-engineered Platforms:
                  </strong>{" "}
                  All-in-one platforms that attempt everything but solve no
                  single problem well.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 font-mono text-xs text-rose-500">
                  ✕
                </span>
                <span>
                  <strong className="text-foreground">
                    Heavy Runtime Overheads:
                  </strong>{" "}
                  Intrusive daemons that consume excessive CPU and complicate
                  compliance.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 font-mono text-xs text-rose-500">
                  ✕
                </span>
                <span>
                  <strong className="text-foreground">Vendor Lock-in:</strong>{" "}
                  Proprietary formats that make migrating or interoperating
                  difficult.
                </span>
              </li>
            </ul>
          </div>

          {/* Solution Card */}
          <div className="border-accent/18 rounded-[1.6rem] border bg-[linear-gradient(145deg,color-mix(in_oklab,var(--card-strong)_82%,var(--accent)_18%),color-mix(in_oklab,var(--surface)_76%,var(--accent-secondary)_24%))] p-6 shadow-[0_20px_50px_var(--shadow-brand)] backdrop-blur-sm sm:p-8">
            <div className="text-accent flex items-center gap-2 font-mono text-xs font-semibold tracking-wider uppercase">
              <CheckCircle2 size={16} />
              The Dilanix Architecture
            </div>
            <h3 className="text-foreground mt-3 text-xl font-semibold">
              Independent, high-leverage products
            </h3>
            <ul className="text-muted-foreground mt-6 space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <span className="text-success mt-0.5 shrink-0 font-mono text-xs">
                  ✓
                </span>
                <span>
                  <strong className="text-foreground">
                    Single-Purpose Excellence:
                  </strong>{" "}
                  Each product is engineered around one specific, expensive
                  infrastructure challenge.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-success mt-0.5 shrink-0 font-mono text-xs">
                  ✓
                </span>
                <span>
                  <strong className="text-foreground">
                    Minimal Footprint:
                  </strong>{" "}
                  Clean APIs, zero unnecessary dependencies, and fast execution.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-success mt-0.5 shrink-0 font-mono text-xs">
                  ✓
                </span>
                <span>
                  <strong className="text-foreground">Open Standards:</strong>{" "}
                  Built for compatibility with modern cloud primitives and
                  developer workflows.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
