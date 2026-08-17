"use client";

import { useActionState } from "react";
import { TextField } from "@/components/ui/text-field";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { signInAction, type SignInState } from "@/app/sign-in/actions";

const initialState: SignInState = {};

export function SignInForm() {
  const [state, formAction, isPending] = useActionState(
    signInAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <TextField
        id="email"
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        placeholder="you@company.com"
        required
        disabled={isPending}
      />
      <TextField
        id="password"
        name="password"
        type="password"
        label="Password"
        autoComplete="current-password"
        placeholder="••••••••"
        required
        disabled={isPending}
        labelAction={
          <a
            href="#"
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            Forgot password?
          </a>
        }
      />

      <label className="text-muted-foreground flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="remember_me"
          value="1"
          disabled={isPending}
          className="border-foreground/25 accent-accent h-4 w-4 rounded"
        />
        Remember me
      </label>

      <button
        type="submit"
        disabled={isPending}
        className={cn(buttonVariants("primary"), "mt-1 self-end")}
      >
        {isPending ? "Signing in…" : "Sign in"}
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
