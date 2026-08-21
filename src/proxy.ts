import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { env } from "@/env";
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_EXPIRES_AT_COOKIE,
  REFRESH_TOKEN_COOKIE,
  REMEMBER_ME_COOKIE,
  MUST_CHANGE_PASSWORD_COOKIE,
} from "@/lib/auth/constants";
import { authCookieOptions } from "@/lib/auth/cookie-options";

// Refresh once less than this much time is left on the access token, rather
// than waiting for it to actually expire — avoids a page render racing a
// token that dies mid-request.
const REFRESH_BUFFER_MS = 60_000;

interface RefreshedTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
}

async function tryRefresh(
  refreshToken: string,
): Promise<RefreshedTokens | null> {
  try {
    const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/v1/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as RefreshedTokens;
  } catch {
    return null;
  }
}

function applyRefreshedCookies(
  response: NextResponse,
  tokens: RefreshedTokens,
  rememberMe: boolean,
  mustChangePassword: boolean,
) {
  const accessOptions = authCookieOptions(rememberMe, tokens.expires_in);
  const refreshOptions = authCookieOptions(
    rememberMe,
    tokens.refresh_expires_in,
  );

  response.cookies.set(ACCESS_TOKEN_COOKIE, tokens.access_token, accessOptions);
  response.cookies.set(
    ACCESS_TOKEN_EXPIRES_AT_COOKIE,
    String(Date.now() + tokens.expires_in * 1000),
    accessOptions,
  );
  response.cookies.set(
    REFRESH_TOKEN_COOKIE,
    tokens.refresh_token,
    refreshOptions,
  );
  response.cookies.set(
    REMEMBER_ME_COOKIE,
    rememberMe ? "1" : "0",
    refreshOptions,
  );
  response.cookies.set(
    MUST_CHANGE_PASSWORD_COOKIE,
    mustChangePassword ? "1" : "0",
    refreshOptions,
  );
}

function clearSessionCookies(response: NextResponse) {
  for (const name of [
    ACCESS_TOKEN_COOKIE,
    ACCESS_TOKEN_EXPIRES_AT_COOKIE,
    REFRESH_TOKEN_COOKIE,
    REMEMBER_ME_COOKIE,
    MUST_CHANGE_PASSWORD_COOKIE,
  ]) {
    response.cookies.delete(name);
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  const rememberMe = request.cookies.get(REMEMBER_ME_COOKIE)?.value === "1";
  const mustChangePassword =
    request.cookies.get(MUST_CHANGE_PASSWORD_COOKIE)?.value === "1";

  if (!refreshToken) {
    if (pathname === "/sign-in") return NextResponse.next();
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const expiresAt = Number(
    request.cookies.get(ACCESS_TOKEN_EXPIRES_AT_COOKIE)?.value ?? 0,
  );
  const needsRefresh = !expiresAt || expiresAt - Date.now() < REFRESH_BUFFER_MS;

  let refreshed: RefreshedTokens | null = null;
  if (needsRefresh) {
    refreshed = await tryRefresh(refreshToken);
    if (!refreshed) {
      const response = NextResponse.redirect(new URL("/sign-in", request.url));
      clearSessionCookies(response);
      return response;
    }
    // Make the new token visible to this request's own page render too, not
    // just to the browser on the next navigation.
    request.cookies.set(ACCESS_TOKEN_COOKIE, refreshed.access_token);
    request.cookies.set(REFRESH_TOKEN_COOKIE, refreshed.refresh_token);
    request.cookies.set(
      ACCESS_TOKEN_EXPIRES_AT_COOKIE,
      String(Date.now() + refreshed.expires_in * 1000),
    );
  }

  let response: NextResponse;
  if (mustChangePassword && pathname !== "/change-password") {
    // First login always lands on the forced password reset, no exceptions.
    response = NextResponse.redirect(new URL("/change-password", request.url));
  } else if (pathname === "/sign-in") {
    response = NextResponse.redirect(
      new URL(
        mustChangePassword ? "/change-password" : "/dashboard",
        request.url,
      ),
    );
  } else {
    response = NextResponse.next({ request: { headers: request.headers } });
  }

  if (refreshed) {
    applyRefreshedCookies(response, refreshed, rememberMe, mustChangePassword);
  }

  return response;
}

export const config = {
  matcher: ["/sign-in", "/dashboard/:path*", "/change-password"],
};
