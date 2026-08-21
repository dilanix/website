import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/data/site";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Privacy Policy — Dilanix",
  description:
    "Dilanix privacy policy and customer data isolation commitments.",
  alternates: { canonical: "/privacy" },
};

export default async function PrivacyPage() {
  const settings = await getSiteSettings();

  return (
    <div className="py-16 sm:py-24">
      <Container className="max-w-3xl">
        <h1 className="text-foreground text-3xl font-semibold tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-muted-foreground mt-2 font-mono text-xs">
          Last updated: August 2026
        </p>

        <div className="text-muted-foreground border-foreground/10 mt-8 space-y-6 border-t pt-8 text-sm leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-foreground text-base font-semibold">
              1. Our Core Privacy Commitment
            </h2>
            <p>
              Dilanix builds infrastructure intelligence software. We explicitly
              operate under a principle of zero unnecessary data collection. We
              never sell, monetize, or share your telemetry or operational data
              with third parties.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-foreground text-base font-semibold">
              2. Data We Collect & Data We Never Collect
            </h2>
            <p>
              When you connect cloud providers or AI services (such as AWS, GCP,
              Azure, or OpenAI), we only ingest billing and token consumption
              metadata: token counts, model names, execution timestamps, cost
              amounts, and resource identifiers.
            </p>
            <p>
              <strong>We explicitly never ingest or store:</strong> the text or
              audio contents of your AI prompts, customer LLM completions,
              database records, or application payload data.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-foreground text-base font-semibold">
              3. Security & Storage
            </h2>
            <p>
              All customer metadata is encrypted in transit using TLS 1.3 and at
              rest using AES-256 KMS encryption. Access to production databases
              is strictly restricted through least-privilege zero-trust access
              controls.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-foreground text-base font-semibold">
              4. Contact Us
            </h2>
            <p>
              If you have any questions regarding our privacy practices or wish
              to request data deletion, contact us at{" "}
              <a
                href={`mailto:${settings.email}`}
                className="text-foreground hover:text-accent font-medium underline"
              >
                {settings.email}
              </a>
              .
            </p>
          </section>
        </div>
      </Container>
    </div>
  );
}
