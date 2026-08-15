"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";

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
      <button
        onClick={() => retry()}
        className="bg-foreground text-background hover:bg-foreground/80 rounded-full px-5 py-2 text-sm font-medium transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
