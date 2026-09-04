import { Skeleton } from "./primitives";

export function CloudDataPageSkeleton() {
  return (
    <div aria-label="Loading cloud data" className="space-y-6">
      <div>
        <Skeleton className="h-7 w-36" />
        <Skeleton className="mt-3 h-4 w-full max-w-xl" />
      </div>
      <Skeleton className="h-24 w-full" />
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <div className="border-border-soft space-y-px overflow-hidden rounded-2xl border">
          <Skeleton className="h-11 w-full rounded-none" />
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-none" />
          ))}
        </div>
      </div>
    </div>
  );
}
