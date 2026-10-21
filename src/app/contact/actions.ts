"use server";

import { submitContactMessage, CoreApiError } from "@/lib/core/api";

export interface ContactMessageState {
  success?: boolean;
  error?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitContactMessageAction(
  _prevState: ContactMessageState,
  formData: FormData,
): Promise<ContactMessageState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email || !message) {
    return { error: "Fill in your name, email, and message." };
  }
  if (!EMAIL_PATTERN.test(email)) {
    return { error: "Enter a valid email address." };
  }

  try {
    await submitContactMessage({
      name,
      email,
      message,
      company: company || undefined,
      subject: subject || undefined,
    });
  } catch (error) {
    return {
      error:
        error instanceof CoreApiError
          ? error.message
          : "Unable to send your message. Please try again.",
    };
  }

  return { success: true };
}
