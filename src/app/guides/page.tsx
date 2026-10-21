import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/data/site";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { GuideLibrary } from "@/components/guides/guide-library";

export const metadata: Metadata = {
  title: "Video guides",
  description:
    "Short animated walkthroughs of Dilanix — connecting AWS, how sync works, and every page of Cost and Infrastructure. No sign-in needed.",
  alternates: { canonical: "/guides" },
};

export default async function GuidesPage() {
  const settings = await getSiteSettings();

  return (
    <div className="home-atmosphere relative isolate flex flex-col overflow-hidden">
      <section className="relative pt-20 pb-12 sm:pt-28 sm:pb-16">
        <div className="from-accent/10 pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] via-transparent to-transparent" />
        <Container className="relative">
          <div className="mx-auto max-w-3xl text-center">
            <span className="border-accent/20 bg-card-strong/72 text-accent inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[10px] font-semibold tracking-[0.14em] uppercase">
              <span className="bg-accent size-1.5 rounded-full shadow-[0_0_9px_var(--accent)]" />
              Video guides
            </span>
            <h1 className="text-foreground mt-6 text-4xl font-semibold tracking-[-0.045em] text-balance sm:text-6xl">
              See how Dilanix works.
            </h1>
            <p className="text-muted-foreground mt-5 text-lg leading-relaxed text-balance">
              The same guides customers watch inside the product — from
              connecting AWS to reading your bill and tracing your
              infrastructure. Pause, step back, or jump to any scene.
            </p>
          </div>
        </Container>
      </section>

      <section className="pb-20 sm:pb-28">
        <Container className="max-w-7xl">
          <GuideLibrary />
        </Container>
      </section>

      <section className="border-foreground/10 bg-card-strong border-t py-20">
        <Container className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <h2 className="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">
            See it on your own account.
          </h2>
          <p className="text-muted-foreground mt-3 text-sm">
            Connect AWS read-only and get the same views with your own data.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button
              href={settings.calendlyUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="primary"
            >
              Book a demo
            </Button>
            <Button href="/products" variant="secondary">
              Explore products
            </Button>
          </div>
        </Container>
      </section>
    </div>
  );
}
