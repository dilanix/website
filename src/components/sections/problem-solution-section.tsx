import { XCircle, CheckCircle2 } from "lucide-react";
import { Container } from "@/components/ui/container";

export function ProblemSolutionSection() {
  return (
    <section className="border-foreground/5 bg-foreground/[0.01] border-t py-24 sm:py-32">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-accent font-mono text-xs font-medium tracking-widest uppercase">
            The Paradigm Shift
          </span>
          <h2 className="text-foreground mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Why traditional FinOps fails modern engineering
          </h2>
          <p className="text-muted-foreground mt-4 text-base">
            Modern applications are distributed across multiple clouds,
            container clusters, and token-based LLM APIs. Spreadsheets and
            legacy tools simply can&apos;t keep up.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          {/* Problem Card */}
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.02] p-6 sm:p-8">
            <div className="flex items-center gap-2 font-mono text-xs font-semibold tracking-wider text-rose-500 uppercase">
              <XCircle size={16} />
              The Broken Status Quo
            </div>
            <h3 className="text-foreground mt-3 text-xl font-semibold">
              Month-end bill shock & manual guesswork
            </h3>
            <ul className="text-muted-foreground mt-6 space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 font-mono text-xs text-rose-500">
                  ✕
                </span>
                <span>
                  <strong className="text-foreground">Delayed Invoices:</strong>{" "}
                  You only discover cost spikes 30 days later when the cloud
                  invoice arrives.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 font-mono text-xs text-rose-500">
                  ✕
                </span>
                <span>
                  <strong className="text-foreground">
                    AI Token Blindspot:
                  </strong>{" "}
                  Zero attribution for which prompts, tenants, or features are
                  burning OpenAI/Anthropic budgets.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 font-mono text-xs text-rose-500">
                  ✕
                </span>
                <span>
                  <strong className="text-foreground">
                    Clunky 3-Month Setups:
                  </strong>{" "}
                  Heavy agent binaries that require intrusive root access to
                  production nodes.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 font-mono text-xs text-rose-500">
                  ✕
                </span>
                <span>
                  <strong className="text-foreground">
                    Ignored Recommendations:
                  </strong>{" "}
                  Massive CSVs with thousands of irrelevant suggestions that
                  developers never execute.
                </span>
              </li>
            </ul>
          </div>

          {/* Solution Card */}
          <div className="border-accent/30 bg-accent/[0.04] shadow-accent/5 rounded-2xl border p-6 shadow-lg sm:p-8">
            <div className="text-accent flex items-center gap-2 font-mono text-xs font-semibold tracking-wider uppercase">
              <CheckCircle2 size={16} />
              The Dilanix Approach
            </div>
            <h3 className="text-foreground mt-3 text-xl font-semibold">
              Continuous visibility & automated 1-click remediation
            </h3>
            <ul className="text-muted-foreground mt-6 space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <span className="text-success mt-0.5 shrink-0 font-mono text-xs">
                  ✓
                </span>
                <span>
                  <strong className="text-foreground">
                    Minute-Level Telemetry:
                  </strong>{" "}
                  Real-time anomaly radar catches runaway loops in under 60
                  seconds.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-success mt-0.5 shrink-0 font-mono text-xs">
                  ✓
                </span>
                <span>
                  <strong className="text-foreground">
                    Granular Token & Cache Tracking:
                  </strong>{" "}
                  Full visibility into prompt caching discounts, token volume,
                  and unit economics.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-success mt-0.5 shrink-0 font-mono text-xs">
                  ✓
                </span>
                <span>
                  <strong className="text-foreground">
                    2-Minute Zero-Agent Setup:
                  </strong>{" "}
                  100% read-only IAM & API keys. No daemons in your production
                  clusters.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-success mt-0.5 shrink-0 font-mono text-xs">
                  ✓
                </span>
                <span>
                  <strong className="text-foreground">
                    Ready-to-Merge Terraform PRs:
                  </strong>{" "}
                  Verified IaC diffs generated automatically for your team to
                  review and ship.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
