import type { Metadata } from "next";
import { getCompanyPage } from "@/lib/data/company";
import { getPhilosophyPrinciples } from "@/lib/data/philosophy";
import { getTechnologyCategories } from "@/lib/data/technology";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { PhilosophySection } from "@/components/sections/philosophy-section";
import { TechnologySection } from "@/components/sections/technology-section";

export const metadata: Metadata = {
  title: "Company",
};

export default async function CompanyPage() {
  const [company, principles, categories] = await Promise.all([
    getCompanyPage(),
    getPhilosophyPrinciples(),
    getTechnologyCategories(),
  ]);

  return (
    <>
      <section className="py-20 sm:py-28">
        <Container className="max-w-2xl text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {company.headline}
          </h1>
          <p className="text-muted-foreground mt-6 text-lg">{company.body}</p>
        </Container>
      </section>

      <PhilosophySection principles={principles} />
      <TechnologySection categories={categories} />

      <section className="border-foreground/5 border-t py-20 sm:py-28">
        <Container className="flex flex-col items-center gap-6 text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            See what we&apos;re building.
          </h2>
          <Button href="/products" variant="primary">
            Explore products
          </Button>
        </Container>
      </section>
    </>
  );
}
