import type { PhilosophyPrinciple } from "@/types";

const principles: PhilosophyPrinciple[] = [
  {
    title: "Built for real problems",
    description:
      "We start with measurable problems instead of adding AI where it is not needed.",
    icon: "target",
  },
  {
    title: "Engineering first",
    description:
      "Reliability, security, performance, and maintainability are part of the product.",
    icon: "wrench",
  },
  {
    title: "AI where it matters",
    description:
      "AI should improve outcomes, not exist just as a marketing feature.",
    icon: "sparkles",
  },
  {
    title: "Measurable value",
    description:
      "Our products should save time, reduce costs, increase efficiency, or create measurable business value.",
    icon: "gauge",
  },
];

/** Stand-in for `GET /api/philosophy-principles`. */
export async function getPhilosophyPrinciples(): Promise<
  PhilosophyPrinciple[]
> {
  return principles;
}
