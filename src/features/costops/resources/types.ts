export interface CloudResource {
  id: string;
  integrationId: string;
  provider: string;
  resourceType: string;
  externalId: string;
  name: string | null;
  region: string;
  availabilityZone: string | null;
  state: string | null;
  resourceClass: string | null;
  configuration: Record<string, unknown>;
  tags: Record<string, string>;
  firstSeenAt: string;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
}

export type ResourceSummary = {
  totalResources: number;
  computeResources: number;
  storageResources: number;
  resourcesWithRecommendations: number;
};

export type CloudResourcePage = {
  items: CloudResource[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
  summary: ResourceSummary;
};

export type FilterOption = { value: string; label: string; count: number };
export type CloudResourceFilterOptions = {
  providers: FilterOption[];
  resourceTypes: FilterOption[];
  regions: FilterOption[];
  states: FilterOption[];
};

export type ResourceSort =
  | "name"
  | "-name"
  | "external_id"
  | "-external_id"
  | "resource_class"
  | "-resource_class"
  | "region"
  | "-region"
  | "state"
  | "-state"
  | "last_seen_at"
  | "-last_seen_at";

export type ResourceQuery = {
  search?: string;
  provider?: string;
  resourceType?: string;
  region?: string;
  state?: string;
  integrationId?: string;
  page?: number;
  pageSize?: number;
  sort?: ResourceSort;
};
