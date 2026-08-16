import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

export function TextareaField({
  label,
  id,
  className,
  ...props
}: TextareaFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-foreground text-sm font-medium">
        {label}
      </label>
      <textarea
        id={id}
        className={cn(
          "border-foreground/15 text-foreground placeholder:text-muted-foreground/50 focus-visible:border-accent focus-visible:ring-accent/30 resize-none rounded-lg border bg-transparent px-4 py-3 text-sm transition-colors outline-none focus-visible:ring-2 disabled:opacity-50",
          className,
        )}
        {...props}
      />
    </div>
  );
}
