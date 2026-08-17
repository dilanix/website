"use client";

import { useActionState } from "react";
import { TextField } from "@/components/ui/text-field";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  changePasswordAction,
  type ChangePasswordState,
} from "@/app/change-password/actions";

const initialState: ChangePasswordState = {};

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(
    changePasswordAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <TextField
        id="current_password"
        name="current_password"
        type="password"
        label="Current password"
        autoComplete="current-password"
        placeholder="••••••••"
        required
        disabled={isPending}
      />
      <TextField
        id="new_password"
        name="new_password"
        type="password"
        label="New password"
        autoComplete="new-password"
        placeholder="••••••••"
        required
        disabled={isPending}
      />
      <TextField
        id="confirm_password"
        name="confirm_password"
        type="password"
        label="Confirm new password"
        autoComplete="new-password"
        placeholder="••••••••"
        required
        disabled={isPending}
      />

      <button
        type="submit"
        disabled={isPending}
        className={cn(buttonVariants("primary"), "mt-1 self-end")}
      >
        {isPending ? "Updating…" : "Update password"}
      </button>

      <p
        role="status"
        aria-live="polite"
        className="min-h-4 text-sm text-red-600 dark:text-red-400"
      >
        {state.error}
      </p>
    </form>
  );
}
