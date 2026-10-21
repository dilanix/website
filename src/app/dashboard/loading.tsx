import { Skeleton } from "@/components/dashboard/primitives";
export default function DashboardLoading() {
  return (
    <div aria-label="Loading dashboard" className="space-y-6 lg:space-y-8">
      <Skeleton className="h-[24rem] w-full rounded-[1.75rem] sm:h-80" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-[1.35rem]" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
        <Skeleton className="h-80 rounded-[1.4rem]" />
        <Skeleton className="h-80 rounded-[1.4rem]" />
      </div>
    </div>
  );
}
