import { Skeleton } from "@/components/dashboard/primitives";

export default function ResourceDetailLoading() {
  return (
    <div
      aria-label="Loading resource details"
      className="mx-auto w-full max-w-[90rem] space-y-6"
    >
      <Skeleton className="h-5 w-36" />
      <div className="border-border-soft overflow-hidden rounded-3xl border">
        <div className="space-y-5 p-6 sm:p-8 lg:p-10">
          <div className="flex items-start gap-5">
            <Skeleton className="h-16 w-16 shrink-0 rounded-2xl" />
            <div className="w-full max-w-2xl">
              <Skeleton className="h-3 w-52" />
              <Skeleton className="mt-3 h-9 w-full" />
              <Skeleton className="mt-3 h-4 w-4/5" />
            </div>
          </div>
        </div>
        <div className="border-border-soft grid gap-px border-t sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-none" />
          ))}
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(19rem,0.7fr)]">
        <Skeleton className="h-96" />
        <div className="space-y-6">
          <Skeleton className="h-72" />
          <Skeleton className="h-48" />
        </div>
      </div>
    </div>
  );
}
