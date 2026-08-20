import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMe } from "@/lib/auth/api";
import { getAccessToken } from "@/lib/auth/session";
import { AnalysisPoliciesView } from "@/features/costops/policies/analysis-policies-view";
import { listAnalysisPoliciesAction } from "../actions";

export const metadata: Metadata = {
  title: "Analysis Policies — CostOps",
  robots: { index: false, follow: false },
};

export default async function AnalysisPoliciesPage() {
  const token = await getAccessToken();
  if (!token) notFound();
  const me = await getMe(token);
  if (!me.is_superuser) notFound();
  const result = await listAnalysisPoliciesAction();
  if (!result.data)
    throw new Error(result.error ?? "Unable to load analysis policies.");
  return <AnalysisPoliciesView initialPolicies={result.data} />;
}
