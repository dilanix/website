"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  CircleDashed,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import {
  answerRecommendationReviewAction,
  getRecommendationReviewAction,
  requestRecommendationReviewAction,
} from "@/app/dashboard/products/cost-actions";
import type {
  CoreRecommendationAIReview,
  CoreRecommendationOption,
  CoreRecommendationQuestion,
  CoreRecommendationReview,
} from "@/lib/core/api";
import { StatusBadge } from "@/components/dashboard/primitives";
import { HowToFixButton, hasFixGuide } from "@/components/dashboard/fix-guide";
import { cn } from "@/lib/utils";

const POLL_INTERVAL_MS = 1000;

function isReviewActive(review: CoreRecommendationReview | null) {
  return review?.status === "queued" || review?.status === "running";
}

/** Starts a review (re-check) or resumes one with answers, then polls its
 * progress until it finishes and hands the finished review to `onFinished`. */
export function useRecommendationReview({
  recommendationId,
  onFinished,
  pollIntervalMs = POLL_INTERVAL_MS,
}: {
  recommendationId: string;
  onFinished: (review: CoreRecommendationReview) => void | Promise<void>;
  pollIntervalMs?: number;
}) {
  const [review, setReview] = useState<CoreRecommendationReview | null>(null);
  const [error, setError] = useState("");
  const finishedRef = useRef(onFinished);

  useEffect(() => {
    finishedRef.current = onFinished;
  }, [onFinished]);

  // Every fresh in-flight snapshot schedules exactly one next poll; a
  // finished one stops polling and hands off to `onFinished`.
  useEffect(() => {
    if (!isReviewActive(review)) return;
    const handle = setTimeout(async () => {
      const result = await getRecommendationReviewAction(recommendationId);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (!result.data) return;
      setReview(result.data);
      if (!isReviewActive(result.data)) await finishedRef.current(result.data);
    }, pollIntervalMs);
    return () => clearTimeout(handle);
  }, [review, recommendationId, pollIntervalMs]);

  const track = useCallback(
    (result: { data?: CoreRecommendationReview; error?: string }) => {
      if (result.error) {
        setError(result.error);
        return;
      }
      if (!result.data) return;
      setError("");
      setReview(result.data);
    },
    [],
  );

  const start = useCallback(async () => {
    track(await requestRecommendationReviewAction(recommendationId));
  }, [recommendationId, track]);

  const answer = useCallback(
    async (answers: Record<string, string>) => {
      track(await answerRecommendationReviewAction(recommendationId, answers));
    },
    [recommendationId, track],
  );

  return { review, error, start, answer, active: isReviewActive(review) };
}

/** A structured investigation, not a chat: fixed stages, a short
 * product-authored activity line, never model reasoning. */
export function ReviewProgress({
  review,
}: {
  review: CoreRecommendationReview;
}) {
  const activity =
    review.status === "queued"
      ? "Waiting for an available analyzer…"
      : review.activity;
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Analyzing recommendation"
      className="border-border-soft bg-card-strong/40 rounded-lg border p-3 text-xs"
    >
      <p className="font-medium">Analyzing recommendation</p>
      <ol className="mt-2.5 flex flex-col gap-1.5">
        {review.stages.map((stage) => (
          <li
            key={stage.key}
            data-state={stage.state}
            className={cn(
              "flex items-center gap-2 transition-colors duration-300",
              stage.state === "pending" && "text-muted-foreground/70",
            )}
          >
            <span className="flex h-4 w-4 shrink-0 items-center justify-center">
              {stage.state === "completed" ? (
                <Check size={13} className="text-success" aria-hidden />
              ) : stage.state === "current" ? (
                <Loader2
                  size={13}
                  className="text-accent animate-spin"
                  aria-hidden
                />
              ) : (
                <CircleDashed size={12} aria-hidden />
              )}
            </span>
            <span className={cn(stage.state === "current" && "font-medium")}>
              {stage.label}
            </span>
          </li>
        ))}
      </ol>
      {activity ? (
        <p
          key={activity}
          className="text-muted-foreground animate-toast-in mt-2.5"
        >
          {activity}
        </p>
      ) : null}
    </div>
  );
}

/** Whether a question is shown: a follow-up whose condition fact is also
 * being asked appears only once the user picked a qualifying answer. */
