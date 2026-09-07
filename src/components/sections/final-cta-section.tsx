import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/common/reveal";

export function FinalCtaSection() {
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
              <h2 className="max-w-lg text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                See what we&apos;re building.
              </h2>
              <p className="text-muted-foreground max-w-md text-lg">
                Explore Dilanix products and the problems we&apos;re working to
                solve.
              </p>
              <Button href="/products" variant="primary" className="mt-2">
                Explore products
              </Button>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
