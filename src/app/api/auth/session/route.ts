import { NextResponse } from "next/server";
import { getAccessToken, getRefreshToken } from "@/lib/auth/session";

/**
 * Lets the (client-rendered) Navbar know whether the visitor is signed in
 * without forcing every static marketing page into dynamic rendering —
 * the session cookies are httpOnly, so they can't be read from client JS.
 * Treat either token as enough for the marketing header. `refresh` is the
 * more durable signal, but some browsers can temporarily retain only the
 * short-lived access token, which would otherwise incorrectly render the
 * signed-out header state.
 */
export async function GET() {
  const [accessToken, refreshToken] = await Promise.all([
    getAccessToken(),
    getRefreshToken(),
  ]);
  return NextResponse.json(
    { authenticated: Boolean(refreshToken || accessToken) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
