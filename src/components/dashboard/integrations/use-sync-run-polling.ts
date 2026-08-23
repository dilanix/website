"use client";
import { useEffect, useState } from "react";
import type { CoreConnectionSyncRun } from "@/lib/core/api";
import { getConnectionSyncRunAction } from "@/app/dashboard/integrations/actions";

const POLL_INTERVAL_MS = 2000;

/**
 * Polls a sync run's real backend progress while it's `running`, stopping
 * automatically once it reaches a terminal state. This is the project's
 * existing pattern for long-running operations (no SSE/WebSocket
 * infrastructure exists here) — the backend stays the source of truth, this
 * just re-fetches it.
 */
export function useSyncRunPolling(
  connectionId: string,
  initialSyncRun: CoreConnectionSyncRun | null,
) {
  const [syncRun, setSyncRun] = useState(initialSyncRun);
  // Reset to a genuinely different (or cleared) run during render rather than in an effect —
  // this is React's documented "adjusting state when a prop changes" pattern. Guarding on the
  // id (not object identity) means this only fires when a *new* run actually starts.
  const [trackedRunId, setTrackedRunId] = useState(initialSyncRun?.id);
  if (initialSyncRun?.id !== trackedRunId) {
    setTrackedRunId(initialSyncRun?.id);
    setSyncRun(initialSyncRun);
  }

  useEffect(() => {
    if (!syncRun || syncRun.status !== "running") return;
    const connectionIdSnapshot = connectionId;
    const syncRunIdSnapshot = syncRun.id;
    let cancelled = false;

    const timer = setInterval(async () => {
      const result = await getConnectionSyncRunAction(
        connectionIdSnapshot,
        syncRunIdSnapshot,
      );
      if (!cancelled && result.data) setSyncRun(result.data);
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
    // `syncRun` itself is deliberately omitted: it changes every poll, and depending on it
    // would tear down and recreate the interval on every tick instead of just letting the
    // running interval keep polling. Only a genuinely new/finished run should restart it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionId, syncRun?.id, syncRun?.status]);

  return [syncRun, setSyncRun] as const;
}
