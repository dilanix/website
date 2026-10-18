"use server";

import { env } from "@/env";
import { getMe } from "@/lib/auth/api";
import { getAccessToken } from "@/lib/auth/session";
import { buildApiReference, fetchOpenApi } from "@/lib/docs/openapi";

export interface TryItRequest {
  operationId: string;
  pathParams: Record<string, string>;
  query: Record<string, string>;
  body: string | null;
  /** The client credential the operation takes (e.g. an ingestion token). */
  credential?: string;
  /** Non-GET requests change data — the caller must have confirmed them. */
  confirmed: boolean;
}

export interface TryItResponse {
  status?: number;
  statusText?: string;
  durationMs?: number;
  body?: string;
  error?: string;
}

const MAX_BODY_BYTES = 256 * 1024;
const MAX_RESPONSE_CHARS = 200_000;
const TIMEOUT_MS = 20_000;
const SAFE_SEGMENT = /^[A-Za-z0-9._~:-]{1,200}$/;

/**
 * Runs one API reference "Try it" request for a signed-in user. Only an
 * operation of the client-facing reference can be called (looked up in Core's
 * own OpenAPI, never taken from the browser), it is sent with the credential
 * the user pasted — never their session — and `{organization_id}` is always
 * the user's own organization.
 */
export async function tryApiRequestAction(
  request: TryItRequest,
): Promise<TryItResponse> {
  try {
    const token = await getAccessToken();
    if (!token) return { error: "Your session has expired. Sign in again." };
    const me = await getMe(token);
    const organizationId = me.organizations[0]?.organization_id;

    const groups = buildApiReference(
      await fetchOpenApi(env.NEXT_PUBLIC_API_URL),
    );
    const operation = groups
      .flatMap((group) => group.operations)
      .find((item) => item.id === request.operationId);
    if (!operation)
      return { error: "This endpoint is not part of the API reference." };
    if (operation.method !== "GET" && !request.confirmed)
      return {
        error:
          "Confirm the request first: it changes data in your organization.",
      };

    let path = operation.path;
    for (const parameter of operation.parameters.filter(
      (item) => item.in === "path",
    )) {
      const value =
        parameter.name === "organization_id"
          ? organizationId
          : request.pathParams[parameter.name]?.trim();
      if (!value)
        return { error: `Fill in the path parameter “${parameter.name}”.` };
      if (!SAFE_SEGMENT.test(value))
        return {
          error: `“${parameter.name}” contains characters a path cannot hold.`,
        };
      path = path.replace(`{${parameter.name}}`, encodeURIComponent(value));
    }
    const query = new URLSearchParams();
    for (const parameter of operation.parameters.filter(
      (item) => item.in === "query",
    )) {
      const value = request.query[parameter.name]?.trim();
      if (value) query.set(parameter.name, value);
      else if (parameter.required)
        return { error: `Fill in the query parameter “${parameter.name}”.` };
    }

    let body: string | undefined;
    if (operation.body) {
      const raw = request.body?.trim() ?? "";
      if (raw) {
        if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES)
          return { error: "The request body is larger than 256 KB." };
        try {
          body = JSON.stringify(JSON.parse(raw));
        } catch {
          return { error: "The request body is not valid JSON." };
        }
      } else if (operation.body.required) {
        return { error: "This endpoint needs a request body." };
      }
    }

    const bearer = request.credential?.trim();
    if (!bearer)
      return {
        error: `Paste your ${operation.credential.label.toLowerCase()} to send this request.`,
      };

    const started = Date.now();
    const response = await fetch(
      `${env.NEXT_PUBLIC_API_URL}${path}${query.size ? `?${query}` : ""}`,
      {
        method: operation.method,
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${bearer}`,
          ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        },
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );
    const durationMs = Date.now() - started;
    const text = await response.text();
    let pretty = text;
    try {
      pretty = text ? JSON.stringify(JSON.parse(text), null, 2) : "";
    } catch {
      // Not JSON — shown as returned.
    }
    return {
      status: response.status,
      statusText: response.statusText,
      durationMs,
      body:
        pretty.length > MAX_RESPONSE_CHARS
          ? `${pretty.slice(0, MAX_RESPONSE_CHARS)}\n… (truncated)`
          : pretty,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError")
      return { error: "Dilanix did not answer within 20 seconds." };
    return {
      error:
        error instanceof Error
          ? error.message
          : "The request could not be sent.",
    };
  }
}
