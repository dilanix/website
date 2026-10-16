"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  AlertTriangle,
  BookOpen,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  Loader2,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Wrench,
  X,
} from "lucide-react";
import { getRecommendationFixGuideAction } from "@/app/dashboard/products/cost-actions";
import type {
  CoreFixGuideLink,
  CoreFixGuideMethod,
  CoreFixGuideStep,
  CoreRecommendationFixGuide,
  FixGuideMethodKind,
} from "@/lib/core/api";
import { StatusBadge } from "@/components/dashboard/primitives";
import { Portal } from "@/components/dashboard/portal";
import { cn } from "@/lib/utils";

const GENERATING_MESSAGES = [
  "Reading the recommendation and its evidence…",
  "Writing console, Terraform and CLI steps…",
  "Checking every command against the provider's API…",
  "Verifying documentation links…",
];

/** "AWS Console", "Terraform", "AWS CLI" — the provider name comes from
 * the guide, so nothing here is tied to one cloud. */
export function methodLabel(method: FixGuideMethodKind, providerLabel: string) {
  if (method === "console") return `${providerLabel} Console`;
  if (method === "cli") return `${providerLabel} CLI`;
  return "Terraform";
}

function progressKey(
  recommendationId: string,
  guide: CoreRecommendationFixGuide,
  method: FixGuideMethodKind,
) {
  return `fix-guide:${recommendationId}:${guide.option_index}:${guide.generated_at ?? ""}:${method}`;
}

/** Ticked steps survive a reload in this browser only — a per-viewer
 * convenience, never shared state. */
function useStepProgress(key: string) {
  const [done, setDone] = useState<Set<number>>(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return new Set(stored ? (JSON.parse(stored) as number[]) : []);
    } catch {
      return new Set();
    }
  });

  const toggle = useCallback(
    (index: number) => {
      setDone((current) => {
        const next = new Set(current);
        if (next.has(index)) next.delete(index);
        else next.add(index);
        try {
          window.localStorage.setItem(key, JSON.stringify([...next]));
        } catch {
          // Storage can be unavailable (private windows); progress just isn't kept.
        }
        return next;
      });
    },
    [key],
  );

  return { done, toggle };
}

export function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      aria-label={copied ? "Copied" : label}
      className="text-muted-foreground hover:text-foreground hover:bg-foreground/5 inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] transition-colors"
    >
      {copied ? (
        <Check size={12} className="text-success" aria-hidden />
      ) : (
        <Copy size={12} aria-hidden />
      )}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function CodeBlock({ code }: { code: NonNullable<CoreFixGuideStep["code"]> }) {
  return (
    <div className="mt-2">
      <div className="border-border-soft overflow-hidden rounded-lg border bg-slate-950 text-slate-100 dark:bg-black/40">
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-1">
          <span className="font-mono text-[10px] tracking-wide text-slate-400 uppercase">
            {code.language === "hcl" ? "hcl" : "shell"}
          </span>
          <CopyButton
            text={code.content}
            label={`Copy ${code.language === "hcl" ? "configuration" : "command"}`}
          />
        </div>
        <pre className="overflow-x-auto px-3 py-2.5 font-mono text-[12px] leading-5 whitespace-pre">
          <code>{code.content}</code>
        </pre>
      </div>
      {code.placeholders.length > 0 ? (
        <p className="mt-1.5 text-[11px] text-amber-600 dark:text-amber-300">
          Replace {code.placeholders.join(", ")} with your own value
          {code.placeholders.length > 1 ? "s" : ""} before running.
        </p>
      ) : null}
    </div>
  );
}

function StepBody({ step }: { step: CoreFixGuideStep }) {
  return (
    <>
      <p className="text-sm font-medium">{step.title}</p>
      {step.detail ? (
        <p className="text-muted-foreground mt-0.5 text-xs leading-5 whitespace-pre-line">
          {step.detail}
        </p>
      ) : null}
      {step.code ? <CodeBlock code={step.code} /> : null}
    </>
  );
}

