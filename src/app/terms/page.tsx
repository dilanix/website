import type { Metadata } from "next";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Terms of Service — Dilanix",
  description:
    "Terms and conditions for using Dilanix software products and services.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <div className="py-16 sm:py-24">
      <Container className="max-w-3xl">
        <h1 className="text-foreground text-3xl font-semibold tracking-tight">
          Terms of Service
        </h1>
        <p className="text-muted-foreground mt-2 font-mono text-xs">
          Last updated: August 2026
        </p>

        <div className="text-muted-foreground border-foreground/10 mt-8 space-y-6 border-t pt-8 text-sm leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-foreground text-base font-semibold">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using Dilanix software, services, or APIs, you
              agree to be bound by these Terms of Service. If you are entering
              into this agreement on behalf of an entity, you represent that
              you have the authority to bind such entity.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-foreground text-base font-semibold">
              2. Use of Services & Account Responsibility
            </h2>
            <p>
              You are responsible for maintaining the confidentiality of your
              API keys and account credentials. You agree to use the service in
              compliance with all applicable cloud provider terms and local
              laws.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-foreground text-base font-semibold">
              3. Service Level & Availability
            </h2>
            <p>
              We strive to maintain high availability (99.99% target uptime) for
              our ingestion pipelines and dashboards. Planned maintenance
              windows are communicated in advance via our status portal.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-foreground text-base font-semibold">
              4. Intellectual Property & Customer Telemetry
            </h2>
            <p>
              You retain all rights, title, and ownership in your infrastructure
              configurations, accounts, and telemetry data. Dilanix retains all
              rights in its software, algorithms, heuristics, and user
              interfaces.
            </p>
          </section>
        </div>
      </Container>
    </div>
  );
}
