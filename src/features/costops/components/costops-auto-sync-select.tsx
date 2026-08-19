export type AutoSyncIntervalMinutes = 60 | 360 | 720 | 1440 | null;

export const AUTO_SYNC_OPTIONS: readonly {
  value: AutoSyncIntervalMinutes;
  label: string;
}[] = [
  { value: null, label: "Auto-sync: Off" },
  { value: 60, label: "Auto-sync: Every 1 hour" },
  { value: 360, label: "Auto-sync: Every 6 hours" },
  { value: 720, label: "Auto-sync: Every 12 hours" },
  { value: 1440, label: "Auto-sync: Every 24 hours" },
];

export function CostOpsAutoSyncSelect({
  value,
  disabled,
  onChange,
  compact = false,
}: {
  value: AutoSyncIntervalMinutes;
  disabled?: boolean;
  onChange(value: AutoSyncIntervalMinutes): void;
  compact?: boolean;
}) {
  return (
    <select
      aria-label="Auto-sync interval"
      value={value ?? "off"}
      disabled={disabled}
      onChange={(event) =>
        onChange(
          event.target.value === "off"
            ? null
            : (Number(event.target.value) as Exclude<
                AutoSyncIntervalMinutes,
                null
              >),
        )
      }
      className={`border-foreground/15 bg-background text-foreground hover:border-accent/50 rounded-lg border px-3 text-xs font-medium disabled:opacity-50 ${compact ? "h-9 max-w-52" : "h-10 w-full"}`}
    >
      {AUTO_SYNC_OPTIONS.map((option) => (
        <option key={option.value ?? "off"} value={option.value ?? "off"}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
