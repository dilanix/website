"use client";
import { useState } from "react";
import Link from "next/link";
import { PageHeader, EmptyState } from "@/components/dashboard/primitives";
import { useCostOps } from "../costops-context";
import { formatCurrency } from "../utils";
import { getCostDateRange, isValidCostDateRange } from "../date-ranges";
import type { CostDatePreset, CostDateRange } from "../types";
import { COST_RANGE_OPTIONS } from "../config";
import { DateRangeFields, SegmentedControl } from "./filter-controls";
export function CostsView() {
  const api = useCostOps();
  const [integrationId, setIntegrationId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [service, setService] = useState("");
  const [region, setRegion] = useState("");
  const [range, setRange] = useState(api.snapshot.defaultCostRange);
  const [activePreset, setActivePreset] = useState<CostDatePreset | "custom">(
    "last_30_days",
  );
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
  async function applyFilters(nextRange: CostDateRange = range) {
    if (!isValidCostDateRange(nextRange)) {
      setError("Choose a valid start and end date.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const values = await api.queryCosts({
        start_date: nextRange.startDate,
        end_date: nextRange.endDate,
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
  function selectPreset(preset: CostDatePreset) {
    const nextRange = getCostDateRange(preset);
    setActivePreset(preset);
    setRange(nextRange);
    void applyFilters(nextRange);
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
          <div className="border-foreground/10 rounded-xl border p-4">
            <div className="flex flex-wrap items-end gap-2">
              <SegmentedControl
                label="Cost table range"
                value={activePreset}
                options={COST_RANGE_OPTIONS}
                disabled={loading}
                onChange={selectPreset}
              />
              <div className="ml-auto flex items-end gap-2">
                <DateRangeFields
                  startDate={range.startDate}
                  endDate={range.endDate}
                  onStartDateChange={(startDate) => {
                    setActivePreset("custom");
                    setRange({ ...range, startDate });
                  }}
                  onEndDateChange={(endDate) => {
                    setActivePreset("custom");
                    setRange({ ...range, endDate });
                  }}
                />
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
              type="button"
              onClick={() => applyFilters()}
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
