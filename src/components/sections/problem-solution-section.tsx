import { XCircle, CheckCircle2 } from "lucide-react";
import { Container } from "@/components/ui/container";

export function ProblemSolutionSection() {
  return (
    <section className="border-foreground/5 bg-foreground/[0.01] border-t py-24 sm:py-32">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-accent font-mono text-xs font-medium tracking-widest uppercase">
            Engineering Principles
          </span>
          <h2 className="text-foreground mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Why modern infrastructure requires focused tooling
          </h2>
          <p className="text-muted-foreground mt-4 text-base">
            Complex distributed environments, AI workloads, and mission-critical cloud deployments
            demand precision engineering without bloat.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          {/* Problem Card */}
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.02] p-6 sm:p-8">
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
                  <strong className="text-foreground">Over-engineered Platforms:</strong>{" "}
                  All-in-one platforms that attempt everything but solve no single problem well.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 font-mono text-xs text-rose-500">
                  ✕
                </span>
                <span>
                  <strong className="text-foreground">Heavy Runtime Overheads:</strong>{" "}
                  Intrusive daemons that consume excessive CPU and complicate compliance.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 font-mono text-xs text-rose-500">
                  ✕
                </span>
                <span>
                  <strong className="text-foreground">Vendor Lock-in:</strong>{" "}
                  Proprietary formats that make migrating or interoperating difficult.
                </span>
              </li>
            </ul>
          </div>

          {/* Solution Card */}
          <div className="border-accent/30 bg-accent/[0.04] shadow-accent/5 rounded-2xl border p-6 shadow-lg sm:p-8">
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
                  <strong className="text-foreground">Single-Purpose Excellence:</strong>{" "}
                  Each product is engineered around one specific, expensive infrastructure challenge.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-success mt-0.5 shrink-0 font-mono text-xs">
                  ✓
                </span>
                <span>
                  <strong className="text-foreground">Minimal Footprint:</strong>{" "}
                  Clean APIs, zero unnecessary dependencies, and fast execution.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-success mt-0.5 shrink-0 font-mono text-xs">
                  ✓
                </span>
                <span>
                  <strong className="text-foreground">Open Standards:</strong>{" "}
                  Built for compatibility with modern cloud primitives and developer workflows.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
