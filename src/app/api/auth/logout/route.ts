import { NextResponse } from "next/server";
import { logout } from "@/lib/auth/api";
import {
  destroySession,
  getAccessToken,
  getRefreshToken,
} from "@/lib/auth/session";

/**
 * Cookies can only be mutated in a Server Action or Route Handler, never
 * during a page's Server Component render — so pages that discover their
 * session is invalid (e.g. `getMe()` fails) redirect here instead of
 * clearing cookies themselves.
 */
export async function GET(request: Request) {
  const accessToken = await getAccessToken();
  const refreshToken = await getRefreshToken();
  if (accessToken) {
    try {
      await logout(accessToken, refreshToken ?? null);
    } catch {
      // Ignore — the local session is cleared next either way, and this
      // path already means something about the session was already broken.
    }
  }

  await destroySession();
  return NextResponse.redirect(new URL("/sign-in", request.url));
}
