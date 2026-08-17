"use server";

import { redirect } from "next/navigation";
import {
  changePassword,
  logout,
  logoutAll,
  AuthApiError,
  isNotVerifiedError,
} from "@/lib/auth/api";
import {
  destroySession,
  getAccessToken,
  getRefreshToken,
} from "@/lib/auth/session";

export interface ChangePasswordState {
  error?: string;
}

export async function changePasswordAction(
  _prevState: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const currentPassword = String(formData.get("current_password") ?? "");
  const newPassword = String(formData.get("new_password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "Fill in all fields." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "New passwords don't match." };
  }
  if (newPassword === currentPassword) {
    return { error: "Choose a new password different from your current one." };
  }

  const accessToken = await getAccessToken();
  if (!accessToken) {
    redirect("/sign-in");
  }

  try {
    await changePassword(accessToken, currentPassword, newPassword);
  } catch (error) {
    if (isNotVerifiedError(error)) {
      return {
        error:
          "Your account hasn't been verified yet, so the password can't be changed. Contact an administrator to verify your account.",
      };
    }
    if (error instanceof AuthApiError) {
      return { error: error.message };
    }
    return { error: "Unable to change your password." };
  }

  // A changed password should invalidate every other session too, not just
  // this one — best-effort, since we're clearing local state regardless.
  try {
    await logoutAll(accessToken);
  } catch {
    // Ignore — the local session is cleared next either way.
  }

  await destroySession();
  redirect("/sign-in?password-changed=1");
}

export async function cancelChangePasswordAction() {
  const accessToken = await getAccessToken();
  const refreshToken = await getRefreshToken();
  if (accessToken) {
    try {
      await logout(accessToken, refreshToken ?? null);
    } catch {
      // Ignore — the local session is cleared next either way.
    }
  }

  await destroySession();
  redirect("/sign-in");
}
