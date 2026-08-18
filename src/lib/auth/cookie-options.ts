export interface AuthCookieOptions {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  maxAge?: number;
}

/**
 * Keep cookie persistence identical at login and after refresh-token rotation.
 * Without `remember me`, omitting maxAge intentionally creates a browser-session
 * cookie. Persistent cookies use the lifetime supplied by Dilanix Core.
 */
export function authCookieOptions(
  rememberMe: boolean,
  lifetimeSeconds?: number,
): AuthCookieOptions {
  const maxAge = Math.floor(lifetimeSeconds ?? 0);

  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(rememberMe && maxAge > 0 ? { maxAge } : {}),
  };
}
