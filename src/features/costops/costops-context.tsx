"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  createIntegrationAction,
  disableIntegrationAction,
  getIntegrationAction,
  queryCostsAction,
  refreshCostOpsAction,
  triggerSyncAction,
  verifyIntegrationAction,
} from "@/app/dashboard/costops/actions";
import type { CostOpsIntegration, CostOpsSnapshot, SyncRun } from "./types";
type ContextValue = {
  organizationId: string;
  snapshot: CostOpsSnapshot;
  integrations: CostOpsIntegration[];
  activeSyncs: Record<string, SyncRun>;
  providers: CostOpsSnapshot["providers"];
  createIntegration(name: string): Promise<CostOpsIntegration>;
  loadIntegration(id: string): Promise<CostOpsIntegration>;
  verifyIntegration(id: string, roleArn: string): Promise<CostOpsIntegration>;
  syncNow(id: string): Promise<void>;
  disableIntegration(id: string): Promise<void>;
  queryCosts(
    query: Record<string, string | undefined>,
  ): Promise<CostOpsSnapshot["costs"]>;
  refresh(): Promise<void>;
  overview: CostOpsSnapshot["overview"];
  costs: CostOpsSnapshot["costs"];
};
const Context = createContext<ContextValue | null>(null);
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
      throw new Error(result.error ?? "Unable to create integration.");
    setSnapshot((value) => ({
      ...value,
      integrations: [...value.integrations, result.data!],
    }));
    return result.data;
  }
  async function verifyIntegration(id: string, roleArn: string) {
    const result = await verifyIntegrationAction(id, roleArn);
    if (result.error || !result.data)
      throw new Error(result.error ?? "Unable to verify integration.");
    await refresh();
    return result.data;
  }
  async function syncNow(id: string) {
    const result = await triggerSyncAction(id);
    if (result.error) throw new Error(result.error);
    await refresh();
  }
  async function disableIntegration(id: string) {
    const result = await disableIntegrationAction(id);
    if (result.error) throw new Error(result.error);
    await refresh();
  }
  async function queryCosts(query: Record<string, string | undefined>) {
    const result = await queryCostsAction(query);
    if (result.error) throw new Error(result.error);
    return result.data ?? [];
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
        createIntegration,
        loadIntegration,
        verifyIntegration,
        syncNow,
        disableIntegration,
        queryCosts,
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
