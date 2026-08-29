"use client";

import { useEffect, useRef, useState } from "react";
import type { CoreSyncRunDetail } from "@/lib/core/api";

/** Consecutive connection-level errors tolerated before giving up — bounds
 * `EventSource`'s own indefinite auto-retry against a genuinely broken
 * stream (e.g. the connection/run no longer exists) instead of hammering the
 * proxy route forever. A transient blip recovers well within this. */
const MAX_CONSECUTIVE_ERRORS = 4;

export interface SyncRunEventsState {
  /** The stream gave up (run not found mid-stream, or too many consecutive
   * connection errors) — a caller should fall back to polling if it needs to
   * keep watching. */
  failed: boolean;
}

/**
 * Subscribes to Dilanix Core's live sync-progress stream through the
 * same-origin proxy at `/api/sync/[connectionId]/[syncRunId]/events`
 * (`src/app/api/sync/.../route.ts`) — the browser's `EventSource` never sees
 * the access token; the proxy attaches it server-side from the httpOnly
 * session cookie.
 *
 * Every `sync_run` frame (including the final one, sent just before `done`)
 * is handed to `onFrame` as soon as it arrives — call your own `setState`
 * from there to persist it. This deliberately does *not* hold the latest
 * frame in this hook's own state and hand it back for a caller to `useEffect`
 * into their state: a run that finishes while collapsed (or while this
 * stream has since been torn down because the run turned out to be
 * terminal) would leave that caller's state stuck on a stale early frame
 * forever, since nothing would ever push the final one again.
 *
 * Reconnects on a `stream_timeout` event (the server's own safety valve, not
 * an error) and stops for good once the run reaches a terminal status (a
 * `done` event) or the stream fails outright.
 */
export function useSyncRunEvents(
  connectionId: string,
  syncRunId: string | null,
  enabled: boolean,
  onFrame: (detail: CoreSyncRunDetail) => void,
): SyncRunEventsState {
  const [failed, setFailed] = useState(false);

  // Always call the latest `onFrame` without making it an effect dependency
  // — an inline arrow function passed by the caller gets a new identity every
  // render, and reconnecting the stream on every render would defeat the
  // point of it. Updated in its own effect (not during render, which React
  // refs must never be written to) — runs after every render, before the
  // connection effect below ever needs it.
  const onFrameRef = useRef(onFrame);
  useEffect(() => {
    onFrameRef.current = onFrame;
  });

  // "Adjusting state when a prop changes" (react.dev) — reset synchronously
  // during render, not in the effect below, whenever the stream we're
  // subscribed to changes. Bails out immediately once `connectedKey` catches
  // up, so this never loops.
  const connectionKey =
    enabled && syncRunId ? `${connectionId}:${syncRunId}` : null;
  const [connectedKey, setConnectedKey] = useState(connectionKey);
  if (connectionKey !== connectedKey) {
    setConnectedKey(connectionKey);
    setFailed(false);
  }

  useEffect(() => {
    if (!enabled || !syncRunId) return;

    let stopped = false;
    let source: EventSource | null = null;
    let consecutiveErrors = 0;

    function connect() {
      if (stopped) return;
      source = new EventSource(`/api/sync/${connectionId}/${syncRunId}/events`);

      source.addEventListener("sync_run", (event) => {
        consecutiveErrors = 0;
        try {
          const frame = JSON.parse(
            (event as MessageEvent<string>).data,
          ) as CoreSyncRunDetail;
          onFrameRef.current(frame);
        } catch {
          // A malformed frame — the next one still arrives on the same schedule.
        }
      });

      source.addEventListener("done", () => {
        stopped = true;
        source?.close();
      });

      source.addEventListener("stream_timeout", () => {
        source?.close();
        connect();
      });

      // The server's own named `event: error` (e.g. the run stopped existing
      // mid-stream) arrives as a `MessageEvent` carrying `.data`. The
      // browser's built-in connection-level error — dispatched under the
      // same "error" type for a dropped connection or non-2xx response — is
      // a plain `Event` with no `.data`, and is otherwise indistinguishable
      // from a transient network blip, so it's left to bounded retry below
      // instead of failing immediately.
      source.addEventListener("error", (event) => {
        if ("data" in event) {
          stopped = true;
          source?.close();
          setFailed(true);
          return;
        }
        consecutiveErrors += 1;
        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          stopped = true;
          source?.close();
          setFailed(true);
        }
      });
    }

    connect();
    return () => {
      stopped = true;
      source?.close();
    };
  }, [connectionId, syncRunId, enabled]);

  return { failed };
}
