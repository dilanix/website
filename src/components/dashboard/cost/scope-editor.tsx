"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import type {
  CoreScopeCondition,
  ScopeDimension,
  ScopeOperator,
} from "@/lib/core/api";

export const SCOPE_DIMENSION_LABELS: Record<ScopeDimension, string> = {
  provider_name: "Provider",
  billing_account_id: "Billing account ID",
  sub_account_id: "Sub-account ID",
  service_category: "Service category",
  service_name: "Service",
  region_id: "Region",
  resource_id: "Resource ID",
  resource_type: "Resource type",
  charge_category: "Charge category",
  tag: "Tag",
};

const SCOPE_DIMENSIONS = Object.keys(
  SCOPE_DIMENSION_LABELS,
) as ScopeDimension[];

const OPERATOR_LABELS: Record<ScopeOperator, string> = {
  eq: "is",
  in: "is any of",
  not_in: "is none of",
};

interface ScopeRow {
  key: number;
  dimension: ScopeDimension;
  tagKey: string;
  operator: ScopeOperator;
  valueText: string;
}

let nextRowKey = 0;

function fromConditions(conditions: CoreScopeCondition[]): ScopeRow[] {
  return conditions.map((condition) => ({
    key: nextRowKey++,
    dimension: condition.dimension,
    tagKey: condition.tag_key ?? "",
    operator: condition.operator,
    valueText: Array.isArray(condition.value)
      ? condition.value.join(", ")
      : condition.value,
  }));
}

export function toScopeConditions(rows: ScopeRow[]): CoreScopeCondition[] {
  return rows.map((row) => {
    const value =
      row.operator === "eq"
        ? row.valueText.trim()
        : row.valueText
            .split(",")
            .map((part) => part.trim())
            .filter(Boolean);
    return {
      dimension: row.dimension,
      tag_key: row.dimension === "tag" ? row.tagKey.trim() : null,
      operator: row.operator,
      value,
    };
  });
}

/**
 * Editable list of `CoreScopeCondition` rows used by Budgets, Allocations,
 * Saved Views, and Reports to describe what slice of spend they apply to.
 * Uncontrolled after mount (seeded once from `initialValue`) — pair with a
 * `key` prop on the enclosing dialog to reset it when opening for a
 * different record.
 */
export function ScopeEditor({
  initialValue,
  onChange,
  disabled,
}: {
  initialValue: CoreScopeCondition[];
  onChange: (conditions: CoreScopeCondition[]) => void;
  disabled?: boolean;
}) {
  const [rows, setRows] = useState<ScopeRow[]>(() =>
    fromConditions(initialValue),
  );
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    onChangeRef.current(toScopeConditions(rows));
  }, [rows]);

  function updateRow(key: number, patch: Partial<ScopeRow>) {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  }

  function addRow() {
    setRows((current) => [
      ...current,
      {
        key: nextRowKey++,
        dimension: "provider_name",
        tagKey: "",
        operator: "eq",
        valueText: "",
      },
    ]);
  }

  function removeRow(key: number) {
    setRows((current) => current.filter((row) => row.key !== key));
  }

  return (
    <div className="space-y-2">
      {rows.length === 0 ? (
        <p className="text-muted-foreground text-xs">
          No scope set — applies to all spend.
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <div
              key={row.key}
              className="border-foreground/10 flex flex-wrap items-center gap-2 rounded-lg border p-2.5"
            >
              <select
                value={row.dimension}
                disabled={disabled}
                onChange={(event) =>
                  updateRow(row.key, {
                    dimension: event.target.value as ScopeDimension,
                  })
                }
                className="border-foreground/15 bg-background h-9 min-w-0 flex-1 rounded-md border px-2 text-xs outline-none"
              >
                {SCOPE_DIMENSIONS.map((dimension) => (
                  <option key={dimension} value={dimension}>
                    {SCOPE_DIMENSION_LABELS[dimension]}
                  </option>
                ))}
              </select>
              {row.dimension === "tag" ? (
                <input
                  value={row.tagKey}
                  disabled={disabled}
                  onChange={(event) =>
                    updateRow(row.key, { tagKey: event.target.value })
                  }
                  placeholder="Tag key"
                  className="border-foreground/15 bg-background h-9 w-28 shrink-0 rounded-md border px-2 font-mono text-xs outline-none"
                />
              ) : null}
              <select
                value={row.operator}
                disabled={disabled}
                onChange={(event) =>
                  updateRow(row.key, {
                    operator: event.target.value as ScopeOperator,
                  })
                }
                className="border-foreground/15 bg-background h-9 shrink-0 rounded-md border px-2 text-xs outline-none"
              >
                {(Object.keys(OPERATOR_LABELS) as ScopeOperator[]).map(
                  (operator) => (
                    <option key={operator} value={operator}>
                      {OPERATOR_LABELS[operator]}
                    </option>
                  ),
                )}
              </select>
              <input
                value={row.valueText}
                disabled={disabled}
                onChange={(event) =>
                  updateRow(row.key, { valueText: event.target.value })
                }
                placeholder={
                  row.operator === "eq" ? "value" : "value, value, …"
                }
                className="border-foreground/15 bg-background h-9 min-w-0 flex-[2] rounded-md border px-2 text-xs outline-none"
              />
              {!disabled ? (
                <button
                  type="button"
                  onClick={() => removeRow(row.key)}
                  aria-label="Remove condition"
                  className="text-muted-foreground hover:text-red-500 shrink-0 p-1"
                >
                  <X size={14} />
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}
      {!disabled ? (
        <button
          type="button"
          onClick={addRow}
          className="border-foreground/15 hover:bg-foreground/5 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium"
        >
          <Plus size={12} /> Add condition
        </button>
      ) : null}
    </div>
  );
}

export function summarizeScope(conditions: CoreScopeCondition[]): string {
  if (conditions.length === 0) return "All spend";
  return conditions
    .map((condition) => {
      const label =
        condition.dimension === "tag"
          ? `tag:${condition.tag_key ?? ""}`
          : SCOPE_DIMENSION_LABELS[condition.dimension];
      const value = Array.isArray(condition.value)
        ? condition.value.join(", ")
        : condition.value;
      return `${label} ${OPERATOR_LABELS[condition.operator]} ${value}`;
    })
    .join(" · ");
}
