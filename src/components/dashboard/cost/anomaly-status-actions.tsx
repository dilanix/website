"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Eye, RotateCcw } from "lucide-react";
import { updateAnomalyStatusAction } from "@/app/dashboard/products/cost-actions";
import type { AnomalyStatus, CoreAnomaly } from "@/lib/core/api";

const ACTIONS: Record<AnomalyStatus, AnomalyStatus[]> = {
  open: ["acknowledged", "resolved"],
  acknowledged: ["resolved", "open"],
  resolved: ["open"],
};

export function severityTone(severity: CoreAnomaly["severity"]) {
  return severity === "high" ? ("warning" as const) : ("neutral" as const);
}

export function statusTone(status: AnomalyStatus) {
  if (status === "resolved") return "success" as const;
  if (status === "open") return "warning" as const;
  return "neutral" as const;
}

/** Which connected account an anomaly belongs to, named from
 *  `costTargetLabels`. Anomalies recorded before per-account detection
 *  covered the whole organization. */
export function anomalyAccountLabel(
  anomaly: CoreAnomaly,
  accountLabels: Record<string, string>,
) {
  if (!anomaly.target_id) return "All accounts";
  return accountLabels[anomaly.target_id] ?? "Unavailable account";
}

/** Updates one anomaly's status through the server action. */
export function useAnomalyStatusUpdate(
  onUpdated: (anomaly: CoreAnomaly) => void,
) {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function update(anomaly: CoreAnomaly, status: AnomalyStatus) {
    setError("");
    startTransition(async () => {
      const result = await updateAnomalyStatusAction(anomaly.id, status);
      if (result.error) return setError(result.error);
      if (result.data) onUpdated(result.data);
    });
  }

  return { error, pending, update };
}

/** The status moves available from the anomaly's current status — any
 *  status can go to any other, so a resolved anomaly can be reopened. */
export function AnomalyStatusActions({
  anomaly,
  pending,
  onChange,
}: {
  anomaly: CoreAnomaly;
  pending: boolean;
  onChange: (status: AnomalyStatus) => void;
}) {
  return (
    <>
      {ACTIONS[anomaly.status].map((status) => (
        <button
          key={status}
          type="button"
          disabled={pending}
          onClick={() => onChange(status)}
          className={
            status === "resolved"
              ? "text-success inline-flex items-center gap-1 text-xs disabled:opacity-50"
              : "text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs disabled:opacity-50"
          }
        >
          {status === "resolved" ? (
            <>
              <CheckCircle2 size={13} /> Resolve
            </>
          ) : status === "acknowledged" ? (
            <>
              <Eye size={13} /> Acknowledge
            </>
          ) : (
            <>
              <RotateCcw size={13} /> Reopen
            </>
          )}
        </button>
      ))}
    </>
  );
}
