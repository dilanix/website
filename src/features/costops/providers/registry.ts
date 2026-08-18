import type { CostOpsProviderCatalogItem } from "../types";

/** UI metadata is backend-owned; this module only supplies presentation helpers. */
export function getProvider(
  providers: CostOpsProviderCatalogItem[],
  slug: string,
) {
  return providers.find((provider) => provider.slug === slug);
}

export function getProviderShortName(provider: CostOpsProviderCatalogItem) {
  if (provider.slug.toLowerCase() === "aws") return "AWS";
  return provider.name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}
