"use server";

import { redirect } from "next/navigation";
import {
  login,
  getMe,
  type TokenResponse,
  AuthApiError,
  isNotVerifiedError,
} from "@/lib/auth/api";
import { createSession } from "@/lib/auth/session";

export interface SignInState {
  error?: string;
}

export async function signInAction(
  _prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const rememberMe = formData.get("remember_me") === "1";

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  let tokens: TokenResponse;
  try {
    tokens = await login(email, password, rememberMe);
  } catch (error) {
    return {
      error:
        error instanceof AuthApiError ? error.message : "Unable to sign in.",
    };
  }

  let mustChangePassword = false;
  try {
    const me = await getMe(tokens.access_token);
    mustChangePassword = me.must_change_password;
  } catch (error) {
    if (isNotVerifiedError(error)) {
      // Freshly invited accounts are unverified until they set their own
      // password, and there's no self-serve verification step — so treat
      // "not verified" here the same as "must change password" instead of
      // blocking sign-in entirely.
      mustChangePassword = true;
    } else {
      return {
        error:
          error instanceof AuthApiError ? error.message : "Unable to sign in.",
      };
    }
  }

  await createSession(tokens, rememberMe, mustChangePassword);

  // First login must go through a forced password reset before anything else.
  redirect(mustChangePassword ? "/change-password" : "/dashboard");
}
