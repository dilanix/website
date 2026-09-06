import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function ResourceNotFound() {
  return (
    <div className="border-border-soft bg-card-strong/70 mx-auto flex min-h-[30rem] w-full max-w-3xl flex-col items-center justify-center rounded-3xl border border-dashed px-6 py-12 text-center shadow-[0_24px_70px_var(--shadow-card)]">
      <span className="bg-foreground/5 text-muted-foreground flex h-14 w-14 items-center justify-center rounded-2xl">
        <SearchX size={23} />
      </span>
      <h1 className="mt-5 text-xl font-semibold tracking-tight">
        Resource not found
      </h1>
      <p className="text-muted-foreground mt-2 max-w-md text-sm leading-6">
        It may have moved to another connection, fallen outside the current
        inventory scope, or been removed.
      </p>
      <Link
        href="/dashboard/resources"
        className="bg-accent text-accent-foreground mt-6 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium shadow-[0_12px_30px_var(--shadow-brand)]"
      >
        <ArrowLeft size={15} />
        Back to resources
      </Link>
    </div>
  );
}
