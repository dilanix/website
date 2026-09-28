"use client";

import { useState, type ReactNode } from "react";
import type { Route } from "next";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  CircleCheck,
  CircleDashed,
  ExternalLink,
  Globe,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  CoreConnectionDetail,
  CoreEvidenceKind,
  CoreGraphEdge,
  CoreGraphEvidence,
  CoreGraphNode,
  CoreGraphNodeDetail,
  CoreResourceNeighborhood,
} from "@/lib/core/api";
import { formatPorts } from "@/lib/infrastructure/graph-model";
import { EVIDENCE_STYLES, resourceVisual } from "./resource-visuals";

const RELATIONSHIP_LABELS: Record<string, string> = {
  contains: "contains",
  belongs_to: "belongs to",
  routes_to: "routes to",
  targets: "targets",
  runs: "runs",
  depends_on: "depends on",
  connects_to: "can connect to",
  attached_to: "attached to",
  protected_by: "protected by",
  uses: "uses",
  reads_from: "reads from",
  writes_to: "writes to",
  exposes: "exposes",
  deployed_from: "deployed from",
};

const NETWORK_TYPES = new Set([
  "belongs_to",
  "uses",
  "routes_to",
  "attached_to",
  "exposes",
  "targets",
]);
const SECURITY_TYPES = new Set(["protected_by", "connects_to", "exposes"]);

function dateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

