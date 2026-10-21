"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronRight,
  KeyRound,
  Loader2,
  Lock,
  Play,
  RotateCcw,
  Search,
  ShieldCheck,
} from "lucide-react";
import {
  tryApiRequestAction,
  type TryItResponse,
} from "@/app/dashboard/docs/actions";
import {
  codeSamples,
  PLANNED_API_GROUPS,
  typeLabel,
  unwrapNullable,
  type ApiGroup,
  type ApiOperation,
  type JsonSchema,
} from "@/lib/docs/openapi";
import { CodeTabs, CopyButton } from "./doc-blocks";
import { cn } from "@/lib/utils";

const METHOD_STYLES: Record<string, string> = {
  GET: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  POST: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-300",
  PUT: "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-300",
  PATCH:
    "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300",
  DELETE: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300",
};

export function MethodBadge({
  method,
  compact,
}: {
  method: string;
  compact?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md border font-mono font-semibold",
        compact ? "w-12 py-0.5 text-[9px]" : "px-2 py-0.5 text-[11px]",
        METHOD_STYLES[method] ?? METHOD_STYLES.GET,
      )}
    >
      {method}
    </span>
  );
}

function PathText({ path }: { path: string }) {
  return (
    <span className="font-mono text-[13px] break-all">
      {path.split(/(\{[^}]+\})/).map((part, index) =>
        part.startsWith("{") ? (
          <span key={index} className="text-accent">
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </span>
  );
}

function SchemaProperty({
  name,
  schema,
  required,
  depth,
}: {
  name: string;
  schema: JsonSchema;
  required: boolean;
  depth: number;
}) {
  const { schema: inner } = unwrapNullable(schema);
  const nested =
    inner.type === "array" ? unwrapNullable(inner.items ?? {}).schema : inner;
  const children = nested.properties ? Object.entries(nested.properties) : [];
  const [open, setOpen] = useState(
    depth < 1 && children.length > 0 && children.length <= 6,
  );
  return (
    <li className="border-border-soft border-b py-2.5 last:border-b-0">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {children.length ? (
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            className="text-muted-foreground hover:text-foreground -ml-1"
          >
            <ChevronRight
              size={13}
              className={cn("transition-transform", open && "rotate-90")}
            />
          </button>
        ) : null}
        <span className="text-foreground font-mono text-[13px] font-medium">
          {name}
        </span>
        <span className="text-muted-foreground font-mono text-[11px]">
          {typeLabel(schema)}
        </span>
        {required ? (
          <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-500">
            required
          </span>
        ) : null}
      </div>
      {inner.description || schema.description ? (
        <p className="text-muted-foreground mt-1 text-[13px] leading-5">
          {inner.description ?? schema.description}
        </p>
      ) : null}
      {inner.enum ? (
        <p className="mt-1 flex flex-wrap gap-1">
          {inner.enum.map((value) => (
            <code
              key={String(value)}
              className="bg-foreground/[0.06] rounded px-1.5 py-0.5 font-mono text-[11px]"
            >
              {String(value)}
            </code>
          ))}
        </p>
      ) : null}
      {open && children.length ? (
        <ul className="border-border-soft animate-toast-in mt-2 ml-1 border-l pl-3">
          {children.map(([childName, child]) => (
            <SchemaProperty
              key={childName}
              name={childName}
              schema={child}
              required={(nested.required ?? []).includes(childName)}
              depth={depth + 1}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function SchemaView({ schema }: { schema: JsonSchema }) {
  const { schema: inner } = unwrapNullable(schema);
  const root =
    inner.type === "array" ? unwrapNullable(inner.items ?? {}).schema : inner;
  const properties = Object.entries(root.properties ?? {});
  if (!properties.length) {
    return (
      <p className="text-muted-foreground font-mono text-xs">
        {typeLabel(schema)}
      </p>
    );
  }
  return (
    <div>
      {inner.type === "array" ? (
        <p className="text-muted-foreground mb-1 text-xs">An array of:</p>
      ) : null}
      <ul>
        {properties.map(([name, child]) => (
          <SchemaProperty
            key={name}
            name={name}
            schema={child}
            required={(root.required ?? []).includes(name)}
            depth={0}
          />
        ))}
      </ul>
    </div>
  );
}

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-border-soft rounded-2xl border p-4">
      <h3 className="text-muted-foreground mb-2 text-[11px] font-semibold tracking-[0.14em] uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

function TryIt({
  operation,
  organizationId,
}: {
  operation: ApiOperation;
  organizationId: string;
}) {
  const initialBody = operation.body
    ? JSON.stringify(operation.body.example ?? {}, null, 2)
    : "";
  const [pathParams, setPathParams] = useState<Record<string, string>>({});
  const [query, setQuery] = useState<Record<string, string>>({});
  const [body, setBody] = useState(initialBody);
  const [credential, setCredential] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<TryItResponse | null>(null);
  const changesData = operation.method !== "GET";

  async function send(confirmed: boolean) {
    setPending(true);
    setConfirming(false);
    setResult(
      await tryApiRequestAction({
        operationId: operation.id,
        pathParams,
        query,
        body: operation.body ? body : null,
        credential,
        confirmed,
      }),
    );
    setPending(false);
  }

  const field =
    "border-border-soft bg-background focus:border-accent/60 w-full rounded-lg border px-2.5 py-1.5 font-mono text-xs outline-none transition-colors";
  return (
    <div className="border-border-soft bg-dashboard-panel flex flex-col gap-3 rounded-2xl border p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold">
          <Play size={14} className="text-accent" /> Try it
        </h3>
        <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
          <ShieldCheck size={12} /> Uses the key you paste, never your session
        </span>
      </div>
      {operation.parameters.map((parameter) => (
        <label
          key={`${parameter.in}-${parameter.name}`}
          className="flex flex-col gap-1 text-xs"
        >
          <span className="text-muted-foreground">
            <span className="text-foreground font-mono">{parameter.name}</span>{" "}
            · {parameter.in}
            {parameter.required ? " · required" : ""}
          </span>
          {parameter.name === "organization_id" ? (
            <span
              className={cn(
                field,
                "text-muted-foreground flex items-center gap-1.5",
              )}
            >
              <Lock size={11} /> {organizationId} (your organization)
            </span>
          ) : (
            <input
              className={field}
              placeholder={
                parameter.schema.enum
                  ? parameter.schema.enum.map(String).join(" | ")
                  : typeLabel(parameter.schema)
              }
              value={
                (parameter.in === "path" ? pathParams : query)[
                  parameter.name
                ] ?? ""
              }
              onChange={(event) =>
                (parameter.in === "path" ? setPathParams : setQuery)(
                  (current) => ({
                    ...current,
                    [parameter.name]: event.target.value,
                  }),
                )
              }
            />
          )}
        </label>
      ))}
      <label className="flex flex-col gap-1 text-xs">
        <span className="text-muted-foreground flex items-center gap-1">
          <KeyRound size={12} /> {operation.credential.label}
        </span>
        <input
          type="password"
          autoComplete="off"
          className={field}
          placeholder={operation.credential.placeholder}
          value={credential}
          onChange={(event) => setCredential(event.target.value)}
        />
      </label>
      {operation.body ? (
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground flex items-center justify-between">
            Request body (JSON)
            <button
              type="button"
              onClick={() => setBody(initialBody)}
              className="hover:text-foreground flex items-center gap-1"
            >
              <RotateCcw size={11} /> Reset
            </button>
          </span>
          <textarea
            rows={Math.min(14, Math.max(4, body.split("\n").length))}
            spellCheck={false}
            className={cn(field, "leading-5")}
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
        </label>
      ) : null}
      {confirming ? (
        <div className="animate-toast-in rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs">
          <p className="flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-300">
            <AlertTriangle size={13} /> This {operation.method} request changes
            real data in your organization.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => void send(true)}
              className="rounded-lg bg-amber-500 px-3 py-1.5 font-medium text-white"
            >
              Send anyway
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="text-muted-foreground hover:text-foreground px-2"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => (changesData ? setConfirming(true) : void send(false))}
          className="bg-accent text-accent-foreground flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium shadow-[0_10px_30px_color-mix(in_oklab,var(--accent)_30%,transparent)] transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Play size={14} />
          )}
          {pending ? "Sending…" : "Send request"}
        </button>
      )}
      {result ? (
        <div className="animate-toast-in overflow-hidden rounded-xl border border-white/10 bg-slate-950">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5 text-[11px]">
            {result.error ? (
              <span className="text-red-400">{result.error}</span>
            ) : (
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 font-mono font-semibold",
                    (result.status ?? 0) < 300
                      ? "bg-emerald-500/20 text-emerald-300"
                      : (result.status ?? 0) < 500
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-red-500/20 text-red-300",
                  )}
                >
                  {result.status} {result.statusText}
                </span>
                <span className="text-slate-400">{result.durationMs} ms</span>
              </span>
            )}
            {result.body ? <CopyButton text={result.body} /> : null}
          </div>
          {result.body ? (
            <pre className="max-h-96 overflow-auto p-3 font-mono text-[11.5px] leading-5 text-slate-200">
              {result.body}
            </pre>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function OperationView({
  operation,
  baseUrl,
  organizationId,
}: {
  operation: ApiOperation;
  baseUrl: string;
  organizationId: string;
}) {
  const samples = useMemo(
    () => codeSamples(operation, baseUrl, organizationId),
    [operation, baseUrl, organizationId],
  );
  const success = operation.responses.find((response) =>
    response.status.startsWith("2"),
  );
  return (
    <div
      key={operation.id}
      className="animate-toast-in grid gap-6 2xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]"
    >
      <div className="flex min-w-0 flex-col gap-5">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {operation.summary}
          </h2>
          <div className="border-border-soft bg-dashboard-panel mt-3 flex items-center gap-2 rounded-xl border px-3 py-2">
            <MethodBadge method={operation.method} />
            <PathText path={operation.path} />
            <CopyButton
              text={`${baseUrl}${operation.path}`}
              className="text-muted-foreground hover:bg-foreground/5 hover:text-foreground ml-auto"
            />
          </div>
          {operation.description ? (
            <p className="text-muted-foreground mt-3 text-sm leading-6 whitespace-pre-line">
              {operation.description}
            </p>
          ) : null}
          <p className="text-muted-foreground mt-3 flex items-center gap-1.5 text-xs">
            <KeyRound size={12} />
            {operation.credential.header}
          </p>
        </div>
        {operation.parameters.length ? (
          <Block title="Parameters">
            <ul>
              {operation.parameters.map((parameter) => (
                <li
                  key={`${parameter.in}-${parameter.name}`}
                  className="border-border-soft border-b py-2.5 last:border-b-0"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-foreground font-mono text-[13px] font-medium">
                      {parameter.name}
                    </span>
                    <span className="text-muted-foreground font-mono text-[11px]">
                      {typeLabel(parameter.schema)}
                    </span>
                    <span className="bg-foreground/[0.06] text-muted-foreground rounded px-1.5 py-0.5 text-[10px]">
                      {parameter.in}
                    </span>
                    {parameter.required ? (
                      <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-500">
                        required
                      </span>
                    ) : null}
                  </div>
                  {parameter.description ? (
                    <p className="text-muted-foreground mt-1 text-[13px] leading-5">
                      {parameter.description}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </Block>
        ) : null}
        {operation.body ? (
          <Block title="Request body">
            <SchemaView schema={operation.body.schema} />
          </Block>
        ) : null}
        {operation.responses.length ? (
          <Block title="Responses">
            <ul className="flex flex-col gap-3">
              {operation.responses.map((response) => (
                <li key={response.status}>
                  <p className="flex items-center gap-2 text-sm">
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 font-mono text-xs font-semibold",
                        response.status.startsWith("2")
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                          : "bg-amber-500/10 text-amber-600",
                      )}
                    >
                      {response.status}
                    </span>
                    <span className="text-muted-foreground">
                      {response.description}
                    </span>
                  </p>
                  {response.schema ? (
                    <div className="mt-2">
                      <SchemaView schema={response.schema} />
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </Block>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-col gap-4 2xl:sticky 2xl:top-24 2xl:h-fit">
        <CodeTabs samples={samples} title="Request" />
        <TryIt operation={operation} organizationId={organizationId} />
        {success?.example !== null && success?.example !== undefined ? (
          <CodeTabs
            samples={[
              {
                label: `${success.status} example`,
                language: "json",
                code: JSON.stringify(success.example, null, 2),
              },
            ]}
            title="Response"
          />
        ) : null}
      </div>
    </div>
  );
}

export function ApiReference({
  groups,
  baseUrl,
  organizationId,
}: {
  groups: ApiGroup[];
  baseUrl: string;
  organizationId: string;
}) {
  const all = useMemo(
    () => groups.flatMap((group) => group.operations),
    [groups],
  );
  const [selectedId, setSelectedId] = useState(all[0]?.id ?? "");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fromHash = window.location.hash.slice(1);
    // Deep links (#operation-id) open that endpoint.
    if (fromHash && all.some((operation) => operation.id === fromHash)) {
      const frame = requestAnimationFrame(() => setSelectedId(fromHash));
      return () => cancelAnimationFrame(frame);
    }
  }, [all]);

  function select(id: string) {
    setSelectedId(id);
    window.history.replaceState(null, "", `#${id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const query = search.trim().toLowerCase();
  const filtered = groups
    .map((group) => ({
      ...group,
      operations: group.operations.filter(
        (operation) =>
          !query ||
          `${operation.method} ${operation.path} ${operation.summary}`
            .toLowerCase()
            .includes(query),
      ),
    }))
    .filter((group) => group.operations.length > 0);
  const selected =
    all.find((operation) => operation.id === selectedId) ?? all[0];
  const group = groups.find((item) =>
    item.operations.some((operation) => operation.id === selected?.id),
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-24 lg:h-[calc(100dvh-7.5rem)] lg:overflow-y-auto lg:pr-1">
        <label className="border-border-soft bg-background/70 focus-within:border-accent/50 mb-3 flex items-center gap-2 rounded-xl border px-3 py-2 text-sm">
          <Search size={14} className="text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Filter endpoints"
            aria-label="Filter endpoints"
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>
        <nav aria-label="Endpoints" className="flex flex-col gap-4 pb-6">
          {filtered.map((item) => (
            <div key={item.id}>
              <p className="text-muted-foreground mb-1 px-1 text-[10px] font-semibold tracking-[0.16em] uppercase">
                {item.title}
              </p>
              <ul className="flex flex-col gap-0.5">
                {item.operations.map((operation) => (
                  <li key={operation.id}>
                    <button
                      type="button"
                      onClick={() => select(operation.id)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-1.5 py-1.5 text-left text-[12.5px] transition-colors",
                        operation.id === selected?.id
                          ? "bg-accent/10 text-foreground"
                          : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground",
                      )}
                    >
                      <MethodBadge method={operation.method} compact />
                      <span className="truncate">{operation.summary}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {filtered.length === 0 ? (
            <p className="text-muted-foreground px-1 text-xs">
              No endpoint matches “{search}”.
            </p>
          ) : null}
          <div>
            <p className="text-muted-foreground mb-1 flex items-center gap-2 px-1 text-[10px] font-semibold tracking-[0.16em] uppercase">
              With an API key
              <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-1.5 py-px text-[9px] tracking-normal text-amber-600 normal-case dark:text-amber-300">
                Planned
              </span>
            </p>
            <ul className="flex flex-col gap-0.5">
              {PLANNED_API_GROUPS.map((item) => (
                <li
                  key={item.id}
                  className="text-muted-foreground flex items-start gap-2 rounded-lg px-1.5 py-1.5 text-[12.5px] opacity-80"
                >
                  <MethodBadge method="GET" compact />
                  <span>
                    <span className="text-foreground/80 block">
                      {item.title}
                    </span>
                    <span className="text-[11px] leading-4">
                      {item.description}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </aside>
      <div className="min-w-0">
        {group ? (
          <p className="text-muted-foreground mb-4 text-sm">
            <span className="text-accent font-medium">{group.title}</span> —{" "}
            {group.description}
          </p>
        ) : null}
        {selected ? (
          <OperationView
            key={selected.id}
            operation={selected}
            baseUrl={baseUrl}
            organizationId={organizationId}
          />
        ) : (
          <p className="text-muted-foreground text-sm">
            The API reference is empty.
          </p>
        )}
      </div>
    </div>
  );
}
