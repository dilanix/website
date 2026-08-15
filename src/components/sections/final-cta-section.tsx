import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/common/reveal";

export function FinalCtaSection() {
  return (
    <section className="border-foreground/5 border-t py-24 sm:py-32">
      <Container>
        <Reveal>
          <div className="border-foreground/10 relative overflow-hidden rounded-2xl border px-6 py-16 text-center sm:px-12 sm:py-20">
            <div
              aria-hidden="true"
              className="absolute top-1/2 left-1/2 h-72 w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-[110px]"
              style={{ background: "var(--accent)" }}
            />
            <div className="relative flex flex-col items-center gap-6">
              <h2 className="max-w-lg text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                See what we&apos;re building.
              </h2>
              <p className="text-muted-foreground max-w-md text-lg">
                Explore Dilanix products and the problems we&apos;re working to
                solve.
              </p>
              <Button href="#products" variant="primary" className="mt-2">
                Explore products
              </Button>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
