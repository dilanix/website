import type { CostOpsProvider } from "../types";
export type ProviderDefinition = {
  id: string;
  name: string;
  shortName: string;
  description: string;
  status: "available" | "coming_soon";
  provider?: CostOpsProvider;
};
export const COSTOPS_PROVIDERS: ProviderDefinition[] = [
  {
    id: "aws",
    provider: "aws",
    name: "Amazon Web Services",
    shortName: "AWS",
    description: "Analyze AWS billing and usage data with read-only access.",
    status: "available",
  },
  {
    id: "gcp",
    name: "Google Cloud",
    shortName: "GCP",
    description: "Connect Google Cloud billing exports.",
    status: "coming_soon",
  },
  {
    id: "azure",
    name: "Microsoft Azure",
    shortName: "AZ",
    description: "Connect Azure cost management data.",
    status: "coming_soon",
  },
];
export function getProvider(id: string) {
  return COSTOPS_PROVIDERS.find((provider) => provider.id === id);
}
