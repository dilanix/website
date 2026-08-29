import { env } from "@/env";
import { getAccessToken } from "@/lib/auth/session";
import { getMe } from "@/lib/auth/api";

export const dynamic = "force-dynamic";

/**
 * Same-origin proxy for Dilanix Core's live sync-progress stream
 * (`GET .../syncs/{sync_run_id}/events`, Server-Sent Events).
 *
 * The session's access token lives in an httpOnly cookie (`lib/auth/session.ts`)
 * and is never readable from client JS, so the browser's native `EventSource`
 * — which cannot set an `Authorization` header anyway — cannot call Core
 * directly. This route runs server-side, attaches the token from the cookie,
 * and pipes Core's response stream straight back to the browser; the browser
 * only ever needs the same-origin session cookie it already sends
 * automatically. No new persistence or message bus — this is a pass-through.
 */
export async function GET(
  _request: Request,
  context: RouteContext<"/api/sync/[connectionId]/[syncRunId]/events">,
) {
  const { connectionId, syncRunId } = await context.params;

  const token = await getAccessToken();
  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  let organizationId: string;
  try {
    const me = await getMe(token);
    const organization = me.organizations[0];
    if (!organization) {
      return new Response("Your account does not belong to an organization.", {
        status: 403,
      });
    }
    organizationId = organization.organization_id;
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  const upstream = await fetch(
    `${env.NEXT_PUBLIC_API_URL}/v1/organizations/${organizationId}/integrations/connections/${connectionId}/syncs/${syncRunId}/events`,
    {
      headers: {
        Accept: "text/event-stream",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );

  if (!upstream.ok || !upstream.body) {
    return new Response(
      upstream.status === 404
        ? "Sync run not found"
        : "Unable to open sync progress stream",
      { status: upstream.status || 502 },
    );
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
