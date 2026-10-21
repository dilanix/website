"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { TextField } from "@/components/ui/text-field";
import { TextareaField } from "@/components/ui/textarea-field";
import { buttonVariants } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { SiteSettings } from "@/types";
import {
  submitContactMessageAction,
  type ContactMessageState,
} from "@/app/contact/actions";

const initialState: ContactMessageState = {};

export function ContactForm({ email }: { email: SiteSettings["email"] }) {
  const [state, formAction, isPending] = useActionState(
    submitContactMessageAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [toastKey, setToastKey] = useState(0);

  // Storing the previous action result lets us detect a *new* successful
  // submission (including a repeat one) during render, without a setState
  // call inside an effect. See https://react.dev/reference/react/useState#storing-information-from-previous-renders.
  const [prevState, setPrevState] = useState(state);
  if (state !== prevState) {
    setPrevState(state);
    if (state.success) setToastKey((key) => key + 1);
  }

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  return (
    <>
      <form ref={formRef} action={formAction} className="flex flex-col gap-6">
        <TextField
          id="name"
          name="name"
          type="text"
          label="Name"
          autoComplete="name"
          placeholder="Jane Doe"
          required
          disabled={isPending}
        />
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
          id="company"
          name="company"
          type="text"
          label="Company"
          autoComplete="organization"
          placeholder="Acme Inc."
          disabled={isPending}
        />
        <TextField
          id="subject"
          name="subject"
          type="text"
          label="Subject"
          placeholder="What's this about?"
          required
          disabled={isPending}
        />
        <TextareaField
          id="message"
          name="message"
          label="Message"
          rows={4}
          placeholder="Tell us what you're working on."
          required
          disabled={isPending}
        />

        <button
          type="submit"
          disabled={isPending}
          className={cn(
            buttonVariants("primary"),
            "mt-1 cursor-pointer self-end",
          )}
        >
          {isPending ? "Sending…" : "Send message"}
        </button>

        <p
          role="status"
          aria-live="polite"
          className="text-muted-foreground min-h-4 text-sm"
        >
          {state.error ? (
            <>
              <span className="text-red-600 dark:text-red-400">
                {state.error}
              </span>{" "}
              You can also email us directly at{" "}
              <a href={`mailto:${email}`} className="text-foreground underline">
                {email}
              </a>
              .
            </>
          ) : null}
        </p>
      </form>
      {toastKey > 0 ? (
        <Toast
          key={toastKey}
          variant="success"
          message="Thanks — we got your message and will get back to you soon."
          onDismiss={() => setToastKey(0)}
        />
      ) : null}
    </>
  );
}
