"use client";
import { useState } from "react";
import Link from "next/link";
import { PageHeader, EmptyState } from "@/components/dashboard/primitives";
import { useCostOps } from "../costops-context";
import { formatCurrency } from "../utils";
export function CostsView() {
  const api = useCostOps();
  const [integrationId, setIntegrationId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [service, setService] = useState("");
  const [region, setRegion] = useState("");
  const connected = api.integrations.filter(
    (item) => item.status === "connected",
  );
  const [rows, setRows] = useState(api.costs);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const accounts = connected.flatMap((item) => item.accounts);
  const services = [...new Set(api.costs.map((row) => row.service))];
  const regions = [
    ...new Set(api.costs.map((row) => row.region).filter(Boolean)),
  ];
  async function applyFilters() {
    setLoading(true);
    setError("");
    const end = new Date();
    const start = new Date(end.getTime() - 30 * 86400000);
    try {
      const values = await api.queryCosts({
        start_date: start.toISOString().slice(0, 10),
        end_date: end.toISOString().slice(0, 10),
        integration_id: integrationId || undefined,
        cloud_account_id: accountId || undefined,
        service_name: service || undefined,
        region: region || undefined,
      });
      const names = new Map(accounts.map((item) => [item.id, item.name]));
      setRows(
        values.map((item) => ({
          ...item,
          accountName: names.get(item.accountId) ?? null,
        })),
      );
    } catch (value) {
      setError(
        value instanceof Error ? value.message : "Unable to load costs.",
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Costs"
        description="Analyze provider spending by account, service, and region."
      />
      {!api.integrations.length ? (
        <EmptyState
          title="Connect a provider first"
          description="Cost data becomes available after your first integration is connected and synchronized."
          actions={
            <Link
              href="/dashboard/costops/integrations"
              className="bg-accent text-accent-foreground rounded-lg px-4 py-2 text-sm"
            >
              Connect AWS
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <label className="text-muted-foreground text-xs">
              Date range
              <select className="border-foreground/10 bg-background text-foreground mt-1 h-10 w-full rounded-lg border px-3 text-sm">
                <option>Last 30 days</option>
              </select>
            </label>
            <Filter
              label="Integration"
              value={integrationId}
              set={setIntegrationId}
              options={connected.map((item) => [item.id, item.name])}
              all="All integrations"
            />
            <Filter
              label="Account"
              value={accountId}
              set={setAccountId}
              options={accounts.map((item) => [
                item.id,
                item.name ?? item.externalAccountId,
              ])}
              all="All accounts"
            />
            <Filter
              label="Service"
              value={service}
              set={setService}
              options={services.map((item) => [item, item])}
              all="All services"
            />
            <Filter
              label="Region"
              value={region}
              set={setRegion}
              options={regions.map((item) => [item, item])}
              all="All regions"
            />
            <button
              onClick={applyFilters}
              disabled={loading}
              className="bg-accent text-accent-foreground mt-auto h-10 rounded-lg px-4 text-sm font-medium disabled:opacity-50"
            >
              Apply filters
            </button>
          </div>
          {error ? (
            <EmptyState title="Unable to load costs" description={error} />
          ) : loading ? (
            <div className="border-foreground/10 bg-foreground/[0.03] h-52 animate-pulse rounded-xl border" />
          ) : rows.length ? (
            <div className="border-foreground/10 overflow-x-auto rounded-xl border">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-foreground/10 border-b">
                    {["Date", "Account", "Service", "Region", "Cost"].map(
                      (heading) => (
                        <th
                          key={heading}
                          className={`text-muted-foreground px-4 py-3 font-medium ${heading === "Cost" ? "text-right" : ""}`}
                        >
                          {heading}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-foreground/7 border-b last:border-0"
                    >
                      <td className="px-4 py-3">{row.date}</td>
                      <td className="px-4 py-3">
                        <span>{row.accountName ?? row.accountId}</span>
                      </td>
                      <td className="px-4 py-3">{row.service}</td>
                      <td className="text-muted-foreground px-4 py-3">
                        {row.region || "Global"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {formatCurrency(row)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No cost data found"
              description="CostOps did not find billing data for the selected period. Try choosing broader filters or syncing again."
            />
          )}
        </>
      )}
    </div>
  );
}
function Filter({
  label,
  value,
  set,
  options,
  all,
}: {
  label: string;
  value: string;
  set(value: string): void;
  options: string[][];
  all: string;
}) {
  return (
    <label className="text-muted-foreground text-xs">
      {label}
      <select
        value={value}
        onChange={(e) => set(e.target.value)}
        className="border-foreground/10 bg-background text-foreground mt-1 h-10 w-full rounded-lg border px-3 text-sm"
      >
        <option value="">{all}</option>
        {options.map(([id, name]) => (
          <option key={id} value={id}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
}
