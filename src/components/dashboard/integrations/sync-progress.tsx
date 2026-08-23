import { Check, Loader2, X as XIcon } from "lucide-react";
import type {
  CoreConnectionSyncRun,
  ConnectionSyncStageStatus,
} from "@/lib/core/api";
import { cn } from "@/lib/utils";

/**
 * Real, backend-driven sync progress — every number here comes straight off
 * `CoreConnectionSyncRun` (derived server-side from its stages, see
 * `ConnectionSyncRunRead.from_model` in the backend). No frontend-generated
 * percentages or timers.
 */
export function SyncProgress({ syncRun }: { syncRun: CoreConnectionSyncRun }) {
  const percent =
    syncRun.total_stages > 0
      ? Math.round((syncRun.completed_stages / syncRun.total_stages) * 100)
      : syncRun.status === "succeeded"
        ? 100
        : 0;

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{percent}% complete</span>
        <span className="text-muted-foreground">
          {syncRun.total_stages > 0
            ? `${syncRun.completed_stages} of ${syncRun.total_stages} operations completed`
            : "Starting…"}
        </span>
      </div>
      <div className="bg-foreground/10 mt-2 h-2 w-full overflow-hidden rounded-full">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            syncRun.status === "failed" ? "bg-red-500" : "bg-accent",
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      {syncRun.status === "running" && syncRun.current_stage ? (
        <p className="text-muted-foreground mt-2 text-xs">
          Currently syncing: {syncRun.current_stage}
        </p>
      ) : null}

      {syncRun.stages.length ? (
        <ul className="border-foreground/10 mt-4 divide-y rounded-lg border">
          {syncRun.stages.map((stage) => (
            <li
              key={stage.id}
              className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
            >
              <div className="flex min-w-0 items-center gap-2">
                <StageStatusIcon status={stage.status} />
                <span className="truncate">{stage.label}</span>
              </div>
              <span className="text-muted-foreground shrink-0 text-xs">
                {stage.status === "succeeded" && stage.resource_count !== null
                  ? `${stage.resource_count} synced`
                  : stage.status === "failed"
                    ? (stage.error_message ?? "failed")
                    : stage.status}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function StageStatusIcon({ status }: { status: ConnectionSyncStageStatus }) {
  if (status === "succeeded") {
    return (
      <span className="bg-success/10 text-success flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
        <Check size={12} />
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-500">
        <XIcon size={12} />
      </span>
    );
  }
  if (status === "running") {
    return (
      <span className="bg-accent/10 text-accent flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
        <Loader2 size={12} className="animate-spin" />
      </span>
    );
  }
  return (
    <span className="bg-foreground/5 text-muted-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
    </span>
  );
}
