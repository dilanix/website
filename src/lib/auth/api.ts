/**
 * Thin client for the Dilanix auth API (`${env.NEXT_PUBLIC_API_URL}/v1/auth/*`).
 * Server-only: called from Server Actions and `proxy.ts`, never from the browser.
 */
import { env } from "@/env";

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  /** Access token lifetime, in seconds. */
  expires_in: number;
  /** Refresh token lifetime, in seconds. */
  refresh_expires_in: number;
}

export interface MeResponse {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_verified: boolean;
  is_superuser: boolean;
  must_change_password: boolean;
  organizations: OrganizationMembership[];
}

export interface OrganizationMembership {
  organization_id: string;
  organization_name: string;
  role: string;
}

export class AuthApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

/**
 * `/v1/auth/me` and `/v1/auth/change-password` require `current_active_verified_user`
 * on the API, but newly invited accounts are created with `is_verified: false` and
 * there's no self-serve verification endpoint — so a fresh account can 403 here
 * before it ever gets a chance to change its temporary password. Detected by
 * message rather than a dedicated error code since the API doesn't expose one.
 */
export function isNotVerifiedError(error: unknown): error is AuthApiError {
  return (
    error instanceof AuthApiError &&
    error.status === 403 &&
    error.message.toLowerCase().includes("not verified")
  );
}

async function readErrorMessage(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { detail?: unknown };
    const { detail } = body;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      const messages = detail
        .map((entry) =>
          entry && typeof entry === "object" && "msg" in entry
            ? String((entry as { msg?: unknown }).msg)
            : null,
        )
        .filter((msg): msg is string => Boolean(msg));
      if (messages.length > 0) return messages.join(" ");
    }
  } catch {
    // Response body wasn't JSON — fall through to the status-based fallback.
  }
  if (response.status === 401) return "Incorrect email or password.";
  return fallback;
}

export async function login(
  email: string,
  password: string,
  rememberMe: boolean,
): Promise<TokenResponse> {
  const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email, password, remember_me: rememberMe }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new AuthApiError(
      await readErrorMessage(response, "Unable to sign in."),
      response.status,
    );
  }

  return response.json() as Promise<TokenResponse>;
}

export async function refreshTokens(
  refreshToken: string,
): Promise<TokenResponse> {
  const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new AuthApiError(
      await readErrorMessage(response, "Unable to refresh your session."),
      response.status,
    );
  }

  return response.json() as Promise<TokenResponse>;
}

/** Revokes a single session (the refresh token tied to this device/browser). */
export async function logout(
  accessToken: string,
  refreshToken: string | null,
): Promise<void> {
  const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/v1/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "*/*",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new AuthApiError(
      await readErrorMessage(response, "Unable to sign out."),
      response.status,
    );
  }
}

/** Revokes every session for this user — every device, everywhere. */
export async function logoutAll(accessToken: string): Promise<void> {
  const response = await fetch(
    `${env.NEXT_PUBLIC_API_URL}/v1/auth/logout-all`,
    {
      method: "POST",
      headers: { Accept: "*/*", Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new AuthApiError(
      await readErrorMessage(response, "Unable to sign out everywhere."),
      response.status,
    );
  }
}

export async function getMe(accessToken: string): Promise<MeResponse> {
  const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/v1/auth/me`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new AuthApiError(
      await readErrorMessage(response, "Unable to load your account."),
      response.status,
    );
  }

  return response.json() as Promise<MeResponse>;
}

export async function changePassword(
  accessToken: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const response = await fetch(
    `${env.NEXT_PUBLIC_API_URL}/v1/auth/change-password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new AuthApiError(
      await readErrorMessage(response, "Unable to change your password."),
      response.status,
    );
  }
}
