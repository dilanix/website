"use client";

import { AlertTriangle } from "lucide-react";
import { useState } from "react";

export function DestructiveActionDialog({
  title,
  description,
  confirmationName,
  pending,
  error,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmationName?: string;
  pending: boolean;
  error?: string;
  onCancel: () => void;
  onConfirm: (confirmationName?: string) => void;
}) {
  const [confirmation, setConfirmation] = useState("");
  const matches =
    confirmationName === undefined || confirmation === confirmationName;

  return (
    <div className="bg-background/75 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="destructive-action-title"
        aria-describedby="destructive-action-description"
        className="bg-background border-foreground/15 w-full max-w-md rounded-xl border p-6 shadow-2xl"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
          <AlertTriangle size={19} />
        </span>
        <h2
          id="destructive-action-title"
          className="mt-4 text-lg font-semibold text-red-600"
        >
          {title}
        </h2>
        <p
          id="destructive-action-description"
          className="text-muted-foreground mt-2 text-sm leading-6"
        >
          {description}
        </p>

        <form
          className="mt-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (matches) onConfirm(confirmationName ? confirmation : undefined);
          }}
        >
          {confirmationName !== undefined ? (
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium">
                Type <span className="font-mono">{confirmationName}</span> to
                confirm
              </span>
              <input
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                autoFocus
                autoComplete="off"
                spellCheck={false}
                className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 text-sm outline-none"
              />
            </label>
          ) : null}

          {error ? (
            <p role="alert" className="mt-3 text-sm text-red-500">
              {error}
            </p>
          ) : null}

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={onCancel}
              className="border-foreground/15 rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending || !matches}
              className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              {pending ? "Deleting…" : "Delete permanently"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