function relative(value: string | null | undefined) {
  if (!value) return "—";
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60000);
  if (!Number.isFinite(minutes)) return value;
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h ago`;
  return `${Math.round(hours / 24)} days ago`;
}

function ResourceTile({
  node,
  size = 40,
}: {
  node: CoreGraphNode;
  size?: number;
}) {
  const visual = resourceVisual(node.resource_type, node.category);
  const Icon = visual.icon;
  return (
    <span
      style={{ width: size, height: size }}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-[0_10px_24px_rgba(0,0,0,0.25)]",
        visual.tile,
      )}
    >
      <Icon size={Math.round(size * 0.48)} />
    </span>
  );
}

function EvidenceChip({ kind }: { kind: CoreEvidenceKind }) {
  const style = EVIDENCE_STYLES[kind];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase"
      style={{
        color: style.color,
        borderColor: `${style.color}55`,
        background: `${style.color}14`,
      }}
    >
      {style.label}
    </span>
  );
}

function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string; count?: number }[];
  active: T;
  onChange: (tab: T) => void;
}) {
  return (
    <div
      className="border-border-soft flex gap-1 overflow-x-auto border-b px-4"
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={tab.id === active}
          onClick={() => onChange(tab.id)}
          className={cn(
            "relative shrink-0 px-2 py-2.5 text-xs whitespace-nowrap transition-colors",
            tab.id === active
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
          {tab.count !== undefined ? (
            <span className="text-muted-foreground ml-1 font-mono text-[10px]">
              {tab.count}
            </span>
          ) : null}
          {tab.id === active ? (
            <span className="bg-accent absolute -bottom-px left-0 h-px w-full" />
          ) : null}
        </button>
      ))}
    </div>
  );
}

function Rows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-x-3 gap-y-2.5 text-xs">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="text-foreground min-w-0 break-words">
            {value ?? "—"}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Shell({
  children,
  onClose,
  header,
}: {
  children: ReactNode;
  onClose: () => void;
  header: ReactNode;
}) {
  return (
    <aside className="border-border-soft bg-dashboard-panel-strong/97 absolute inset-y-3 right-3 z-20 flex w-[min(26rem,calc(100%-1.5rem))] flex-col overflow-hidden rounded-2xl border shadow-[0_24px_70px_var(--shadow-card)] backdrop-blur-xl">
      <div className="flex items-start gap-3 p-4">
        <div className="min-w-0 flex-1">{header}</div>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground hover:bg-foreground/5 rounded-lg p-1.5"
          aria-label="Close inspector"
        >
          <X size={16} />
        </button>
      </div>
      {children}
    </aside>
  );
}

export function InspectorLoading({ onClose }: { onClose: () => void }) {
  return (
    <Shell
      onClose={onClose}
      header={<span className="text-muted-foreground text-sm">Loading…</span>}
    >
      <div className="text-muted-foreground flex flex-1 items-center justify-center">
        <Loader2 className="animate-spin" size={20} />
      </div>
    </Shell>
  );
}

export function InspectorError({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <Shell
      onClose={onClose}
      header={
        <span className="text-sm font-semibold">Unable to load details</span>
      }
    >
      <p className="text-muted-foreground px-4 text-sm">{message}</p>
    </Shell>
  );
}

function RelationshipList({
  resourceId,
  edges,
  peers,
  onSelectResource,
  onSelectRelationship,
}: {
  resourceId: string;
  edges: CoreGraphEdge[];
  peers: Map<string, CoreGraphNode>;
  onSelectResource: (id: string) => void;
  onSelectRelationship: (id: string) => void;
}) {
  if (edges.length === 0) {
    return (
      <p className="text-muted-foreground text-xs">
        No relationships in this view.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-1.5">
      {edges.map((edge) => {
        const outgoing = edge.source_resource_id === resourceId;
        const peer = peers.get(
          outgoing ? edge.target_resource_id : edge.source_resource_id,
        );
        const kinds = [...new Set(edge.evidence.map((item) => item.kind))];
        const label =
          RELATIONSHIP_LABELS[edge.relationship_type] ?? edge.relationship_type;
        const ports = formatPorts(
          edge.evidence
            .filter((item) => "protocol" in item.attributes)
            .map((item) => ({
              protocol: (item.attributes.protocol as string | null) ?? null,
              from_port: (item.attributes.from_port as number | null) ?? null,
              to_port: (item.attributes.to_port as number | null) ?? null,
            })),
        );
        return (
          <li
            key={edge.id}
            className="border-border-soft hover:border-accent/40 flex items-center gap-2.5 rounded-xl border px-2.5 py-2 transition-colors"
          >
            {peer ? (
              <button
                type="button"
                onClick={() => onSelectResource(peer.id)}
                aria-label={`Inspect ${peer.name ?? peer.external_id}`}
                className="shrink-0 rounded-xl"
              >
                <ResourceTile node={peer} size={28} />
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onSelectRelationship(edge.id)}
              className="flex min-w-0 flex-1 items-center gap-2 text-left"
            >
              <span className="min-w-0 flex-1">
                <span className="text-muted-foreground block text-[10px] tracking-wide uppercase">
                  {outgoing ? label : `← ${label}`}
                </span>
                <span className="block truncate text-xs font-medium">
                  {peer?.name ??
                    peer?.external_id ??
                    "Resource outside this view"}
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                {ports ? (
                  <span className="font-mono text-[10px]">{ports}</span>
                ) : null}
                <span className="flex gap-1">
                  {kinds.map((kind) => (
                    <span
                      key={kind}
                      title={EVIDENCE_STYLES[kind].label}
                      className="size-1.5 rounded-full"
                      style={{ background: EVIDENCE_STYLES[kind].color }}
                    />
                  ))}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

type RuleShape = {
  protocol?: string;
  from_port?: number | null;
  to_port?: number | null;
  ipv4_ranges?: string[];
  ipv6_ranges?: string[];
  prefix_list_ids?: string[];
  security_group_ids?: string[];
};

function RuleTable({ title, rules }: { title: string; rules: RuleShape[] }) {
  return (
    <div>
      <p className="text-muted-foreground mb-1.5 text-[11px] font-semibold tracking-wide uppercase">
        {title}
      </p>
      {rules.length === 0 ? (
        <p className="text-muted-foreground text-xs">No rules.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {rules.map((rule, index) => (
            <li
              key={index}
              className="bg-foreground/[0.03] flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs"
            >
              <span className="w-24 shrink-0 font-mono">
                {formatPorts([
                  {
                    protocol: rule.protocol ?? null,
                    from_port: rule.from_port ?? null,
                    to_port: rule.to_port ?? null,
                  },
                ])}
              </span>
              <span className="text-muted-foreground min-w-0 truncate font-mono text-[11px]">
                {[
                  ...(rule.ipv4_ranges ?? []),
                  ...(rule.ipv6_ranges ?? []),
                  ...(rule.security_group_ids ?? []),
                  ...(rule.prefix_list_ids ?? []),
                ].join(", ") || "—"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type ResourceTab =
  "overview" | "network" | "security" | "relationships" | "tags" | "raw";

export function ResourceInspector({
  detail,
  neighborhood,
  onClose,
  onSelectResource,
  onSelectRelationship,
}: {
  detail: CoreGraphNodeDetail;
  neighborhood: CoreResourceNeighborhood;
  onClose: () => void;
  onSelectResource: (id: string) => void;
  onSelectRelationship: (id: string) => void;
}) {
  const [tab, setTab] = useState<ResourceTab>("overview");
  const node = detail.node;
  const visual = resourceVisual(node.resource_type, node.category);
  const peers = new Map(neighborhood.peers.map((peer) => [peer.id, peer]));
  const edges = neighborhood.edges;
  const ingress = Array.isArray(detail.extra.ingress_rules)
    ? (detail.extra.ingress_rules as RuleShape[])
    : null;
  const egress = Array.isArray(detail.extra.egress_rules)
    ? (detail.extra.egress_rules as RuleShape[])
    : null;
  const tags = Object.entries(detail.tags);
  const capacity = Object.entries(detail.capacity);
  const list = (filter: (edge: CoreGraphEdge) => boolean) => (
    <RelationshipList
      resourceId={node.id}
      edges={edges.filter(filter)}
      peers={peers}
      onSelectResource={onSelectResource}
      onSelectRelationship={onSelectRelationship}
    />
  );

  return (
    <Shell
      onClose={onClose}
      header={
        <div className="flex items-center gap-3">
          <ResourceTile node={node} size={44} />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">
              {node.name ?? node.external_id}
            </p>
            <p className="text-muted-foreground truncate text-xs">
              {visual.label} ·{" "}
              <span className="font-mono">{node.provider_resource_type}</span>
            </p>
          </div>
        </div>
      }
    >
      <div className="flex items-center gap-2 px-4 pb-3">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
            node.lifecycle_status === "active"
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-400"
              : "border-amber-400/30 bg-amber-400/10 text-amber-400",
          )}
        >
          <span className="size-1.5 rounded-full bg-current" />
          {node.status}
        </span>
        <Link
          href={
            `/dashboard/products/infrastructure/resources/${node.id}?connection=${detail.connection_id}` as Route
          }
          className="text-muted-foreground hover:text-foreground border-border-soft ml-auto inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs"
        >
          Open in Resources <ExternalLink size={12} />
        </Link>
      </div>
      <Tabs<ResourceTab>
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "network", label: "Network" },
          { id: "security", label: "Security" },
          {
            id: "relationships",
            label: "Relationships",
            count: neighborhood.total_edges,
          },
          { id: "tags", label: "Tags", count: tags.length },
          { id: "raw", label: "Raw" },
        ]}
      />
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {tab === "overview" ? (
          <div className="flex flex-col gap-5">
            <Rows
              rows={[
                ["Name", node.name ?? "—"],
                ["Type", visual.label],
                [
                  "Provider type",
                  <span key="t" className="font-mono">
                    {node.provider_resource_type}
                  </span>,
                ],
                [
                  "Identifier",
                  <span key="i" className="font-mono text-[11px]">
                    {node.external_id}
                  </span>,
                ],
                ["Region", node.region],
                ["Zone", detail.zone ?? "—"],
                ["Provider status", node.status],
                ["Inventory state", node.lifecycle_status],
                ["First seen", dateTime(detail.first_seen_at)],
                ["Last seen", dateTime(detail.last_seen_at)],
                [
                  "Provider key",
                  <span key="k" className="font-mono text-[11px]">
                    {detail.provider_resource_key}
                  </span>,
                ],
              ]}
            />
            {capacity.length ? (
              <div>
                <p className="text-muted-foreground mb-2 text-[11px] font-semibold tracking-wide uppercase">
                  Capacity
                </p>
                <Rows
                  rows={capacity.map(([key, value]) => [key, String(value)])}
                />
              </div>
            ) : null}
          </div>
        ) : null}
        {tab === "network"
          ? list((edge) => NETWORK_TYPES.has(edge.relationship_type))
          : null}
        {tab === "security" ? (
          <div className="flex flex-col gap-5">
            {ingress || egress ? (
              <>
                <RuleTable title="Inbound rules" rules={ingress ?? []} />
                <RuleTable title="Outbound rules" rules={egress ?? []} />
              </>
            ) : null}
            {list((edge) => SECURITY_TYPES.has(edge.relationship_type))}
          </div>
        ) : null}
        {tab === "relationships" ? list(() => true) : null}
        {tab === "tags" ? (
          tags.length ? (
            <div className="flex flex-wrap gap-1.5">
              {tags.map(([key, value]) => (
                <span
                  key={key}
                  className="border-border-soft bg-foreground/[0.03] rounded-lg border px-2 py-1 text-xs"
                >
                  <span className="text-muted-foreground">{key}</span>
                  {value ? (
                    <span className="text-foreground">: {value}</span>
                  ) : null}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-xs">No tags.</p>
          )
        ) : null}
        {tab === "raw" ? (
          <pre className="bg-foreground/[0.04] overflow-x-auto rounded-xl p-3 font-mono text-[11px] leading-5">
            {JSON.stringify(detail.extra, null, 2)}
          </pre>
        ) : null}
      </div>
    </Shell>
  );
}

function StatusChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: boolean | null;
  tone: string;
}) {
  const Icon = value ? CircleCheck : CircleDashed;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        value ? "" : "border-border-soft text-muted-foreground",
      )}
      style={
        value
          ? { color: tone, borderColor: `${tone}55`, background: `${tone}14` }
          : undefined
      }
    >
      <Icon size={13} />
      {label}
      {value === null ? (
        <span className="text-[10px]">n/a</span>
      ) : value ? null : (
        <span className="text-[10px]">No</span>
      )}
    </span>
  );
}

function name(node: { name: string | null; external_id: string } | undefined) {
  return node ? (node.name ?? node.external_id) : "a resource";
}

function ruleLabel(attributes: Record<string, unknown>) {
  return formatPorts([
    {
      protocol: (attributes.protocol as string | null) ?? null,
      from_port: (attributes.from_port as number | null) ?? null,
      to_port: (attributes.to_port as number | null) ?? null,
    },
  ]);
}

/** Plain-language reasons, each derived from one piece of stored evidence. */
function explain(
  detail: CoreConnectionDetail,
): { kind: CoreEvidenceKind; text: string }[] {
  const reasons: { kind: CoreEvidenceKind; text: string }[] = [];
  const group = (value: unknown): string | null => {
    if (!value || typeof value !== "object") return null;
    const record = value as { name?: unknown; external_id?: unknown };
    const label = record.name ?? record.external_id;
    return label ? String(label) : null;
  };
  for (const evidence of detail.edge.evidence) {
    const a = evidence.attributes;
    const target = group(a.target_security_group);
    const source = group(a.source_security_group);
    if (evidence.kind === "permitted" && source && target) {
      reasons.push({
        kind: "permitted",
        text: `Security group ${target} allows ${ruleLabel(a)} from ${source}.`,
      });
      if (a.egress_permitted === true)
        reasons.push({
          kind: "permitted",
          text: `Outbound rules of ${source} allow this traffic.`,
        });
      else
        reasons.push({
          kind: "permitted",
          text: `Outbound rules of ${source} were not proven to allow this traffic.`,
        });
      if (a.same_vpc === true)
        reasons.push({
          kind: "permitted",
          text: "Both security groups are in the same VPC.",
        });
    } else if (
      evidence.kind === "permitted" &&
      Array.isArray(a.ranges) &&
      target
    ) {
      reasons.push({
        kind: "permitted",
        text: `Security group ${target} allows ${ruleLabel(a)} from ${a.ranges.join(", ")}.`,
      });
    } else if (
      evidence.kind === "configured" &&
      Array.isArray(a.listeners) &&
      a.listeners.length
    ) {
      const listeners = (a.listeners as { protocol?: string; port?: number }[])
        .map((item) => `${item.protocol ?? ""}:${item.port ?? ""}`)
        .join(", ");
      reasons.push({
        kind: "configured",
        text: `Listeners ${listeners} are configured on ${name(detail.source)}${a.target_port ? `, forwarding to port ${String(a.target_port)}` : ""}.`,
      });
    } else if (
      evidence.kind === "configured" &&
      a.container_port !== undefined
    ) {
      reasons.push({
        kind: "configured",
        text: `${name(detail.target)} registers container ${String(a.container_name ?? "")}:${String(a.container_port)} with ${name(detail.source)}.`,
      });
    } else if (
      evidence.kind === "configured" &&
      Array.isArray(a.destinations)
    ) {
      reasons.push({
        kind: "configured",
        text: `Route ${a.destinations.join(", ")} → ${name(detail.target)}.`,
      });
    } else if (evidence.kind === "configured" && a.public_ip) {
      reasons.push({
        kind: "configured",
        text: `${name(detail.target)} has public address ${String(a.public_ip)} in a subnet routed to the internet.`,
      });
    } else if (evidence.kind === "configured") {
      reasons.push({
        kind: "configured",
        text: `Provider configuration declares: ${name(detail.source)} ${RELATIONSHIP_LABELS[detail.edge.relationship_type] ?? detail.edge.relationship_type} ${name(detail.target)}.`,
      });
    } else if (evidence.kind === "observed") {
      reasons.push({
        kind: "observed",
        text: `Traffic was observed (last ${relative(evidence.last_observed_at)}).`,
      });
    } else if (evidence.kind === "inferred") {
      reasons.push({
        kind: "inferred",
        text: `Inferred from context with ${Math.round((evidence.confidence ?? 0) * 100)}% confidence.`,
      });
    } else if (evidence.kind === "user_confirmed") {
      reasons.push({
        kind: "user_confirmed",
        text: "Confirmed by a member of your organization.",
      });
    }
  }
  if (
    !detail.status.observed &&
    ["connects_to", "exposes"].includes(detail.edge.relationship_type)
  ) {
    reasons.push({
      kind: "observed",
      text: "No traffic has been observed — Dilanix only reports observed communication from telemetry.",
    });
  }
  return reasons;
}

type ConnectionTab = "overview" | "path" | "evidence" | "raw";

export function ConnectionInspector({
  detail,
  hops,
  activeHop,
  onSelectHop,
  onClose,
  onSelectResource,
}: {
  detail: CoreConnectionDetail;
  hops: string[];
  activeHop: string;
  onSelectHop: (id: string) => void;
  onClose: () => void;
  onSelectResource: (id: string) => void;
}) {
  const [tab, setTab] = useState<ConnectionTab>("overview");
  const { edge, source, target, status } = detail;
  const ports = formatPorts(
    edge.evidence
      .filter((item) => "protocol" in item.attributes)
      .map((item) => ({
        protocol: (item.attributes.protocol as string | null) ?? null,
        from_port: (item.attributes.from_port as number | null) ?? null,
        to_port: (item.attributes.to_port as number | null) ?? null,
      })),
  );
  const reasons = explain(detail);
  const sourceVisual = resourceVisual(source.resource_type, source.category);
  const targetVisual = resourceVisual(target.resource_type, target.category);

  return (
    <Shell
      onClose={onClose}
      header={
        <div>
          <p className="flex items-center gap-1.5 text-base font-semibold">
            {sourceVisual.label}{" "}
            <ArrowRight size={15} className="text-muted-foreground" />{" "}
            {targetVisual.label}
          </p>
          <p className="text-muted-foreground text-xs">
            Connection details and evidence
          </p>
        </div>
      }
    >
      <div className="flex flex-col gap-3 px-4 pb-3">
        {hops.length > 1 ? (
          <div className="flex gap-1.5">
            {hops.map((hop, index) => (
              <button
                key={hop}
                type="button"
                onClick={() => onSelectHop(hop)}
                className={cn(
                  "rounded-lg border px-2 py-1 text-[11px]",
                  hop === activeHop
                    ? "border-accent/50 bg-accent/10 text-accent"
                    : "border-border-soft text-muted-foreground",
                )}
              >
                Hop {index + 1}
              </button>
            ))}
          </div>
        ) : null}
        <div className="flex flex-wrap gap-1.5">
          <StatusChip
            label="Configured"
            value={status.configured}
            tone={EVIDENCE_STYLES.configured.color}
          />
          <StatusChip
            label="Reachable"
            value={status.reachable}
            tone={EVIDENCE_STYLES.permitted.color}
          />
          <StatusChip
            label="Observed"
            value={status.observed}
            tone={EVIDENCE_STYLES.observed.color}
          />
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
              status.internet_exposed
                ? "border-sky-400/40 bg-sky-400/10 text-sky-300"
                : "border-border-soft text-muted-foreground",
            )}
          >
            <Globe size={13} /> Internet path:{" "}
            {status.internet_exposed ? "Yes" : "No"}
          </span>
        </div>
        <div className="border-border-soft bg-foreground/[0.02] flex items-center gap-2 rounded-xl border p-2.5">
          <button
            type="button"
            onClick={() => onSelectResource(source.id)}
            className="flex min-w-0 flex-1 items-center gap-2 text-left"
          >
            <ResourceTile node={source} size={30} />
            <span className="min-w-0">
              <span className="block truncate text-xs font-semibold">
                {name(source)}
              </span>
              <span className="text-muted-foreground block truncate text-[10px]">
                {sourceVisual.label}
              </span>
            </span>
          </button>
          <span className="flex flex-col items-center px-1">
            <span className="font-mono text-[10px]">
              {ports ||
                RELATIONSHIP_LABELS[edge.relationship_type] ||
                edge.relationship_type}
            </span>
            <ArrowRight size={14} className="text-muted-foreground" />
          </span>
          <button
            type="button"
            onClick={() => onSelectResource(target.id)}
            className="flex min-w-0 flex-1 items-center gap-2 text-left"
          >
            <ResourceTile node={target} size={30} />
            <span className="min-w-0">
              <span className="block truncate text-xs font-semibold">
                {name(target)}
              </span>
              <span className="text-muted-foreground block truncate text-[10px]">
                {targetVisual.label}
              </span>
            </span>
          </button>
        </div>
      </div>
      <Tabs<ConnectionTab>
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "path", label: "Path" },
          { id: "evidence", label: "Evidence", count: edge.evidence.length },
          { id: "raw", label: "Raw data" },
        ]}
      />
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {tab === "overview" ? (
          <div className="flex flex-col gap-5">
            <Rows
              rows={[
                ["Source", `${name(source)} (${sourceVisual.label})`],
                ["Target", `${name(target)} (${targetVisual.label})`],
                [
                  "Relationship",
                  RELATIONSHIP_LABELS[edge.relationship_type] ??
                    edge.relationship_type,
                ],
                ["Protocol / port", ports || "—"],
                [
                  "Evidence",
                  <span key="e" className="flex flex-wrap gap-1">
                    {[...new Set(edge.evidence.map((item) => item.kind))].map(
                      (kind) => (
                        <EvidenceChip key={kind} kind={kind} />
                      ),
                    )}
                  </span>,
                ],
                ["Last confirmed", relative(edge.last_seen_at)],
                [
                  "Last observed",
                  status.last_observed_at
                    ? relative(status.last_observed_at)
                    : "Never observed",
                ],
                [
                  "Confidence",
                  status.confidence !== null
                    ? `${Math.round(status.confidence * 100)}%`
                    : "—",
                ],
              ]}
            />
            <div>
              <p className="mb-2 text-sm font-semibold">
                Why this connection exists
              </p>
              <ul className="flex flex-col gap-2">
                {reasons.map((reason, index) => (
                  <li key={index} className="flex gap-2 text-xs leading-5">
                    <span
                      className="mt-1.5 size-2 shrink-0 rounded-full"
                      style={{ background: EVIDENCE_STYLES[reason.kind].color }}
                    />
                    <span>{reason.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
        {tab === "path" ? (
          <ol className="flex flex-col items-stretch">
            {detail.path.map((node, index) => (
              <li
                key={`${node.id}-${index}`}
                className="flex flex-col items-center"
              >
                <button
                  type="button"
                  onClick={() => onSelectResource(node.id)}
                  className="border-border-soft hover:border-accent/40 flex w-full items-center gap-2.5 rounded-xl border p-2 text-left"
                >
                  <ResourceTile node={node} size={30} />
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold">
                      {name(node)}
                    </span>
                    <span className="text-muted-foreground block truncate text-[10px]">
                      {resourceVisual(node.resource_type, node.category).label}
                    </span>
                  </span>
                </button>
                {index < detail.path.length - 1 ? (
                  <ArrowDown size={14} className="text-muted-foreground my-1" />
                ) : null}
              </li>
            ))}
          </ol>
        ) : null}
        {tab === "evidence" ? (
          <ul className="flex flex-col gap-2">
            {edge.evidence.map((evidence: CoreGraphEvidence, index) => (
              <li
                key={index}
                className="border-border-soft rounded-xl border p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <EvidenceChip kind={evidence.kind} />
                  <span className="text-muted-foreground font-mono text-[10px]">
                    {evidence.producer}
                  </span>
                </div>
                <p className="text-muted-foreground mt-2 text-[11px]">
                  First {dateTime(evidence.first_observed_at)} · last{" "}
                  {relative(evidence.last_observed_at)}
                  {evidence.confidence !== null
                    ? ` · ${Math.round(evidence.confidence * 100)}% confidence`
                    : ""}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
        {tab === "raw" ? (
          <pre className="bg-foreground/[0.04] overflow-x-auto rounded-xl p-3 font-mono text-[11px] leading-5">
            {JSON.stringify(edge, null, 2)}
          </pre>
        ) : null}
      </div>
    </Shell>
  );
}
