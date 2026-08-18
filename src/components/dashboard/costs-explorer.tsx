"use client";
import { useMemo, useState } from "react";
import { ArrowDownUp, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { costRows as CostRows } from "@/lib/data/dashboard-mocks";
import { cn } from "@/lib/utils";

type Row = (typeof CostRows)[number];
export function CostsExplorer({ rows }: { rows: Row[] }) {
  const [query, setQuery] = useState("");
  const visible = useMemo(
    () =>
      rows.filter((row) =>
        Object.values(row)
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [query, rows],
  );
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 lg:grid-cols-[1fr_repeat(4,auto)]">
        <label className="border-foreground/10 focus-within:border-accent flex min-w-0 items-center gap-2 rounded-lg border px-3">
          <Search size={15} className="text-muted-foreground" />
          <span className="sr-only">Search costs</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search services or accounts"
            className="placeholder:text-muted-foreground h-10 min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </label>
        {[
          ["Date range", "Last 30 days"],
          ["Provider", "All providers"],
          ["Service", "All services"],
          ["Environment", "All environments"],
        ].map(([label, value]) => (
          <label key={label} className="sr-only lg:not-sr-only">
            <span className="sr-only">{label}</span>
            <select
              aria-label={label}
              className="border-foreground/10 bg-background focus:border-accent h-10 rounded-lg border px-3 text-sm outline-none"
            >
              <option>{value}</option>
            </select>
          </label>
        ))}
      </div>
      <div className="border-foreground/10 overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-foreground/10 border-b">
              {[
                "Provider",
                "Service",
                "Account / Project",
                "Environment",
                "Cost",
                "Change",
              ].map((heading) => (
                <th
                  key={heading}
                  scope="col"
                  className={cn(
                    "text-muted-foreground px-4 py-3 font-medium",
                    ["Cost", "Change"].includes(heading) && "text-right",
                  )}
                >
                  <button className="hover:text-foreground inline-flex items-center gap-1">
                    {heading}
                    <ArrowDownUp size={11} />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr
                key={row.id}
                className="border-foreground/7 hover:bg-foreground/[0.02] border-b last:border-0"
              >
                <td className="px-4 py-3">{row.provider}</td>
                <td className="px-4 py-3 font-medium">{row.service}</td>
                <td className="text-muted-foreground px-4 py-3">
                  {row.account}
                </td>
                <td className="px-4 py-3">
                  <span className="border-foreground/10 rounded border px-1.5 py-0.5 font-mono text-xs">
                    {row.environment}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  ${row.cost.toLocaleString()}
                </td>
                <td
                  className={cn(
                    "px-4 py-3 text-right font-mono text-xs",
                    row.change < 0 ? "text-success" : "text-foreground",
                  )}
                >
                  {row.change > 0 ? "+" : ""}
                  {row.change}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-xs">
          Showing {visible.length} of {rows.length} services
        </p>
        <div className="flex items-center gap-1">
          <button
            disabled
            aria-label="Previous page"
            className="border-foreground/10 rounded-md border p-2 disabled:opacity-40"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="px-2 font-mono text-xs">1 / 1</span>
          <button
            disabled
            aria-label="Next page"
            className="border-foreground/10 rounded-md border p-2 disabled:opacity-40"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
