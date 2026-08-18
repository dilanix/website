"use client";
import { DashboardError } from "@/components/dashboard/primitives";
export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <DashboardError onRetry={reset} />;
}