export function visibleQuestions(
  questions: CoreRecommendationQuestion[],
  answers: Record<string, string>,
) {
  const asked = new Set(questions.map((question) => question.fact_key));
  return questions.filter((question) =>
    Object.entries(question.applies_when ?? {}).every(
      ([factKey, values]) =>
        !asked.has(factKey) ||
        (answers[factKey] !== undefined && values.includes(answers[factKey])),
    ),
  );
}

export function ReviewQuestions({
  questions,
  pending,
  currency,
  onSubmit,
}: {
  questions: CoreRecommendationQuestion[];
  pending?: boolean;
  currency?: string | null;
  onSubmit: (answers: Record<string, string>) => void;
}) {
  // Answers the evidence points to start selected; confirming is one click.
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      questions.flatMap((question) =>
        question.suggested_value
          ? [[question.fact_key, question.suggested_value]]
          : [],
      ),
    ),
  );
  const visible = visibleQuestions(questions, answers);
  const complete = visible.every(
    (question) => answers[question.fact_key] !== undefined,
  );
  const context = questions.find((question) => question.context)?.context;

  function submit() {
    const payload = Object.fromEntries(
      visible.map((question) => [
        question.fact_key,
        answers[question.fact_key],
      ]),
    );
    onSubmit(payload);
  }

  return (
    <div className="border-accent/30 bg-accent/5 rounded-lg border p-3 text-xs">
      <p className="text-sm font-medium">
        {visible.length > 1
          ? "We need a few details before completing this recommendation"
          : "We need one detail before completing this recommendation"}
      </p>
      {context ? (
        <p className="text-muted-foreground mt-1 leading-5">{context}</p>
      ) : null}
      <div className="mt-3 flex flex-col gap-3">
        {visible.map((question) => (
          <fieldset key={question.fact_key} className="animate-toast-in">
            <legend className="mb-1.5 font-medium">{question.prompt}</legend>
            {question.suggestion_reason &&
            answers[question.fact_key] === question.suggested_value ? (
              <p className="text-muted-foreground mb-1.5">
                Suggested — {question.suggestion_reason}
              </p>
            ) : null}
            <div
              role="radiogroup"
              aria-label={question.prompt}
              className="flex flex-wrap gap-1.5"
            >
              {question.options.map((option) => {
                const selected = answers[question.fact_key] === option.value;
                const consequence = optionConsequence(option, currency);
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-label={option.label}
                    aria-checked={selected}
                    disabled={pending}
                    onClick={() =>
                      setAnswers((current) => ({
                        ...current,
                        [question.fact_key]: option.value,
                      }))
                    }
                    className={cn(
                      "rounded-md border px-2.5 py-1.5 transition-colors disabled:opacity-50",
                      selected
                        ? "border-accent bg-accent/15 text-foreground"
                        : "border-border-soft bg-card-strong/60 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <span className="block">{option.label}</span>
                    {consequence ? (
                      <span className="text-muted-foreground block text-[11px]">
                        {consequence}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>
      <button
        type="button"
        disabled={!complete || pending}
        onClick={submit}
        className="bg-accent text-accent-foreground mt-3 rounded-md px-3 py-1.5 text-xs font-medium disabled:opacity-40"
      >
        {pending ? "Continuing…" : "Continue analysis"}
      </button>
    </div>
  );
}

/** What picking an answer leads to, e.g. "Run it on a schedule · saves
 * 231.87 USD / month". */
export function optionConsequence(
  option: CoreRecommendationQuestion["options"][number],
  currency?: string | null,
) {
  if (!option.outcome) return null;
  const savings =
    option.monthly_savings && Number(option.monthly_savings) > 0
      ? formatSavings(option.monthly_savings, currency ?? null)
      : null;
  return savings ? `${option.outcome} · saves ${savings}` : option.outcome;
}

function formatSavings(amount: string | null, currency: string | null) {
  if (amount === null) return null;
  const value = Number(amount).toLocaleString("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
  return `${value} ${currency ?? ""} / month`.replace("  ", " ");
}

function riskTone(risk: string | null) {
  if (risk === "high") return "warning" as const;
  if (risk === "low") return "success" as const;
  return "neutral" as const;
}

const EVIDENCE_QUALITY_LABELS: Record<string, string> = {
  user_confirmed: "Confirmed by you",
};

function StepList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-muted-foreground mb-1 text-[11px] font-medium tracking-wide uppercase">
        {title}
      </p>
      <ul className="space-y-0.5">
        {items.map((item, index) => (
          <li key={index} className="leading-5">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TradeOffs({ option }: { option: CoreRecommendationOption }) {
  if (option.pros.length === 0 && option.cons.length === 0) return null;
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {option.pros.length > 0 ? (
        <ul className="space-y-0.5">
          {option.pros.map((pro, index) => (
            <li key={index} className="text-success">
              + {pro}
            </li>
          ))}
        </ul>
      ) : null}
      {option.cons.length > 0 ? (
        <ul className="space-y-0.5">
          {option.cons.map((con, index) => (
            <li key={index} className="text-red-500">
              − {con}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-base font-semibold tracking-tight">{children}</h3>;
}

function preferredOption(review: CoreRecommendationAIReview) {
  return (
    review.options.find((option) => option.is_preferred) ?? review.options[0]
  );
}

/** The left half of an open recommendation: why it matters, what Dilanix
 * recommends, the evidence behind it, and the alternatives. */
export function RecommendationInsight({
  review,
  currency,
  recommendationId,
}: {
  review: CoreRecommendationAIReview;
  currency: string | null;
  /** Set where the recommendation can be acted on — shows "How to fix". */
  recommendationId?: string;
}) {
  const preferred = preferredOption(review);
  const alternatives = review.options.filter((option) => option !== preferred);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const impact = preferred
    ? formatSavings(preferred.expected_monthly_savings, currency)
    : null;

  return (
    <div className="flex flex-col gap-5 text-sm">
      <section aria-label="Why this matters">
        <SectionTitle>Why this matters</SectionTitle>
        {review.detected_issue ? (
          <p className="mt-1.5 font-medium">{review.detected_issue}</p>
        ) : null}
        <p className="text-muted-foreground mt-1 leading-6">{review.summary}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {review.confidence ? (
            <StatusBadge
              status={review.confidence === "high" ? "success" : "neutral"}
            >
              {review.confidence} confidence
            </StatusBadge>
          ) : null}
          {review.evidence_quality ? (
            <StatusBadge status="neutral">
              <ShieldCheck size={11} aria-hidden />
              {EVIDENCE_QUALITY_LABELS[review.evidence_quality] ??
                review.evidence_quality}
            </StatusBadge>
          ) : null}
        </div>
      </section>

      {preferred ? (
        <section
          aria-label="Recommended action"
          className="border-border-soft border-t pt-5"
        >
          <div className="flex flex-wrap items-center gap-2">
            <SectionTitle>Recommended action</SectionTitle>
            {preferred.risk_level ? (
              <StatusBadge status={riskTone(preferred.risk_level)}>
                {preferred.risk_level} risk
              </StatusBadge>
            ) : null}
          </div>
          <p className="mt-1.5 font-medium">{preferred.title}</p>
          <p className="text-muted-foreground mt-0.5 leading-6">
            {preferred.description}
          </p>
          {impact ? (
            <p className="text-success mt-1 text-xs font-medium">
              Saves {impact}
            </p>
          ) : null}
          <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
            <StepList title="Validation" items={preferred.validation_steps} />
            <StepList title="Rollback" items={preferred.rollback} />
          </div>
          <div className="mt-3 text-xs">
            <TradeOffs option={preferred} />
          </div>
        </section>
      ) : null}

      {review.evidence_summary.length > 0 ? (
        <section
          aria-label="Evidence"
          className="border-border-soft border-t pt-5"
        >
          <SectionTitle>
            Evidence ({review.evidence_summary.length})
          </SectionTitle>
          <ol className="mt-3 flex flex-col gap-2.5">
            {review.evidence_summary.map((item, index) => (
              <li key={index} className="flex gap-3">
                <span className="border-accent/60 text-accent flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold">
                  {index + 1}
                </span>
                <span className="leading-6">{item}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {alternatives.length > 0 ? (
        <section className="border-border-soft border-t pt-4 text-xs">
          <button
            type="button"
            aria-expanded={showAlternatives}
            onClick={() => setShowAlternatives((current) => !current)}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            <ChevronDown
              size={13}
              className={cn(
                "transition-transform",
                showAlternatives && "rotate-180",
              )}
            />
            {alternatives.length === 1
              ? "1 alternative"
              : `${alternatives.length} alternatives`}
          </button>
          {showAlternatives ? (
            <div className="animate-toast-in mt-2 grid gap-2 md:grid-cols-2">
              {alternatives.map((option, index) => (
                <div
                  key={index}
                  className="border-border-soft rounded-lg border p-2.5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{option.title}</p>
                    {option.risk_level ? (
                      <StatusBadge status={riskTone(option.risk_level)}>
                        {option.risk_level} risk
                      </StatusBadge>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground mt-0.5 leading-5">
                    {option.description}
                  </p>
                  {formatSavings(option.expected_monthly_savings, currency) ? (
                    <p className="text-success mt-1">
                      {formatSavings(option.expected_monthly_savings, currency)}
                    </p>
                  ) : null}
                  <div className="mt-1.5">
                    <TradeOffs option={option} />
                  </div>
                  {recommendationId && hasFixGuide(option.action_type) ? (
                    <div className="mt-2">
                      <HowToFixButton
                        recommendationId={recommendationId}
                        optionIndex={review.options.indexOf(option)}
                        optionTitle={option.title}
                        variant="subtle"
                      />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

/** The right half of an open recommendation: what to check before acting
 * (a checklist kept in this view only), the risks, and the way to act. */
export function BeforeYouContinue({
  review,
  recommendationId,
}: {
  review: CoreRecommendationAIReview;
  recommendationId?: string;
}) {
  const preferred = preferredOption(review);
  const prerequisites = preferred?.prerequisites ?? [];
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const remaining = prerequisites.length - checked.size;

  function toggle(index: number) {
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  return (
    <section
      aria-label="Before you continue"
      className="rounded-xl border border-amber-500/45 bg-amber-500/[0.06] p-5"
    >
      <div className="flex gap-3">
        <AlertTriangle
          size={20}
          className="mt-0.5 shrink-0 text-amber-500"
          aria-hidden
        />
        <div>
          <h3 className="text-base font-semibold text-amber-600 dark:text-amber-300">
            Before you continue
          </h3>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {prerequisites.length === 0
              ? "Nothing to prepare — review the risks, then follow the guide."
              : remaining === 0
                ? "Everything is checked — follow the guide to apply it."
                : `${remaining} item${remaining === 1 ? "" : "s"} to check before this can be applied.`}
          </p>
        </div>
      </div>

      {prerequisites.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-3 border-t border-amber-500/20 pt-4">
          {prerequisites.map((item, index) => (
            <li key={index}>
              <label className="flex cursor-pointer items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={checked.has(index)}
                  onChange={() => toggle(index)}
                  className="accent-accent mt-0.5 size-4 shrink-0 rounded"
                />
                <span
                  className={cn(
                    "leading-5",
                    checked.has(index) && "text-muted-foreground line-through",
                  )}
                >
                  {item}
                </span>
              </label>
            </li>
          ))}
        </ul>
      ) : null}

      {review.risk_notes.length > 0 ? (
        <div className="mt-4 border-t border-amber-500/20 pt-4">
          <StepList title="Risks" items={review.risk_notes} />
        </div>
      ) : null}

      {recommendationId && preferred && hasFixGuide(preferred.action_type) ? (
        <div className="mt-5">
          <HowToFixButton
            recommendationId={recommendationId}
            optionIndex={review.options.indexOf(preferred)}
            optionTitle={preferred.title}
            variant="large"
          />
        </div>
      ) : null}
    </section>
  );
}

/** A reviewed candidate that is not an actionable recommendation — no
 * savings are shown, because none are being recommended. */
export function NonActionableResult({
  review,
}: {
  review: CoreRecommendationAIReview;
}) {
  const insufficient = review.outcome === "insufficient_evidence";
  return (
    <div className="border-border-soft bg-card-strong/40 rounded-lg border p-3 text-xs">
      <p className="flex items-center gap-1.5 text-sm font-medium">
        <ShieldCheck size={14} className="text-success" aria-hidden />
        {insufficient
          ? "Not enough information for a safe change"
          : "No optimization recommended"}
      </p>
      <p className="text-muted-foreground mt-1 leading-5">{review.summary}</p>
      {insufficient && review.open_questions.length > 0 ? (
        <ul className="text-muted-foreground mt-2 list-disc space-y-0.5 pl-4">
          {review.open_questions.map((question, index) => (
            <li key={index}>{question}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
