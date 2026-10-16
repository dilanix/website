"use client";

import { useMemo, useState } from "react";
import { KeyRound, Loader2, Plus, Send, Trash2 } from "lucide-react";
import {
  tryApiRequestAction,
  type TryItResponse,
} from "@/app/dashboard/docs/actions";
import { CodeTabs } from "./doc-blocks";
import { cn } from "@/lib/utils";

const CONFIDENCE = { high: 1, medium: 0.75, low: 0.5 } as const;
const EFFORT = {
  "Stop / change a setting": 1,
  Terminate: 1.5,
  "Schedule / resize / snapshot then delete": 2,
  Migrate: 3,
} as const;

/** Recommendations' ranking score, live: saving × confidence ÷ effort. */
export function ScoreCalculator() {
  const [saving, setSaving] = useState(120);
  const [confidence, setConfidence] = useState<keyof typeof CONFIDENCE>("high");
  const [effort, setEffort] = useState<keyof typeof EFFORT>(
    "Stop / change a setting",
  );
  const [verified, setVerified] = useState(true);
  const score =
    (saving * (verified ? CONFIDENCE[confidence] : 0.5)) /
    (verified ? EFFORT[effort] : 2);
  return (
    <div className="border-border-soft bg-dashboard-panel grid gap-5 rounded-3xl border p-5 shadow-[0_20px_50px_var(--shadow-card)] @xl:grid-cols-[1fr_auto]">
      <div className="flex flex-col gap-4 text-sm">
        <label className="flex flex-col gap-2">
          <span className="flex justify-between">
            <span className="text-foreground font-medium">Monthly saving</span>
            <span className="text-accent font-mono">${saving}</span>
          </span>
          <input
            type="range"
            min={0}
            max={1000}
            step={10}
            value={saving}
            onChange={(event) => setSaving(Number(event.target.value))}
            className="accent-accent"
          />
        </label>
        <div className="flex flex-col gap-2">
          <span className="text-foreground font-medium">Review outcome</span>
          <div className="flex gap-1.5">
            {[true, false].map((value) => (
              <button
                key={String(value)}
                type="button"
                onClick={() => setVerified(value)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs transition-colors",
                  verified === value
                    ? "border-accent/60 bg-accent/10 text-accent"
                    : "border-border-soft text-muted-foreground hover:text-foreground",
                )}
              >
                {value ? "Ready to fix" : "Needs your input"}
              </button>
            ))}
          </div>
        </div>
        <div
          className={cn(
            "flex flex-col gap-2 transition-opacity",
            !verified && "pointer-events-none opacity-40",
          )}
        >
          <span className="text-foreground font-medium">Confidence</span>
          <div className="flex gap-1.5">
            {(Object.keys(CONFIDENCE) as (keyof typeof CONFIDENCE)[]).map(
              (value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setConfidence(value)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs capitalize transition-colors",
                    confidence === value
                      ? "border-accent/60 bg-accent/10 text-accent"
                      : "border-border-soft text-muted-foreground hover:text-foreground",
                  )}
                >
                  {value}
                </button>
              ),
            )}
          </div>
        </div>
        <label
          className={cn(
            "flex flex-col gap-2 transition-opacity",
            !verified && "pointer-events-none opacity-40",
          )}
        >
          <span className="text-foreground font-medium">
            Recommended action
          </span>
          <select
            value={effort}
            onChange={(event) =>
              setEffort(event.target.value as keyof typeof EFFORT)
            }
            className="border-border-soft bg-background rounded-lg border px-3 py-2 text-sm"
          >
            {(Object.keys(EFFORT) as (keyof typeof EFFORT)[]).map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="border-accent/30 bg-accent/[0.06] flex min-w-44 flex-col items-center justify-center rounded-2xl border p-5 text-center">
        <span className="text-muted-foreground text-[11px] font-semibold tracking-[0.14em] uppercase">
          Score
        </span>
        <span
          key={score.toFixed(2)}
          className="text-accent animate-toast-in mt-1 font-mono text-4xl font-semibold"
        >
          {score.toFixed(1)}
        </span>
        <span className="text-muted-foreground mt-2 text-[11px]">
          {saving} × {verified ? CONFIDENCE[confidence] : 0.5} ÷{" "}
          {verified ? EFFORT[effort] : 2}
        </span>
        {!verified ? (
          <span className="mt-3 text-[11px] text-amber-600 dark:text-amber-300">
            Ranks below every recommendation that is ready to fix
          </span>
        ) : null}
      </div>
    </div>
  );
}

const SEVERITIES = [
  "trace",
  "debug",
  "info",
  "warn",
  "error",
  "fatal",
] as const;
const LOGS_OPERATION_ID = "post-v1-telemetry-logs";

