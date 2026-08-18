import type { SelectOption } from "../config";

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly SelectOption<T>[];
  disabled?: boolean;
  onChange(value: T): void;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="border-foreground/10 bg-foreground/[0.02] inline-flex rounded-lg border p-1"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${value === option.value ? "bg-card-strong text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function DateRangeFields({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: {
  startDate: string;
  endDate: string;
  onStartDateChange(value: string): void;
  onEndDateChange(value: string): void;
}) {
  return (
    <>
      <DateField label="From" value={startDate} onChange={onStartDateChange} />
      <DateField label="To" value={endDate} onChange={onEndDateChange} />
    </>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange(value: string): void;
}) {
  return (
    <label className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
      <span className="mb-1.5 block">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="border-foreground/10 bg-background text-foreground block h-9 rounded-md border px-2 text-xs font-normal tracking-normal normal-case"
      />
    </label>
  );
}
