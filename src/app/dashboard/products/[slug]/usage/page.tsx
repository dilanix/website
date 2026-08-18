import type { Metadata } from "next";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { getProductBySlug } from "@/lib/data/products";
import { getUsageBreakdown } from "@/lib/data/dashboard";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: PageProps<"/dashboard/products/[slug]/usage">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return {
    title: `Usage — ${product?.shortName ?? product?.name ?? "Product"}`,
    robots: { index: false, follow: false },
  };
}

export default async function ProductUsagePage({
  params,
}: PageProps<"/dashboard/products/[slug]/usage">) {
  const { slug } = await params;
  const rows = await getUsageBreakdown(slug);

  if (!rows) {
    return (
      <p className="text-muted-foreground text-sm">
        This product&apos;s usage breakdown isn&apos;t connected yet.
      </p>
    );
  }

  const total = rows.reduce((sum, row) => sum + row.monthlySpendUsd, 0);

  return (
    <div className="border-foreground/10 overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead>
          <tr className="border-foreground/10 border-b">
            <th className="text-muted-foreground px-4 py-3 font-medium">
              Service
            </th>
            <th className="text-muted-foreground px-4 py-3 font-medium">
              Provider
            </th>
            <th className="text-muted-foreground px-4 py-3 text-right font-medium">
              Monthly spend
            </th>
            <th className="text-muted-foreground px-4 py-3 text-right font-medium">
              % of total
            </th>
            <th className="text-muted-foreground px-4 py-3 text-right font-medium">
              Trend
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const share = (row.monthlySpendUsd / total) * 100;
            const trendUp = row.trendPct > 0;
            const trendFlat = row.trendPct === 0;
            return (
              <tr
                key={row.id}
                className="border-foreground/5 border-b last:border-0"
              >
                <td className="text-foreground px-4 py-3">{row.service}</td>
                <td className="text-muted-foreground px-4 py-3">
                  {row.provider}
                </td>
                <td className="text-foreground px-4 py-3 text-right font-mono">
                  ${row.monthlySpendUsd.toLocaleString("en-US")}
                </td>
                <td className="text-muted-foreground px-4 py-3 text-right font-mono">
                  {share.toFixed(1)}%
                </td>
                <td className="px-4 py-3">
                  <div
                    className={cn(
                      "flex items-center justify-end gap-1 font-mono text-xs",
                      trendFlat
                        ? "text-muted-foreground"
                        : trendUp
                          ? "text-foreground"
                          : "text-success",
                    )}
                  >
                    {trendFlat ? (
                      <Minus size={13} />
                    ) : trendUp ? (
                      <TrendingUp size={13} />
                    ) : (
                      <TrendingDown size={13} />
                    )}
                    {Math.abs(row.trendPct).toFixed(1)}%
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
