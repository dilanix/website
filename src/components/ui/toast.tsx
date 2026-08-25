"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastProps {
  message: string;
  variant?: "success" | "error";
  durationMs?: number;
  onDismiss: () => void;
}

export function Toast({
  message,
  variant = "success",
  durationMs = 5000,
  onDismiss,
}: ToastProps) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const dismissTimer = setTimeout(() => setLeaving(true), durationMs);
    return () => clearTimeout(dismissTimer);
  }, [durationMs]);

  useEffect(() => {
    if (!leaving) return;
    const removeTimer = setTimeout(onDismiss, 200);
    return () => clearTimeout(removeTimer);
  }, [leaving, onDismiss]);

  const Icon = variant === "success" ? CheckCircle2 : XCircle;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "border-foreground/10 bg-card-strong text-foreground animate-toast-in fixed right-6 bottom-6 z-50 flex max-w-sm items-start gap-2.5 rounded-lg border px-4 py-3 text-sm shadow-lg transition-all duration-200 ease-out",
        leaving && "translate-y-2 opacity-0",
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0",
          variant === "success" ? "text-success" : "text-red-500",
        )}
      />
      <span>{message}</span>
    </div>
  );
}
