import type { ComponentType } from "react";
import { INTEGRATIONS_GUIDE_KEY } from "@/lib/guides/definitions/integrations";
import { SYNC_GUIDE_KEY } from "@/lib/guides/definitions/sync";
import {
  AccessScene,
  AddConnectionScene,
  CloudFormationScene,
  ConnectionModelScene,
  IntroScene,
  MoreAccountsScene,
  NextSyncScene,
  ReadOnlyRoleScene,
  ScopesScene,
  StatusScene,
  VerifyScene,
} from "./integrations-scenes";
import {
  DatasetsScene,
  FirstSyncScene,
  HealthScene,
  OutcomeScene,
  RetriesScene,
  RunJobsScene,
  SafetyScene,
  SchedulesScene,
  SyncIntroScene,
  WatchScene,
} from "./sync-scenes";

/** Each guide's scene visuals, by scene id (`src/lib/guides`). */
export const GUIDE_VISUALS: Record<string, Record<string, ComponentType>> = {
  [INTEGRATIONS_GUIDE_KEY]: {
    intro: IntroScene,
    "connection-model": ConnectionModelScene,
    "add-connection": AddConnectionScene,
    "read-only-role": ReadOnlyRoleScene,
    cloudformation: CloudFormationScene,
    verify: VerifyScene,
    "more-accounts": MoreAccountsScene,
    access: AccessScene,
    scopes: ScopesScene,
    status: StatusScene,
    "next-sync": NextSyncScene,
  },
  [SYNC_GUIDE_KEY]: {
    intro: SyncIntroScene,
    datasets: DatasetsScene,
    "first-sync": FirstSyncScene,
    "run-jobs": RunJobsScene,
    schedules: SchedulesScene,
    retries: RetriesScene,
    safety: SafetyScene,
    health: HealthScene,
    watch: WatchScene,
    outcome: OutcomeScene,
  },
};
