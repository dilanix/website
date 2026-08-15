import type { TechnologyCategory } from "@/types";

const categories: TechnologyCategory[] = [
  {
    label: "Artificial Intelligence",
    description: "Applied AI and machine learning, not novelty features.",
    icon: "ai",
  },
  {
    label: "Cloud Infrastructure",
    description: "Systems built to scale reliably and fail predictably.",
    icon: "cloud",
  },
  {
    label: "Data",
    description: "Pipelines and models that turn data into decisions.",
    icon: "data",
  },
  {
    label: "Automation",
    description: "Removing manual work from engineering and operations.",
    icon: "automation",
  },
  {
    label: "Developer Tools",
    description: "Software that makes engineering teams faster.",
    icon: "developer-tools",
  },
];

/** Stand-in for `GET /api/technology-categories`. */
export async function getTechnologyCategories(): Promise<TechnologyCategory[]> {
  return categories;
}
