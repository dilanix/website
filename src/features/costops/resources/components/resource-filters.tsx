import { Search } from "lucide-react";
import type { CloudResourceFilterOptions } from "../types";
import type { CostOpsIntegration } from "../../types";

export type FilterValues = {
  search: string;
  provider: string;
  resourceType: string;
  region: string;
  state: string;
  integrationId: string;
};

export function ResourceFilters({
  values,
  options,
  integrations,
  onChange,
  disabled,
}: {
  values: FilterValues;
  options: CloudResourceFilterOptions;
  integrations: CostOpsIntegration[];
  onChange(next: FilterValues): void;
  disabled?: boolean;
}) {
  const select = (key: keyof FilterValues, value: string) =>
    onChange({ ...values, [key]: value });
  return (
    <div className="border-foreground/10 grid gap-3 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <label className="text-muted-foreground text-xs xl:col-span-1">
        Search
        <span className="relative mt-1 block">
          <Search
            className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
            size={14}
          />
          <input
            aria-label="Search resources"
            type="search"
            value={values.search}
            onChange={(e) => select("search", e.target.value)}
            placeholder="Name, ID, or class"
            className="border-foreground/10 bg-background text-foreground h-10 w-full rounded-lg border pr-3 pl-9 text-sm"
          />
        </span>
      </label>
      <FilterSelect
        label="Provider"
        all="All providers"
        value={values.provider}
        options={options.providers}
        onChange={(v) => select("provider", v)}
        disabled={disabled}
      />
      <FilterSelect
        label="Resource type"
        all="All types"
        value={values.resourceType}
        options={options.resourceTypes}
        onChange={(v) => select("resourceType", v)}
        disabled={disabled}
      />
      <FilterSelect
        label="Region"
        all="All regions"
        value={values.region}
        options={options.regions}
        onChange={(v) => select("region", v)}
        disabled={disabled}
      />
      <FilterSelect
        label="State"
        all="All states"
        value={values.state}
        options={options.states}
        onChange={(v) => select("state", v)}
        disabled={disabled}
      />
      <FilterSelect
        label="Integration"
        all="All integrations"
        value={values.integrationId}
        options={integrations.map((item) => ({
          value: item.id,
          label: item.externalAccountId
            ? `${item.name} · ${item.externalAccountId}`
            : item.name,
          count: 0,
        }))}
        onChange={(v) => select("integrationId", v)}
        disabled={disabled}
      />
    </div>
  );
}
function FilterSelect({
  label,
  all,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  all: string;
  value: string;
  options: { value: string; label: string; count: number }[];
  onChange(value: string): void;
  disabled?: boolean;
}) {
  return (
    <label className="text-muted-foreground text-xs">
      {label}
      <select
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="border-foreground/10 bg-background text-foreground mt-1 h-10 w-full rounded-lg border px-3 text-sm disabled:opacity-50"
      >
        <option value="">{all}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
            {option.count ? ` (${option.count})` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
