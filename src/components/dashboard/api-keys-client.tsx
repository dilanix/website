"use client";
import { useState, useTransition } from "react";
import { Check, Copy, KeyRound, Plus, X } from "lucide-react";
import type { CoreApiKey, CoreProduct } from "@/lib/core/api";
import {
  createApiKeyAction,
  revokeApiKeyAction,
} from "@/app/dashboard/api-keys/actions";
import { EmptyState } from "./primitives";

const formatDate = (value: string | null, fallback = "Never") =>
  value
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(value))
    : fallback;
const expiration = (value: string) => {
  if (value === "never") return null;
  const date = new Date();
  date.setDate(date.getDate() + Number(value));
  return date.toISOString();
};

export function ApiKeysClient({
  initialKeys,
  products,
}: {
  initialKeys: CoreApiKey[];
  products: CoreProduct[];
}) {
  const [keys, setKeys] = useState(initialKeys);
  const [dialog, setDialog] = useState<"form" | "created" | null>(null);
  const [generated, setGenerated] = useState("");
  const [copied, setCopied] = useState(false);
  const [revoke, setRevoke] = useState<CoreApiKey | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  async function copy() {
    await navigator.clipboard.writeText(generated);
    setCopied(true);
  }
  function close() {
    setDialog(null);
    setGenerated("");
    setCopied(false);
    setError("");
  }
  return (
    <>
      <div className="flex justify-end">
        <button
          onClick={() => setDialog("form")}
          className="bg-accent text-accent-foreground inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium"
        >
          <Plus size={15} />
          Create API key
        </button>
      </div>
      {keys.length ? (
        <div className="border-foreground/10 divide-foreground/10 divide-y rounded-xl border">
          {keys.map((key) => (
            <article
              key={key.id}
              className="grid gap-4 p-5 lg:grid-cols-[1.3fr_1fr_1fr_1fr_auto] lg:items-center"
            >
              <div>
                <h2 className="text-sm font-medium">{key.name}</h2>
                <p className="text-muted-foreground mt-1 font-mono text-xs">
                  {key.key_prefix}••••••••
                </p>
              </div>
              {[
                [
                  "Access",
                  key.access_mode === "full"
                    ? "Full access"
                    : "Selected products",
                ],
                ["Created", formatDate(key.created_at)],
                ["Last used", formatDate(key.last_used_at, "Never")],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-muted-foreground text-[10px] tracking-wider uppercase">
                    {label}
                  </p>
                  <p className="mt-1 text-sm">{value}</p>
                </div>
              ))}
              <button
                disabled={!key.is_active}
                onClick={() => setRevoke(key)}
                className="text-muted-foreground hover:text-foreground rounded-md px-2 py-1 text-xs disabled:opacity-40"
              >
                {key.is_active ? "Revoke" : "Revoked"}
              </button>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No API keys"
          description="Create an API key to access Dilanix products programmatically."
        />
      )}
      {dialog ? (
        <div className="bg-background/75 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="api-key-title"
            className="bg-background border-foreground/15 w-full max-w-lg rounded-xl border p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="bg-accent/10 text-accent flex h-9 w-9 items-center justify-center rounded-lg">
                  <KeyRound size={17} />
                </span>
                <h2 id="api-key-title" className="mt-4 text-lg font-semibold">
                  {dialog === "form" ? "Create API key" : "API key created"}
                </h2>
              </div>
              <button
                onClick={close}
                aria-label="Close dialog"
                className="text-muted-foreground p-1"
              >
                <X size={18} />
              </button>
            </div>
            {dialog === "form" ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  setError("");
                  const data = new FormData(event.currentTarget);
                  const accessMode = String(data.get("access")) as
                    "full" | "restricted";
                  startTransition(async () => {
                    const result = await createApiKeyAction({
                      name: String(data.get("name")),
                      accessMode,
                      productIds: data.getAll("products").map(String),
                      expiresAt: expiration(String(data.get("expiration"))),
                    });
                    if (result.error) return setError(result.error);
                    if (result.data) {
                      setGenerated(result.data.key);
                      setKeys((current) => [result.data!, ...current]);
                      setDialog("created");
                    }
                  });
                }}
                className="mt-6 space-y-5"
              >
                <label className="block text-sm">
                  <span className="mb-2 block font-medium">Name</span>
                  <input
                    name="name"
                    required
                    defaultValue="Production Backend"
                    className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 outline-none"
                  />
                </label>
                <fieldset>
                  <legend className="text-sm font-medium">Access mode</legend>
                  <label className="mt-3 flex items-center gap-2 text-sm">
                    <input type="radio" name="access" value="full" /> Full
                    access
                  </label>
                  <label className="mt-2 flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="access"
                      value="restricted"
                      defaultChecked
                    />{" "}
                    Selected products
                  </label>
                  <div className="mt-3 space-y-2">
                    {products.map((product) => (
                      <label
                        key={product.id}
                        className="border-foreground/10 flex items-center gap-2 rounded-lg border p-3 text-sm"
                      >
                        <input
                          type="checkbox"
                          name="products"
                          value={product.id}
                          defaultChecked={product.slug === "costops"}
                        />
                        {product.name}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <label className="block text-sm">
                  <span className="mb-2 block font-medium">Expiration</span>
                  <select
                    name="expiration"
                    className="border-foreground/15 bg-background h-10 w-full rounded-lg border px-3"
                  >
                    <option value="never">Never</option>
                    <option value="30">30 days</option>
                    <option value="90">90 days</option>
                  </select>
                </label>
                {error ? (
                  <p role="alert" className="text-sm text-red-500">
                    {error}
                  </p>
                ) : null}
                <button
                  disabled={pending}
                  className="bg-accent text-accent-foreground w-full rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50"
                >
                  {pending ? "Creating…" : "Create API key"}
                </button>
              </form>
            ) : (
              <div className="mt-5">
                <p className="text-muted-foreground text-sm">
                  Copy this key now. For security, it will not be shown again.
                </p>
                <div className="border-foreground/15 mt-4 flex items-center gap-2 rounded-lg border p-3">
                  <code className="min-w-0 flex-1 overflow-hidden text-sm text-ellipsis">
                    {generated}
                  </code>
                  <button
                    onClick={copy}
                    className="text-accent inline-flex items-center gap-1 text-xs"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <button
                  onClick={close}
                  className="bg-accent text-accent-foreground mt-5 w-full rounded-lg py-2.5 text-sm font-medium"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}
      {revoke ? (
        <div className="bg-background/75 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="revoke-title"
            className="bg-background border-foreground/15 w-full max-w-sm rounded-xl border p-6"
          >
            <h2 id="revoke-title" className="font-semibold">
              Revoke {revoke.name}?
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Applications using this key will immediately lose access.
            </p>
            {error ? (
              <p role="alert" className="mt-3 text-sm text-red-500">
                {error}
              </p>
            ) : null}
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => {
                  setRevoke(null);
                  setError("");
                }}
                className="border-foreground/15 rounded-lg border px-3 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    setError("");
                    const result = await revokeApiKeyAction(revoke.id);
                    if (result.error) return setError(result.error);
                    setKeys((current) =>
                      current.map((item) =>
                        item.id === revoke.id
                          ? {
                              ...item,
                              is_active: false,
                              revoked_at: new Date().toISOString(),
                            }
                          : item,
                      ),
                    );
                    setRevoke(null);
                  })
                }
                className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white disabled:opacity-50"
              >
                {pending ? "Revoking…" : "Revoke key"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
