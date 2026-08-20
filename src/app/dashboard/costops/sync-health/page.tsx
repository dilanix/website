import type { Metadata } from "next";
import { SyncHealthView } from "@/features/costops/components/sync-health-view";
import { getSyncHealthAction } from "../actions";

export const metadata: Metadata = {
  title: "Sync Health — CostOps",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function SyncHealthPage() {
  const result = await getSyncHealthAction({});
  if (!result.data)
    throw new Error(result.error ?? "Unable to load sync health.");
  return <SyncHealthView initialHealth={result.data} />;
}
