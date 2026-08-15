"use client";

import { useState, type SubmitEvent } from "react";
import { TextField } from "@/components/ui/text-field";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Status = "idle" | "submitting" | "unavailable";

export function SignInForm() {
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");

    // TODO: replace with `fetch(`${env.NEXT_PUBLIC_API_URL}/auth/sign-in`, { method: "POST", ... })` once the backend ships.
    await new Promise((resolve) => setTimeout(resolve, 600));
    setStatus("unavailable");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <TextField
        id="email"
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        placeholder="you@company.com"
        required
        disabled={status === "submitting"}
      />
      <TextField
        id="password"
        name="password"
        type="password"
        label="Password"
        autoComplete="current-password"
        placeholder="••••••••"
        required
        disabled={status === "submitting"}
        labelAction={
          <a
            href="#"
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            Forgot password?
          </a>
        }
      />

      <button
        type="submit"
        disabled={status === "submitting"}
        className={cn(buttonVariants("primary"), "mt-1 self-end")}
      >
        {status === "submitting" ? "Signing in…" : "Sign in"}
      </button>

      <p
        role="status"
        aria-live="polite"
        className="text-muted-foreground min-h-4 text-sm"
      >
        {status === "unavailable"
          ? "Sign-in isn't connected yet — check back soon."
          : null}
      </p>
    </form>
  );
}
