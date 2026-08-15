import type { CompanyPage } from "@/types";

const companyPage: CompanyPage = {
  headline: "Building useful software, one product at a time.",
  body: "Dilanix is a software company focused on building practical technology products with long-term value. We explore difficult problems, build focused solutions, and continuously improve them through real-world usage.",
  ctaLabel: "Learn about Dilanix",
  ctaHref: "/company",
};

// TODO: replace with `fetch(`${env.NEXT_PUBLIC_API_URL}/company-page`)` once the backend ships.
export async function getCompanyPage(): Promise<CompanyPage> {
  return companyPage;
}
