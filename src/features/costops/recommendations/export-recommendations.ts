import type { CostOpsRecommendation } from "./types";

function escapeCsvValue(value: unknown): string {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function formatConfiguration(
  configuration: Record<string, unknown>,
): string {
  return Object.entries(configuration)
    .map(([key, value]) => {
      if (value === null || value === undefined) {
        return `${key}: -`;
      }

      if (typeof value === "object") {
        return `${key}: ${JSON.stringify(value)}`;
      }

      return `${key}: ${String(value)}`;
    })
    .join("; ");
}

function formatCategory(
  category: CostOpsRecommendation["category"],
): string {
  return category
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(" ");
}

function formatRisk(
  risk: CostOpsRecommendation["risk_level"],
): string {
  return (
    risk.charAt(0).toUpperCase() +
    risk.slice(1)
  );
}

export function exportRecommendationsCsv(
  recommendations: CostOpsRecommendation[],
) {
  const headers = [
    "Name",
    "Category",
    "Current Configuration",
    "Recommended Configuration",
    "Savings $/month",
    "Risk",
  ];

  const rows = recommendations.map(
    (recommendation) => [
      recommendation.title,
      formatCategory(recommendation.category),
      formatConfiguration(
        recommendation.current_configuration,
      ),
      formatConfiguration(
        recommendation.recommended_configuration,
      ),
      recommendation.estimated_monthly_savings_usd.toFixed(
        2,
      ),
      formatRisk(recommendation.risk_level),
    ],
  );

  const csv = [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) =>
      row.map(escapeCsvValue).join(","),
    ),
  ].join("\r\n");

  const blob = new Blob(
    ["\uFEFF", csv],
    {
      type: "text/csv;charset=utf-8;",
    },
  );

  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = "costops-recommendations.csv";

  document.body.appendChild(anchor);

  anchor.click();

  anchor.remove();

  URL.revokeObjectURL(url);
}