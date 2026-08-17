"use server";

import { redirect } from "next/navigation";
import { logout } from "@/lib/auth/api";
import {
  destroySession,
  getAccessToken,
  getRefreshToken,
} from "@/lib/auth/session";

export async function signOutAction() {
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
