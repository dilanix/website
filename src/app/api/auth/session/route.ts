import { NextResponse } from "next/server";
import { getRefreshToken } from "@/lib/auth/session";

/**
 * Lets the (client-rendered) Navbar know whether the visitor is signed in
 * without forcing every static marketing page into dynamic rendering —
 * the session cookies are httpOnly, so they can't be read from client JS.
 * Keyed off the refresh token rather than the access token: the access
 * token can be momentarily absent while `proxy.ts` is rotating it, but the
 * user is still very much signed in.
 */
export async function GET() {
  const token = await getRefreshToken();
  return NextResponse.json(
    { authenticated: Boolean(token) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