function ChecklistSteps({
  steps,
  progressStorageKey,
}: {
  steps: CoreFixGuideStep[];
  progressStorageKey: string;
}) {
  const { done, toggle } = useStepProgress(progressStorageKey);
  const completed = steps.filter((_, index) => done.has(index)).length;
  const percent = steps.length
    ? Math.round((completed / steps.length) * 100)
    : 0;

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <div
          role="progressbar"
          aria-label="Steps completed"
          aria-valuemin={0}
          aria-valuemax={steps.length}
          aria-valuenow={completed}
          className="bg-foreground/10 h-1.5 flex-1 overflow-hidden rounded-full"
        >
          <div
            className="bg-accent h-full rounded-full transition-[width] duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="text-muted-foreground shrink-0 text-[11px]">
          {completed} of {steps.length} done
        </span>
      </div>
      <ol className="flex flex-col gap-2.5">
        {steps.map((step, index) => {
          const checked = done.has(index);
          return (
            <li
              key={index}
              className={cn(
                "border-border-soft bg-card-strong/40 flex gap-3 rounded-xl border p-3 transition-colors",
                checked && "border-success/30 bg-success/5",
              )}
            >
              <button
                type="button"
                role="checkbox"
                aria-checked={checked}
                aria-label={`Mark step ${index + 1} as done`}
                onClick={() => toggle(index)}
                className={cn(
                  "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors",
                  checked
                    ? "border-success bg-success text-white"
                    : "border-border-soft text-muted-foreground hover:border-accent hover:text-accent",
                )}
              >
                {checked ? <Check size={13} aria-hidden /> : index + 1}
              </button>
              <div className={cn("min-w-0 flex-1", checked && "opacity-70")}>
                <StepBody step={step} />
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function PlainSteps({
  title,
  icon,
  steps,
}: {
  title: string;
  icon: ReactNode;
  steps: CoreFixGuideStep[];
}) {
  if (steps.length === 0) return null;
  return (
    <section aria-label={title} className="mt-5">
      <p className="text-muted-foreground mb-2 flex items-center gap-1.5 text-[11px] font-medium tracking-wide uppercase">
        {icon}
        {title}
      </p>
      <ol className="flex flex-col gap-2">
        {steps.map((step, index) => (
          <li key={index} className="flex gap-2.5">
            <span className="text-muted-foreground mt-0.5 w-4 shrink-0 text-right text-xs">
              {index + 1}.
            </span>
            <div className="min-w-0 flex-1">
              <StepBody step={step} />
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function LinkList({ links }: { links: CoreFixGuideLink[] }) {
  if (links.length === 0) return null;
  return (
    <ul className="flex flex-col gap-1.5">
      {links.map((link) => (
        <li key={link.url}>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent inline-flex items-center gap-1 text-xs underline-offset-2 hover:underline"
          >
            {link.label}
            <ExternalLink size={11} aria-hidden />
          </a>
        </li>
      ))}
    </ul>
  );
}

function MethodPanel({
  method,
  guide,
  recommendationId,
}: {
  method: CoreFixGuideMethod;
  guide: CoreRecommendationFixGuide;
  recommendationId: string;
}) {
  if (!method.available) {
    return (
      <div className="border-border-soft bg-card-strong/40 flex gap-2 rounded-xl border p-4 text-xs">
        <AlertTriangle
          size={14}
          className="mt-0.5 shrink-0 text-amber-500"
          aria-hidden
        />
        <p className="text-muted-foreground leading-5">
          {method.unavailable_reason ??
            "No verified instructions are available for this method."}
        </p>
      </div>
    );
  }
  const consoleLinks = method.links.filter((link) => link.kind === "console");
  const references = method.links.filter((link) => link.kind !== "console");

  return (
    <div className="animate-toast-in">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {method.scope === "generic_example" ? (
          <StatusBadge status="warning">
            Generic example — adapt to your code
          </StatusBadge>
        ) : (
          <StatusBadge status="success">
            <ShieldCheck size={11} aria-hidden />
            Uses your verified resource data
          </StatusBadge>
        )}
        {consoleLinks.map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-accent text-accent-foreground inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
          >
            {link.label}
            <ExternalLink size={12} aria-hidden />
          </a>
        ))}
      </div>
      {method.note ? (
        <p className="text-muted-foreground mb-4 text-xs leading-5">
          {method.note}
        </p>
      ) : null}
      <ChecklistSteps
        key={progressKey(recommendationId, guide, method.method)}
        steps={method.steps}
        progressStorageKey={progressKey(recommendationId, guide, method.method)}
      />
      <PlainSteps
        title="Verify the result"
        icon={<Check size={12} aria-hidden />}
        steps={method.validation}
      />
      <PlainSteps
        title="Roll back if needed"
        icon={<RotateCcw size={12} aria-hidden />}
        steps={method.rollback}
      />
      {references.length > 0 ? (
        <section aria-label="Reference" className="mt-5">
          <p className="text-muted-foreground mb-2 text-[11px] font-medium tracking-wide uppercase">
            Reference
          </p>
          <LinkList links={references} />
        </section>
      ) : null}
    </div>
  );
}

function GuideBody({
  guide,
  recommendationId,
}: {
  guide: CoreRecommendationFixGuide;
  recommendationId: string;
}) {
  const firstAvailable =
    guide.methods.find((method) => method.available)?.method ??
    guide.methods[0]?.method ??
    "console";
  const [active, setActive] = useState<FixGuideMethodKind>(firstAvailable);
  const [showOmitted, setShowOmitted] = useState(false);
  const method = guide.methods.find((item) => item.method === active);

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm leading-6">{guide.summary}</p>

      {guide.warnings.length > 0 ? (
        <div
          role={guide.status === "insufficient" ? "alert" : undefined}
          className="flex gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-xs"
        >
          <AlertTriangle
            size={14}
            className="mt-0.5 shrink-0 text-amber-500"
            aria-hidden
          />
          <ul className="space-y-1 leading-5 text-amber-700 dark:text-amber-200">
            {guide.warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {guide.prerequisites.length > 0 ? (
        <section aria-label="Before you start">
          <p className="text-muted-foreground mb-2 text-[11px] font-medium tracking-wide uppercase">
            Before you start
          </p>
          <ul className="flex flex-col gap-1.5 text-xs leading-5">
            {guide.prerequisites.map((item, index) => (
              <li key={index} className="flex gap-2">
                <span className="bg-accent mt-2 size-1 shrink-0 rounded-full" />
                {item}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {guide.status === "ready" ? (
        <div>
          <div
            role="tablist"
            aria-label="How to apply the fix"
            className="border-border-soft bg-card-strong/50 mb-4 grid grid-cols-3 gap-1 rounded-xl border p-1"
          >
            {guide.methods.map((item) => (
              <button
                key={item.method}
                type="button"
                role="tab"
                aria-selected={active === item.method}
                onClick={() => setActive(item.method)}
                className={cn(
                  "rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
                  active === item.method
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                  !item.available && "opacity-50",
                )}
              >
                {methodLabel(item.method, guide.provider_label)}
              </button>
            ))}
          </div>
          {method ? (
            <div
              role="tabpanel"
              aria-label={methodLabel(method.method, guide.provider_label)}
            >
              <MethodPanel
                key={method.method}
                method={method}
                guide={guide}
                recommendationId={recommendationId}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {guide.documentation.length > 0 ? (
        <section aria-label="Documentation">
          <p className="text-muted-foreground mb-2 flex items-center gap-1.5 text-[11px] font-medium tracking-wide uppercase">
            <BookOpen size={12} aria-hidden /> Documentation
          </p>
          <LinkList links={guide.documentation} />
        </section>
      ) : null}

      {guide.omitted.length > 0 ? (
        <div className="text-xs">
          <button
            type="button"
            aria-expanded={showOmitted}
            onClick={() => setShowOmitted((current) => !current)}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            <ChevronDown
              size={13}
              className={cn(
                "transition-transform",
                showOmitted && "rotate-180",
              )}
            />
            {guide.omitted.length === 1
              ? "1 generated item was removed because it could not be verified"
              : `${guide.omitted.length} generated items were removed because they could not be verified`}
          </button>
          {showOmitted ? (
            <ul className="text-muted-foreground animate-toast-in mt-2 list-disc space-y-0.5 pl-5">
              {guide.omitted.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function GeneratingState() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const handle = setInterval(
      () =>
        setIndex((current) =>
          Math.min(current + 1, GENERATING_MESSAGES.length - 1),
        ),
      2500,
    );
    return () => clearInterval(handle);
  }, []);
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center gap-3 py-16 text-center"
    >
      <Loader2 size={20} className="text-accent animate-spin" aria-hidden />
      <p className="text-sm font-medium">Preparing your guide</p>
      <p key={index} className="text-muted-foreground animate-toast-in text-xs">
        {GENERATING_MESSAGES[index]}
      </p>
    </div>
  );
}

export function FixGuideDrawer({
  recommendationId,
  optionIndex,
  optionTitle,
  onClose,
}: {
  recommendationId: string;
  optionIndex: number;
  optionTitle: string;
  onClose: () => void;
}) {
  const [guide, setGuide] = useState<CoreRecommendationFixGuide | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const apply = useCallback(
    (result: Awaited<ReturnType<typeof getRecommendationFixGuideAction>>) => {
      setLoading(false);
      if (result.error) return setError(result.error);
      if (result.data) setGuide(result.data);
    },
    [],
  );

  async function load(regenerate: boolean) {
    setLoading(true);
    setError("");
    apply(
      await getRecommendationFixGuideAction(
        recommendationId,
        optionIndex,
        regenerate,
      ),
    );
  }

  // The first read happens on open; a stored guide comes back at once.
  useEffect(() => {
    let cancelled = false;
    void getRecommendationFixGuideAction(recommendationId, optionIndex).then(
      (result) => {
        if (!cancelled) apply(result);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [recommendationId, optionIndex, apply]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const resource = guide?.resource;
  const resourceLabel = useMemo(() => {
    if (!resource) return null;
    const identity =
      resource.name &&
      resource.external_id &&
      resource.name !== resource.external_id
        ? `${resource.name} (${resource.external_id})`
        : (resource.external_id ?? resource.name);
    return [identity, resource.region].filter(Boolean).join(" · ");
  }, [resource]);

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex justify-end">
        <button
          type="button"
          aria-label="Close guide"
          onClick={onClose}
          className="bg-background/60 absolute inset-0 backdrop-blur-sm"
        />
        <aside
          role="dialog"
          aria-modal="true"
          aria-label={`How to fix: ${optionTitle}`}
          className="border-border-soft bg-background animate-drawer-in relative flex h-full w-full max-w-2xl flex-col border-l shadow-2xl"
        >
          <header className="border-border-soft flex items-start justify-between gap-4 border-b px-5 py-4 sm:px-6">
            <div className="min-w-0">
              <p className="text-accent mb-1 flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.18em] uppercase">
                <Wrench size={11} aria-hidden /> How to fix
              </p>
              <h2 className="text-lg font-semibold tracking-tight">
                {optionTitle}
              </h2>
              {resourceLabel ? (
                <code className="border-border-soft bg-card-strong/60 mt-1.5 inline-block rounded px-1.5 py-0.5 text-[11px]">
                  {resourceLabel}
                </code>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="border-border-soft text-muted-foreground hover:text-foreground flex size-8 shrink-0 items-center justify-center rounded-lg border"
            >
              <X size={16} aria-hidden />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            {loading ? (
              <GeneratingState />
            ) : error ? (
              <div
                role="alert"
                className="flex flex-col items-start gap-3 py-10 text-sm"
              >
                <p className="text-red-500">{error}</p>
                <button
                  type="button"
                  onClick={() => void load(false)}
                  className="border-border-soft text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs"
                >
                  <RefreshCw size={12} aria-hidden /> Try again
                </button>
              </div>
            ) : guide ? (
              <GuideBody guide={guide} recommendationId={recommendationId} />
            ) : null}
          </div>

          <footer className="border-border-soft text-muted-foreground flex flex-wrap items-center justify-between gap-2 border-t px-5 py-3 text-[11px] sm:px-6">
            <span>
              Dilanix never runs these steps or changes your infrastructure.
            </span>
            {guide && !loading ? (
              <button
                type="button"
                onClick={() => void load(true)}
                className="hover:text-foreground inline-flex items-center gap-1"
              >
                <RefreshCw size={11} aria-hidden /> Regenerate
              </button>
            ) : null}
          </footer>
        </aside>
      </div>
    </Portal>
  );
}

/** Opens the guide for one option of a completed review. */
export function HowToFixButton({
  recommendationId,
  optionIndex,
  optionTitle,
  variant = "primary",
}: {
  recommendationId: string;
  optionIndex: number;
  optionTitle: string;
  variant?: "primary" | "subtle" | "large";
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg text-xs font-medium transition-colors",
          variant === "large" &&
            "bg-accent text-accent-foreground px-5 py-2.5 text-sm shadow-[0_10px_30px_color-mix(in_oklab,var(--accent)_35%,transparent)] hover:opacity-90",
          variant === "primary" &&
            "bg-accent text-accent-foreground px-3 py-1.5 hover:opacity-90",
          variant === "subtle" && "text-accent hover:underline",
        )}
      >
        <Wrench size={variant === "large" ? 15 : 12} aria-hidden /> How to fix
      </button>
      {open ? (
        <FixGuideDrawer
          recommendationId={recommendationId}
          optionIndex={optionIndex}
          optionTitle={optionTitle}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

/** Only an option that changes something has instructions. */
export function hasFixGuide(actionType: string | null) {
  return actionType !== null && actionType !== "keep";
}
