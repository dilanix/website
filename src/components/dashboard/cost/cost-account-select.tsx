"use client";

import { useMemo } from "react";
import type {
  CoreIntegrationConnection,
  CoreIntegrationTarget,
} from "@/lib/core/api";

/** The connected account a report or budget covers: one target, every
 *  target of one connection (`targetId` null), or every account (both null). */
export interface CostAccount {
  connectionId: string | null;
  targetId: string | null;
}

export const ALL_ACCOUNTS: CostAccount = { connectionId: null, targetId: null };

/** How a report/budget row names its account; `null` when the selection no
 *  longer matches a connection with billing.read. */
export function describeCostAccount(
  account: CostAccount,
  connections: CoreIntegrationConnection[],
  targets: CoreIntegrationTarget[],
): string | null {
  if (!account.connectionId) return "All accounts";
  const connection = connections.find(
    (item) => item.id === account.connectionId,
  );
  if (!connection) return null;
  if (!account.targetId) return `${connection.name} · all accounts`;
  const target = targets.find(
    (item) =>
      item.id === account.targetId && item.connection_id === connection.id,
  );
  return target
    ? `${connection.name} · ${target.display_name ?? target.external_id}`
    : null;
}

function toValue(account: CostAccount): string {
  if (account.targetId) return `target:${account.targetId}`;
  if (account.connectionId) return `connection:${account.connectionId}`;
  return "all";
}

/** One select over the same options as the page-level cost data scope
 *  picker, for a form that stores its own account. */
export function CostAccountSelect({
  connections,
  targets,
  value,
  onChange,
}: {
  connections: CoreIntegrationConnection[];
  targets: CoreIntegrationTarget[];
  value: CostAccount;
  onChange: (account: CostAccount) => void;
}) {
  const targetsByConnection = useMemo(() => {
    const result = new Map<string, CoreIntegrationTarget[]>();
    for (const target of targets) {
      const current = result.get(target.connection_id) ?? [];
      current.push(target);
      result.set(target.connection_id, current);
    }
    return result;
  }, [targets]);
  const unavailable = describeCostAccount(value, connections, targets) === null;

  function select(next: string) {
    if (next === "all") return onChange(ALL_ACCOUNTS);
    if (next.startsWith("connection:")) {
      return onChange({
        connectionId: next.slice("connection:".length),
        targetId: null,
      });
    }
    const target = targets.find(
      (item) => item.id === next.slice("target:".length),
    );
    if (target) {
      onChange({ connectionId: target.connection_id, targetId: target.id });
    }
  }

  return (
    <select
      aria-label="Account"
      value={unavailable ? "unavailable" : toValue(value)}
      onChange={(event) => select(event.target.value)}
      className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 text-sm outline-none"
    >
      {unavailable ? (
        <option value="unavailable" disabled>
          Unavailable account
        </option>
      ) : null}
      <option value="all">All accounts</option>
      {connections.map((connection) => (
        <optgroup key={connection.id} label={connection.name}>
          <option value={`connection:${connection.id}`}>
            All accounts · {connection.name}
          </option>
          {(targetsByConnection.get(connection.id) ?? []).map((target) => (
            <option key={target.id} value={`target:${target.id}`}>
              {target.display_name ?? target.external_id}
              {target.status === "disabled" ? " (historical)" : ""}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