/** Build a log entry, see the exact request, and send it with your own token. */
export function LogPlayground({ baseUrl }: { baseUrl: string }) {
  const [severity, setSeverity] = useState<(typeof SEVERITIES)[number]>("info");
  const [message, setMessage] = useState("Payment captured");
  const [service, setService] = useState("payments-api");
  const [attributes, setAttributes] = useState<[string, string][]>([
    ["order_id", "A-1042"],
    ["region", "eu-west-1"],
  ]);
  const [token, setToken] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<TryItResponse | null>(null);

  const payload = useMemo(
    () => ({
      logs: [
        {
          timestamp: new Date().toISOString().replace(/\.\d+Z$/, "Z"),
          severity,
          message,
          service_name: service,
          attributes: Object.fromEntries(
            attributes.filter(([key]) => key.trim()),
          ),
        },
      ],
    }),
    [severity, message, service, attributes],
  );
  const json = JSON.stringify(payload, null, 2);

  async function send() {
    setPending(true);
    setResult(
      await tryApiRequestAction({
        operationId: LOGS_OPERATION_ID,
        pathParams: {},
        query: {},
        body: json,
        credential: token,
        confirmed: true,
      }),
    );
    setPending(false);
  }

  const field =
    "border-border-soft bg-background focus:border-accent/60 w-full rounded-lg border px-2.5 py-1.5 text-sm outline-none transition-colors";
  return (
    <div className="grid gap-4 @2xl:grid-cols-2">
      <div className="border-border-soft bg-dashboard-panel flex flex-col gap-3 rounded-3xl border p-5 shadow-[0_20px_50px_var(--shadow-card)]">
        <p className="text-foreground text-sm font-semibold">
          Compose a log entry
        </p>
        <div className="flex flex-wrap gap-1.5">
          {SEVERITIES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setSeverity(value)}
              className={cn(
                "rounded-lg border px-2.5 py-1 font-mono text-[11px] transition-colors",
                severity === value
                  ? "border-accent/60 bg-accent/10 text-accent"
                  : "border-border-soft text-muted-foreground hover:text-foreground",
              )}
            >
              {value}
            </button>
          ))}
        </div>
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">Message</span>
          <input
            className={field}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">Service name</span>
          <input
            className={field}
            value={service}
            onChange={(event) => setService(event.target.value)}
          />
        </label>
        <div className="flex flex-col gap-1.5 text-xs">
          <span className="text-muted-foreground">Attributes</span>
          {attributes.map(([key, value], index) => (
            <div key={index} className="flex gap-1.5">
              <input
                className={cn(field, "font-mono text-xs")}
                value={key}
                placeholder="key"
                onChange={(event) =>
                  setAttributes((current) =>
                    current.map((pair, at) =>
                      at === index ? [event.target.value, pair[1]] : pair,
                    ),
                  )
                }
              />
              <input
                className={cn(field, "font-mono text-xs")}
                value={value}
                placeholder="value"
                onChange={(event) =>
                  setAttributes((current) =>
                    current.map((pair, at) =>
                      at === index ? [pair[0], event.target.value] : pair,
                    ),
                  )
                }
              />
              <button
                type="button"
                aria-label="Remove attribute"
                onClick={() =>
                  setAttributes((current) =>
                    current.filter((_, at) => at !== index),
                  )
                }
                className="text-muted-foreground px-1 hover:text-red-500"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setAttributes((current) => [...current, ["", ""]])}
            className="text-accent flex w-fit items-center gap-1 text-xs hover:underline"
          >
            <Plus size={12} /> Add attribute
          </button>
        </div>
        <label className="mt-1 flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground flex items-center gap-1">
            <KeyRound size={12} /> Ingestion token (only used to send this test
            log)
          </span>
          <input
            type="password"
            autoComplete="off"
            className={cn(field, "font-mono text-xs")}
            placeholder="dtt_…"
            value={token}
            onChange={(event) => setToken(event.target.value)}
          />
        </label>
        <button
          type="button"
          disabled={pending || !token.trim()}
          onClick={() => void send()}
          className="bg-accent text-accent-foreground flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Send size={14} />
          )}
          {pending ? "Sending…" : "Send test log"}
        </button>
        {result ? (
          <p
            role="status"
            className={cn(
              "animate-toast-in rounded-xl border px-3 py-2 text-xs",
              result.status === 202
                ? "border-success/30 bg-success/10 text-success"
                : "border-red-500/30 bg-red-500/10 text-red-500",
            )}
          >
            {result.error ??
              (result.status === 202
                ? `Accepted in ${result.durationMs} ms — ${result.body?.replace(/\s+/g, " ")}`
                : `${result.status} ${result.statusText}: ${result.body}`)}
          </p>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-col gap-3">
        <CodeTabs
          title="Request"
          samples={[
            {
              label: "cURL",
              language: "bash",
              code: `curl -X POST '${baseUrl}/v1/telemetry/logs' \\\n  -H "Authorization: Bearer $DILANIX_INGESTION_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d '${json.replace(/'/g, "'\\''")}'`,
            },
            { label: "JSON body", language: "json", code: json },
          ]}
        />
      </div>
    </div>
  );
}
