"use client";

import { useState, type SubmitEvent } from "react";
import { TextField } from "@/components/ui/text-field";
import { TextareaField } from "@/components/ui/textarea-field";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SiteSettings } from "@/types";

type Status = "idle" | "submitting" | "unavailable";

export function ContactForm({ email }: { email: SiteSettings["email"] }) {
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");

    // TODO: replace with `fetch(`${env.NEXT_PUBLIC_API_URL}/contact`, { method: "POST", ... })` once the backend ships.
    await new Promise((resolve) => setTimeout(resolve, 600));
    setStatus("unavailable");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <TextField
        id="name"
        name="name"
        type="text"
        label="Name"
        autoComplete="name"
        placeholder="Jane Doe"
        required
        disabled={status === "submitting"}
      />
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
        id="company"
        name="company"
        type="text"
        label="Company"
        autoComplete="organization"
        placeholder="Acme Inc."
        disabled={status === "submitting"}
      />
      <TextField
        id="subject"
        name="subject"
        type="text"
        label="Subject"
        placeholder="What's this about?"
        required
        disabled={status === "submitting"}
      />
      <TextareaField
        id="message"
        name="message"
        label="Message"
        rows={4}
        placeholder="Tell us what you're working on."
        required
        disabled={status === "submitting"}
      />

      <button
        type="submit"
        disabled={status === "submitting"}
        className={cn(buttonVariants("primary"), "mt-1 self-end")}
      >
        {status === "submitting" ? "Sending…" : "Send message"}
      </button>

      <p
        role="status"
        aria-live="polite"
        className="text-muted-foreground min-h-4 text-sm"
      >
        {status === "unavailable" ? (
          <>
            This form isn&apos;t connected yet — email us directly at{" "}
            <a href={`mailto:${email}`} className="text-foreground underline">
              {email}
            </a>
            .
          </>
        ) : null}
      </p>
    </form>
  );
}
