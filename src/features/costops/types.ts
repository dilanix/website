export type CostOpsProvider = "aws";
export type IntegrationStatus = "pending" | "connected" | "error" | "disabled";
export type SyncStatus = "pending" | "running" | "succeeded" | "failed";
export type OverviewPeriod =
  "current_month" | "last_7_days" | "last_30_days" | "last_90_days";
export type CostSeriesGroupBy = "day" | "week" | "month";
export type CostDatePreset =
  | "last_7_days"
  | "last_30_days"
  | "last_90_days"
  | "current_month"
  | "last_month";

export interface CostDateRange {
  startDate: string;
  endDate: string;
}

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
  cloudformationUrl: string | null;
  externalId: string | null;
  roleName: string | null;
  stackName: string | null;
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
  autoSyncIntervalMinutes: 60 | 360 | 720 | 1440 | null;
  nextSyncAt: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  accounts: CloudAccount[];
  setup?: IntegrationSetup;
}
export interface SyncRun {
  id: string;
  integrationId: string;
  status: SyncStatus;
  recordsProcessed: number;
  stage: string;
  progressCurrent: number;
  progressTotal: number;
  progressMessage: string | null;
  heartbeatAt: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  warningCount: number;
  warnings: {
    stage?: string;
    code?: string;
    message?: string;
    count?: number;
  }[];
  summary: Record<string, unknown>;
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
  costSeries: CostSeriesPoint[];
  defaultCostRange: CostDateRange;
  syncRuns: Record<string, SyncRun[]>;
}
export interface CostSeriesPoint extends MoneyValue {
  period: string;
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
