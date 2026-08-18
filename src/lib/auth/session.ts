/**
 * Session cookies: the API's short-lived access token, its longer-lived
 * refresh token, when the access token expires, whether "remember me" was
 * checked, and the `must_change_password` flag cached at login so
 * `proxy.ts` can enforce the forced-reset redirect without an extra
 * `/v1/auth/me` call on every request.
 */
import { cookies } from "next/headers";
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_EXPIRES_AT_COOKIE,
  REFRESH_TOKEN_COOKIE,
  REMEMBER_ME_COOKIE,
  MUST_CHANGE_PASSWORD_COOKIE,
} from "./constants";
import { authCookieOptions } from "./cookie-options";

export {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_EXPIRES_AT_COOKIE,
  REFRESH_TOKEN_COOKIE,
  REMEMBER_ME_COOKIE,
  MUST_CHANGE_PASSWORD_COOKIE,
};

export interface SessionTokens {
  access_token: string;
  refresh_token: string;
  /** Access token lifetime, in seconds. */
  expires_in: number;
  /** Refresh token lifetime, in seconds — used as the cookie's own maxAge when "remember me" is on. */
  refresh_expires_in: number;
}

export async function createSession(
  tokens: SessionTokens,
  rememberMe: boolean,
  mustChangePassword: boolean,
) {
  const cookieStore = await cookies();
  const accessOptions = authCookieOptions(rememberMe, tokens.expires_in);
  const refreshOptions = authCookieOptions(
    rememberMe,
    tokens.refresh_expires_in,
  );
  const expiresAt = Date.now() + tokens.expires_in * 1000;

  cookieStore.set(ACCESS_TOKEN_COOKIE, tokens.access_token, accessOptions);
  cookieStore.set(
    ACCESS_TOKEN_EXPIRES_AT_COOKIE,
    String(expiresAt),
    accessOptions,
  );
  cookieStore.set(REFRESH_TOKEN_COOKIE, tokens.refresh_token, refreshOptions);
  cookieStore.set(
    REMEMBER_ME_COOKIE,
    rememberMe ? "1" : "0",
    refreshOptions,
  );
  cookieStore.set(
    MUST_CHANGE_PASSWORD_COOKIE,
    mustChangePassword ? "1" : "0",
    refreshOptions,
  );
}

export async function getAccessToken() {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
}

export async function getRefreshToken() {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(ACCESS_TOKEN_EXPIRES_AT_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
  cookieStore.delete(REMEMBER_ME_COOKIE);
  cookieStore.delete(MUST_CHANGE_PASSWORD_COOKIE);
}
