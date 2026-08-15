"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import { buttonVariants } from "@/components/ui/button";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    // TODO: send to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <button onClick={() => retry()} className={buttonVariants("primary")}>
        Try again
      </button>
    </div>
  );
}
