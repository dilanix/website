import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center"
          ? "items-center text-center"
          : "items-start text-left",
        className,
      )}
    >
      {eyebrow ? (
        <span className="border-accent/15 bg-card-strong/75 text-accent inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.18em] uppercase shadow-[0_10px_24px_var(--shadow-card)]">
          {eyebrow}
        </span>
      ) : null}
      <h2 className="max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "text-muted-foreground max-w-xl text-base sm:text-lg",
            align === "center" && "mx-auto",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
