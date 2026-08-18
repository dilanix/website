export type CostOpsProvider = "aws";
export type IntegrationStatus = "pending" | "connected" | "error" | "disabled";
export type SyncStatus = "pending" | "running" | "succeeded" | "failed";

export interface CostOpsProviderCatalogItem {
  slug: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  isAvailable: boolean;
}

export interface CloudAccount {
  id: string;
  externalAccountId: string;
  name: string | null;
  isManagement: boolean;
}
export interface IntegrationSetup {
  cloudformationSupported: boolean;
  dilanixAwsAccountId: string | null;
  principal: string | null;
  cloudformationTemplate: string | null;
}
export interface CostOpsIntegration {
  id: string;
  organizationId: string;
  provider: CostOpsProvider;
  name: string;
  status: IntegrationStatus;
  externalAccountId: string | null;
  roleArn: string | null;
  createdAt: string;
  lastSyncedAt: string | null;
  lastSyncStatus: SyncStatus | null;
  errorCode: string | null;
  errorMessage: string | null;
  accounts: CloudAccount[];
  externalId: string | null;
  setup?: IntegrationSetup;
}
export interface SyncRun {
  id: string;
  integrationId: string;
  status: SyncStatus;
  recordsProcessed: number;
  errorCode: string | null;
  errorMessage: string | null;
}
export interface MoneyValue {
  amount: string;
  currency: string | null;
}
export interface OverviewPoint extends MoneyValue {
  date: string;
}
export interface ServiceSpend extends MoneyValue {
  service: string;
}
export interface CostOpsOverview {
  currentTotal: MoneyValue;
  previousTotal: MoneyValue;
  changePercent: string | null;
  daily: OverviewPoint[];
  topServices: ServiceSpend[];
  integrationCount: number;
  lastSyncedAt: string | null;
}
export interface CostOpsSnapshot {
  providers: CostOpsProviderCatalogItem[];
  integrations: CostOpsIntegration[];
  overview: CostOpsOverview;
  costs: CostRecord[];
  syncRuns: Record<string, SyncRun[]>;
}
export interface CostRecord extends MoneyValue {
  id: string;
  date: string;
  integrationId: string;
  accountId: string;
  accountName: string | null;
  service: string;
  region: string;
}
