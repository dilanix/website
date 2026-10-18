"use client";

import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="border-border-soft bg-dashboard-panel-strong/80 relative flex h-9 items-center rounded-xl border pr-8 pl-3 text-xs shadow-[0_8px_22px_var(--shadow-card)]">
      <span className="text-muted-foreground mr-2">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="text-foreground max-w-[14rem] appearance-none truncate bg-transparent font-medium outline-none"
        aria-label={label}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="text-muted-foreground pointer-events-none absolute right-2.5"
      />
    </label>
  );
}

/** Scope of the loaded graph: one integration target, optionally one region. */
export function GraphScopeBar({
  connections,
  targets,
  regions,
  selected,
  resolvedAt,
}: {
  connections: Option[];
  targets: Option[];
  regions: string[];
  selected: { connection: string; target: string; region: string | null };
  resolvedAt: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const navigate = (
    next: Partial<{ connection: string; target: string; region: string }>,
  ) => {
    const params = new URLSearchParams();
    const connection = next.connection ?? selected.connection;
    params.set("connection", connection);
    if (!next.connection) {
      params.set("target", next.target ?? selected.target);
      const region = next.region ?? selected.region ?? "";
      if (region) params.set("region", region);
    }
    router.push(`${pathname}?${params.toString()}` as Route);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        label="Connection"
        value={selected.connection}
        options={connections}
        onChange={(connection) => navigate({ connection })}
      />
      <Select
        label="Account"
        value={selected.target}
        options={targets}
        onChange={(target) => navigate({ target, region: "" })}
      />
      <Select
        label="Region"
        value={selected.region ?? ""}
        options={[
          { value: "", label: "All regions" },
          ...regions.map((region) => ({ value: region, label: region })),
        ]}
        onChange={(region) => navigate({ region })}
      />
      {resolvedAt ? (
        <span className="text-muted-foreground ml-auto text-[11px]">
          Relationships resolved{" "}
          {new Intl.DateTimeFormat("en", {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(new Date(resolvedAt))}
        </span>
      ) : null}
    </div>
  );
}
