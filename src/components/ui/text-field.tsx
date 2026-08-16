import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** e.g. a "Forgot password?" link rendered beside the label. */
  labelAction?: ReactNode;
}

export function TextField({
  label,
  labelAction,
  id,
  className,
  ...props
}: TextFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-foreground text-sm font-medium">
          {label}
        </label>
        {labelAction}
      </div>
      <input
        id={id}
        className={cn(
          "border-foreground/15 text-foreground placeholder:text-muted-foreground/50 focus-visible:border-accent focus-visible:ring-accent/30 w-full rounded-lg border bg-transparent px-4 py-3 text-sm transition-colors outline-none focus-visible:ring-2 disabled:opacity-50",
          className,
        )}
        {...props}
      />
    </div>
  );
}
