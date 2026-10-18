import type { ComponentType } from "react";
import { ApiOverviewPage } from "./developers";
import { ConceptsPage, QuickstartPage, WelcomePage } from "./getting-started";
import {
  ConnectAwsPage,
  InfrastructurePage,
  NotificationsPage,
  OrganizationPage,
  SyncPage,
} from "./platform";
import { CostPage, RecommendationsPage } from "./products";
import {
  ApplicationsPage,
  SendLogsPage,
  TelemetrySourcesPage,
} from "./telemetry";
import type { DocsPageProps } from "./types";

/** Page bodies by slug (`../registry.ts` holds titles and order). The API
 * reference is rendered by its own route, which fetches Core's OpenAPI. */
export const DOCS_PAGE_COMPONENTS: Record<
  string,
  ComponentType<DocsPageProps>
> = {
  welcome: WelcomePage,
  quickstart: QuickstartPage,
  concepts: ConceptsPage,
  "connect-aws": ConnectAwsPage,
  sync: SyncPage,
  infrastructure: InfrastructurePage,
  notifications: NotificationsPage,
  organization: OrganizationPage,
  cost: CostPage,
  recommendations: RecommendationsPage,
  applications: ApplicationsPage,
  "telemetry-sources": TelemetrySourcesPage,
  "send-logs": SendLogsPage,
  api: ApiOverviewPage,
};

export type { DocsPageProps };
