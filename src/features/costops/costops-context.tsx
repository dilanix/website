"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  createIntegrationAction,
  deleteIntegrationAction,
  disableIntegrationAction,
  getIntegrationAction,
  queryCostSeriesAction,
  queryCostsAction,
  queryOverviewAction,
  refreshCostOpsAction,
  triggerSyncAction,
  verifyIntegrationAction,
} from "@/app/dashboard/costops/actions";
import type {
  CostOpsIntegration,
  CostOpsSnapshot,
  CostSeriesGroupBy,
  CostSeriesPoint,
  OverviewPeriod,
  SyncRun,
} from "./types";
type ContextValue = {
  organizationId: string;
  snapshot: CostOpsSnapshot;
  integrations: CostOpsIntegration[];
  activeSyncs: Record<string, SyncRun>;
  syncStarting: ReadonlySet<string>;
  providers: CostOpsSnapshot["providers"];
  createIntegration(name: string): Promise<CostOpsIntegration>;
  loadIntegration(id: string): Promise<CostOpsIntegration>;
  verifyIntegration(
    id: string,
    awsAccountId: string,
  ): Promise<CostOpsIntegration>;
  syncNow(id: string): Promise<void>;
  disableIntegration(id: string): Promise<void>;
  deleteIntegration(id: string): Promise<void>;
  queryCosts(
    query: Record<string, string | undefined>,
  ): Promise<CostOpsSnapshot["costs"]>;
  queryCostSeries(query: {
    start_date?: string;
    end_date?: string;
    group_by: CostSeriesGroupBy;
    integration_id?: string;
    cloud_account_id?: string;
    service_name?: string;
    region?: string;
  }): Promise<CostSeriesPoint[]>;
  queryOverview(period: OverviewPeriod): Promise<CostOpsSnapshot["overview"]>;
  refresh(): Promise<void>;
  overview: CostOpsSnapshot["overview"];
  costs: CostOpsSnapshot["costs"];
};
const Context = createContext<ContextValue | null>(null);

export class CostOpsClientError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
  }
}
export function CostOpsProvider({
  organizationId,
  initialSnapshot,
  children,
}: {
  organizationId: string;
  initialSnapshot: CostOpsSnapshot;
  children: ReactNode;
}) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [syncStarting, setSyncStarting] = useState<Set<string>>(new Set());
  const syncStartingRef = useRef(new Set<string>());
  const activeSyncs = Object.fromEntries(
    Object.entries(snapshot.syncRuns).flatMap(([id, runs]) => {
      const active = runs.find(
        (run) => run.status === "pending" || run.status === "running",
      );
      return active ? [[id, active]] : [];
    }),
  );
  async function refresh() {
    const result = await refreshCostOpsAction();
    if (result.error) throw new Error(result.error);
    if (result.data) setSnapshot(result.data);
  }
  async function loadIntegration(id: string) {
    const result = await getIntegrationAction(id);
    if (result.error || !result.data)
      throw new Error(result.error ?? "Integration not found.");
    return result.data;
  }
  async function createIntegration(name: string) {
    const result = await createIntegrationAction(name);
    if (result.error || !result.data)
      throw new CostOpsClientError(
        result.error ?? "Unable to create integration.",
        result.status,
      );
    setSnapshot((value) => ({
      ...value,
      integrations: [...value.integrations, result.data!],
    }));
    return result.data;
  }
  async function verifyIntegration(id: string, awsAccountId: string) {
    const result = await verifyIntegrationAction(id, awsAccountId);
    if (result.error || !result.data)
      throw new CostOpsClientError(
        result.error ?? "Unable to verify integration.",
        result.status,
      );
    await refresh();
    return result.data;
  }
  async function syncNow(id: string) {
    // The ref closes the double-click gap before React can render the disabled
    // state. The state drives immediate visual feedback in every sync button.
    if (syncStartingRef.current.has(id)) return;
    syncStartingRef.current.add(id);
    setSyncStarting(new Set(syncStartingRef.current));

    let result: Awaited<ReturnType<typeof triggerSyncAction>>;
    try {
      result = await triggerSyncAction(id);
    } finally {
      syncStartingRef.current.delete(id);
      setSyncStarting(new Set(syncStartingRef.current));
    }
    if (result.error) throw new Error(result.error);
    await refresh();
  }
  async function disableIntegration(id: string) {
    const result = await disableIntegrationAction(id);
    if (result.error) throw new Error(result.error);
    await refresh();
  }
  async function deleteIntegration(id: string) {
    const result = await deleteIntegrationAction(id);
    if (result.error) throw new Error(result.error);
    await refresh();
  }
  async function queryCosts(query: Record<string, string | undefined>) {
    const result = await queryCostsAction(query);
    if (result.error) throw new Error(result.error);
    return result.data ?? [];
  }
  async function queryCostSeries(query: {
    start_date?: string;
    end_date?: string;
    group_by: CostSeriesGroupBy;
    integration_id?: string;
    cloud_account_id?: string;
    service_name?: string;
    region?: string;
  }) {
    const result = await queryCostSeriesAction(
      query,
      snapshot.overview.currentTotal.currency,
    );
    if (result.error) throw new Error(result.error);
    return result.data ?? [];
  }
  async function queryOverview(period: OverviewPeriod) {
    const result = await queryOverviewAction(
      period,
      snapshot.overview.currentTotal.currency,
    );
    if (result.error || !result.data)
      throw new Error(result.error ?? "Unable to load overview.");
    return result.data;
  }
  const polling = Object.keys(activeSyncs).length > 0;
  useEffect(() => {
    if (!polling) return;
    const timer = window.setInterval(() => {
      refresh().catch(() => undefined);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [polling]);
  return (
    <Context.Provider
      value={{
        organizationId,
        snapshot,
        integrations: snapshot.integrations,
        providers: snapshot.providers,
        activeSyncs,
        syncStarting,
        createIntegration,
        loadIntegration,
        verifyIntegration,
        syncNow,
        disableIntegration,
        deleteIntegration,
        queryCosts,
        queryCostSeries,
        queryOverview,
        refresh,
        overview: snapshot.overview,
        costs: snapshot.costs,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useCostOps() {
  const value = useContext(Context);
  if (!value) throw new Error("useCostOps must be used inside CostOpsProvider");
  return value;
}
