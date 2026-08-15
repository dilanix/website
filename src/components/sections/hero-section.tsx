import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { HeroBackground } from "@/components/sections/hero-background";

export function HeroSection() {
  return (
    <section className="relative">
      <HeroBackground />
      <Container className="relative flex flex-col items-center gap-6 pt-24 pb-20 text-center sm:pt-32 sm:pb-28">
        <h1 className="max-w-2xl text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl">
          Software for problems worth solving.
        </h1>
        <p className="text-muted-foreground max-w-lg text-lg text-balance">
          Dilanix builds intelligent software for engineering teams and modern
          businesses — combining AI, infrastructure, automation, and thoughtful
          product design.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Button href="#products" variant="primary">
            Explore products
          </Button>
          <Button href="#company" variant="secondary">
            About Dilanix
          </Button>
        </div>
      </Container>
    </section>
  );
}
