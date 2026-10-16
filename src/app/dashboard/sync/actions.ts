"use server";

import { getMe } from "@/lib/auth/api";
import { getAccessToken } from "@/lib/auth/session";
import { getSyncHealth, listConnections, listSyncRuns } from "@/lib/core/api";
import {
  combinedSyncState,
  connectionSyncState,
  type SyncState,
} from "@/lib/sync/overview";

/** The menu indicator: whether any connection is syncing or failing. `null`
 * when it can't be read — the menu then shows no indicator. */
export async function getSyncIndicatorAction(): Promise<SyncState | null> {
  try {
    const token = await getAccessToken();
    if (!token) return null;
    const me = await getMe(token);
    const organizationId = me.organizations[0]?.organization_id;
    if (!organizationId) return null;
    const connections = (await listConnections(organizationId, token)).filter(
      (connection) => connection.status === "connected",
    );
    const states = await Promise.all(
      connections.map(async (connection) => {
        const [runs, health] = await Promise.all([
          listSyncRuns(organizationId, connection.id, token, {
            limit: 1,
            offset: 0,
          }),
          getSyncHealth(organizationId, connection.id, token),
        ]);
        return connectionSyncState(runs.items, health.items);
      }),
    );
    return combinedSyncState(states);
  } catch {
    return null;
  }
}
