"use client";

import { useState, useTransition } from "react";
import { BellRing, Pencil, Plus, Trash2, Wallet, X } from "lucide-react";
import {
  createBudgetAction,
  deleteBudgetAction,
  updateBudgetAction,
} from "@/app/dashboard/products/cost-actions";
import type { BudgetPeriod, CoreBudget, CoreScopeCondition } from "@/lib/core/api";
import { DestructiveActionDialog } from "@/components/dashboard/destructive-action-dialog";
import { EmptyState, StatusBadge } from "@/components/dashboard/primitives";
import { ScopeEditor, summarizeScope } from "./scope-editor";

const PERIOD_LABELS: Record<BudgetPeriod, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  annual: "Annual",
  custom: "Custom range",
};

function sortBudgets(budgets: CoreBudget[]) {
  return [...budgets].sort((left, right) => {
    if (left.enabled !== right.enabled) return left.enabled ? -1 : 1;
    return left.name.localeCompare(right.name);
  });
}

function toDateInputValue(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

function toIsoDate(value: string) {
  return value ? new Date(`${value}T00:00:00.000Z`).toISOString() : null;
}

function parseThresholds(value: string): number[] {
  return value
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((n) => Number.isFinite(n) && n >= 0);
}

function parseRecipients(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

interface BudgetFormState {
  name: string;
  description: string;
  amount: string;
  currency: string;
  period: BudgetPeriod;
  periodStart: string;
  periodEnd: string;
  alertThresholds: string;
  recipients: string;
}

function toFormState(budget?: CoreBudget): BudgetFormState {
  return {
    name: budget?.name ?? "",
    description: budget?.description ?? "",
    amount: budget?.amount ?? "",
    currency: budget?.currency ?? "USD",
    period: budget?.period ?? "monthly",
    periodStart: toDateInputValue(budget?.period_start ?? null),
    periodEnd: toDateInputValue(budget?.period_end ?? null),
    alertThresholds: budget?.alert_thresholds.join(", ") ?? "50, 80, 100",
    recipients: budget?.recipients.join(", ") ?? "",
  };
}

function BudgetDialog({
  budget,
  onClose,
  onSaved,
}: {
  budget: CoreBudget | null;
  onClose: () => void;
  onSaved: (budget: CoreBudget) => void;
}) {
  const [form, setForm] = useState<BudgetFormState>(() =>
    toFormState(budget ?? undefined),
  );
  const [scope, setScope] = useState<CoreScopeCondition[]>(
    () => budget?.scope ?? [],
  );
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const isEditing = Boolean(budget);

  function submit() {
    setError("");
    const input = {
      name: form.name,
      description: form.description.trim() || null,
      amount: form.amount,
      currency: form.currency,
      period: form.period,
      periodStart: form.period === "custom" ? toIsoDate(form.periodStart) : null,
      periodEnd: form.period === "custom" ? toIsoDate(form.periodEnd) : null,
      alertThresholds: parseThresholds(form.alertThresholds),
      recipients: parseRecipients(form.recipients),
      scope,
    };
    startTransition(async () => {
      const result = budget
        ? await updateBudgetAction(budget.id, input)
        : await createBudgetAction(input);
      if (result.error) return setError(result.error);
      if (result.data) onSaved(result.data);
    });
  }

  return (
    <div className="bg-background/75 fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="budget-dialog-title"
        className="bg-background border-foreground/15 my-8 w-full max-w-xl rounded-xl border p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="budget-dialog-title" className="text-lg font-semibold">
            {isEditing ? "Edit budget" : "Create budget"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-muted-foreground p-1"
          >
            <X size={18} />
          </button>
        </div>

        <form
          className="mt-5 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Name</span>
            <input
              required
              value={form.name}
              onChange={(event) =>
                setForm((f) => ({ ...f, name: event.target.value }))
              }
              className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 outline-none"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Description</span>
            <textarea
              rows={2}
              value={form.description}
              onChange={(event) =>
                setForm((f) => ({ ...f, description: event.target.value }))
              }
              className="border-foreground/15 bg-background focus:border-accent w-full rounded-lg border px-3 py-2 outline-none"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium">Amount</span>
              <input
                required
                inputMode="decimal"
                value={form.amount}
                onChange={(event) =>
                  setForm((f) => ({ ...f, amount: event.target.value }))
                }
                placeholder="10000"
                className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 font-mono outline-none"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium">Currency</span>
              <input
                required
                maxLength={3}
                value={form.currency}
                onChange={(event) =>
                  setForm((f) => ({
                    ...f,
                    currency: event.target.value.toUpperCase(),
                  }))
                }
                className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 font-mono uppercase outline-none"
              />
            </label>
          </div>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Period</span>
            <select
              value={form.period}
              onChange={(event) =>
                setForm((f) => ({
                  ...f,
                  period: event.target.value as BudgetPeriod,
                }))
              }
              className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 outline-none"
            >
              {(Object.keys(PERIOD_LABELS) as BudgetPeriod[]).map((period) => (
                <option key={period} value={period}>
                  {PERIOD_LABELS[period]}
                </option>
              ))}
            </select>
          </label>

          {form.period === "custom" ? (
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium">Start date</span>
                <input
                  required
                  type="date"
                  value={form.periodStart}
                  onChange={(event) =>
                    setForm((f) => ({ ...f, periodStart: event.target.value }))
                  }
                  className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 outline-none"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium">End date</span>
                <input
                  required
                  type="date"
                  value={form.periodEnd}
                  onChange={(event) =>
                    setForm((f) => ({ ...f, periodEnd: event.target.value }))
                  }
                  className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 outline-none"
                />
              </label>
            </div>
          ) : null}

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Alert thresholds</span>
            <input
              value={form.alertThresholds}
              onChange={(event) =>
                setForm((f) => ({ ...f, alertThresholds: event.target.value }))
              }
              placeholder="50, 80, 100"
              className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 font-mono outline-none"
            />
            <span className="text-muted-foreground mt-1 block text-xs">
              Percent of the budget amount. A separate alert email fires the
              first time spend crosses each one.
            </span>
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">
              Recipients (comma or newline separated)
            </span>
            <textarea
              rows={2}
              value={form.recipients}
              onChange={(event) =>
                setForm((f) => ({ ...f, recipients: event.target.value }))
              }
              placeholder="finance@company.com"
              className="border-foreground/15 bg-background focus:border-accent w-full rounded-lg border px-3 py-2 font-mono text-xs outline-none"
            />
          </label>

          <div>
            <span className="mb-1.5 block text-sm font-medium">Scope</span>
            <ScopeEditor initialValue={scope} onChange={setScope} />
          </div>

          {error ? (
            <p role="alert" className="text-sm text-red-500">
              {error}
            </p>
          ) : null}

          <button
            disabled={pending}
            className="bg-accent text-accent-foreground w-full rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {pending ? "Saving…" : isEditing ? "Save changes" : "Create budget"}
          </button>
        </form>
      </div>
    </div>
  );
}

export function BudgetsClient({
  initialBudgets,
}: {
  initialBudgets: CoreBudget[];
}) {
  const [budgets, setBudgets] = useState(() => sortBudgets(initialBudgets));
  const [dialogState, setDialogState] = useState<
    "closed" | "create" | CoreBudget
  >("closed");
  const [deleteTarget, setDeleteTarget] = useState<CoreBudget | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function toggleEnabled(budget: CoreBudget) {
    setError("");
    startTransition(async () => {
      const result = await updateBudgetAction(budget.id, {
        enabled: !budget.enabled,
      });
      if (result.error) return setError(result.error);
      if (result.data) {
        setBudgets((current) =>
          sortBudgets(
            current.map((item) =>
              item.id === result.data!.id ? result.data! : item,
            ),
          ),
        );
      }
    });
  }

  function remove() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setError("");
    startTransition(async () => {
      const result = await deleteBudgetAction(target.id);
      if (result.error) return setError(result.error);
      setBudgets((current) => current.filter((item) => item.id !== target.id));
      setDeleteTarget(null);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-muted-foreground max-w-2xl text-sm leading-6">
          Set a spend ceiling for a slice of your cloud, and get an email the
          first time each alert threshold is crossed for the current period.
        </p>
        <button
          type="button"
          onClick={() => setDialogState("create")}
          className="bg-accent text-accent-foreground inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium"
        >
          <Plus size={15} /> Create budget
        </button>
      </div>

      {error && dialogState === "closed" && !deleteTarget ? (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      ) : null}

      {budgets.length === 0 ? (
        <EmptyState
          title="No budgets yet"
          description="Create a budget to get alerted before cloud spend gets out of hand."
          actions={
            <button
              type="button"
              onClick={() => setDialogState("create")}
              className="bg-accent text-accent-foreground rounded-lg px-4 py-2 text-sm font-medium"
            >
              Create budget
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {budgets.map((budget) => {
            const highestNotified = budget.notified_thresholds.length
              ? Math.max(...budget.notified_thresholds)
              : null;
            return (
              <article
                key={budget.id}
                className="border-border-soft bg-card-strong/68 rounded-2xl border p-5 shadow-[0_16px_40px_var(--shadow-card)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="bg-accent/10 text-accent flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                    <Wallet size={18} />
                  </span>
                  <StatusBadge status={budget.enabled ? "success" : "neutral"}>
                    {budget.enabled ? "Active" : "Paused"}
                  </StatusBadge>
                </div>
                <p className="mt-4 text-lg font-semibold">{budget.name}</p>
                <p className="text-muted-foreground mt-1 text-sm leading-5">
                  {budget.description ?? "No description."}
                </p>
                <div className="mt-4 flex flex-wrap items-baseline gap-2">
                  <span className="font-mono text-2xl font-semibold tracking-tight">
                    {Number(budget.amount).toLocaleString("en-US")}
                  </span>
                  <span className="text-muted-foreground text-sm font-medium">
                    {budget.currency}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    · {PERIOD_LABELS[budget.period]}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {budget.alert_thresholds.map((threshold) => {
                    const crossed = budget.notified_thresholds.includes(
                      threshold,
                    );
                    return (
                      <span
                        key={threshold}
                        className={
                          crossed
                            ? "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-300 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium"
                            : "border-border-soft bg-card-strong/75 text-muted-foreground inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium"
                        }
                      >
                        {crossed ? <BellRing size={10} /> : null}
                        {threshold}%
                      </span>
                    );
                  })}
                </div>
                <p className="text-muted-foreground mt-3 text-xs">
                  Scope: {summarizeScope(budget.scope)}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {budget.recipients.length} recipient
                  {budget.recipients.length === 1 ? "" : "s"}
                  {highestNotified !== null
                    ? ` · highest alert fired: ${highestNotified}%`
                    : ""}
                </p>
                <div className="border-border-soft mt-5 flex items-center justify-between border-t pt-4">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => toggleEnabled(budget)}
                    className="text-muted-foreground hover:text-foreground text-xs disabled:opacity-50"
                  >
                    {budget.enabled ? "Pause" : "Resume"}
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setDialogState(budget)}
                      className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
                    >
                      <Pencil size={13} /> Edit
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => {
                        setError("");
                        setDeleteTarget(budget);
                      }}
                      className="text-muted-foreground inline-flex items-center gap-1 text-xs hover:text-red-500 disabled:opacity-50"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {dialogState !== "closed" ? (
        <BudgetDialog
          key={dialogState === "create" ? "create" : dialogState.id}
          budget={dialogState === "create" ? null : dialogState}
          onClose={() => setDialogState("closed")}
          onSaved={(budget) => {
            setBudgets((current) => {
              const exists = current.some((item) => item.id === budget.id);
              return sortBudgets(
                exists
                  ? current.map((item) =>
                      item.id === budget.id ? budget : item,
                    )
                  : [...current, budget],
              );
            });
            setDialogState("closed");
          }}
        />
      ) : null}

      {deleteTarget ? (
        <DestructiveActionDialog
          key={deleteTarget.id}
          title={`Delete ${deleteTarget.name}?`}
          description="This permanently deletes the budget. This cannot be undone."
          pending={pending}
          error={error}
          onCancel={() => {
            setDeleteTarget(null);
            setError("");
          }}
          onConfirm={() => remove()}
        />
      ) : null}
    </div>
  );
}
