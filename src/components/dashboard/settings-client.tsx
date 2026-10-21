"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { KeyRound, Lock, User as UserIcon, Building2 } from "lucide-react";
import type { MeResponse, OrganizationMembership } from "@/lib/auth/api";
import type { CoreOrganizationCapability } from "@/lib/core/api";
import { Section, StatusBadge } from "./primitives";
import { cn } from "@/lib/utils";

const inputClass =
  "border-foreground/15 bg-background mt-2 h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-accent";

export type SettingsTab =
  "personal" | "organization" | "capabilities" | "security";

/** "active" reads as available now; "pending"/"expired" still need a status
 * distinct from a flat-out "disabled" grant (or no grant at all), so the
 * reader can tell a lapsed window from something never turned on. */
function capabilityStatusTone(
  status: CoreOrganizationCapability["access_status"],
): "success" | "neutral" | "warning" {
  if (status === "active") return "success";
  if (status === "expired") return "warning";
  return "neutral";
}

function domainLabel(domain: string | null) {
  if (!domain) return "Other";
  if (domain === "products") return "Products";
  if (domain === "providers") return "Cloud Providers";
  if (domain.startsWith("integrations.")) {
    const provider = domain.slice("integrations.".length);
    return `${provider.toUpperCase()} Capabilities`;
  }
  return domain;
}

function groupByDomain(capabilities: CoreOrganizationCapability[]) {
  const groups = new Map<string, CoreOrganizationCapability[]>();
  for (const capability of capabilities) {
    const key = capability.domain ?? "";
    const existing = groups.get(key);
    if (existing) {
      existing.push(capability);
    } else {
      groups.set(key, [capability]);
    }
  }
  return Array.from(groups.entries());
}

export function SettingsClient({
  initialTab,
  me,
  organization,
  capabilities,
}: {
  initialTab: SettingsTab;
  me: MeResponse;
  organization: OrganizationMembership | null;
  capabilities: CoreOrganizationCapability[];
}) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  useEffect(() => {
    function syncTabFromHistory() {
      const requested = new URL(window.location.href).searchParams.get("tab");
      setActiveTab(
        requested === "organization" ||
          requested === "capabilities" ||
          requested === "security"
          ? requested
          : "personal",
      );
    }
    window.addEventListener("popstate", syncTabFromHistory);
    return () => window.removeEventListener("popstate", syncTabFromHistory);
  }, []);

  function selectTab(tab: SettingsTab) {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    if (tab === "personal") url.searchParams.delete("tab");
    else url.searchParams.set("tab", tab);
    window.history.pushState(null, "", url);
  }

  const tabs: { id: SettingsTab; label: string; icon: typeof UserIcon }[] = [
    { id: "personal", label: "Personal", icon: UserIcon },
    ...(organization
      ? ([
          { id: "organization", label: "Organization", icon: Building2 },
          { id: "capabilities", label: "Capabilities", icon: KeyRound },
        ] as const)
      : []),
    { id: "security", label: "Security", icon: Lock },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="border-foreground/10 border-b">
        <nav
          className="-mb-px flex gap-1 overflow-x-auto sm:gap-2"
          aria-label="Settings sections"
          role="tablist"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`settings-tab-${tab.id}`}
                aria-controls={`settings-panel-${tab.id}`}
                aria-selected={active}
                onClick={() => selectTab(tab.id)}
                className={cn(
                  "inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors",
                  active
                    ? "border-accent text-accent font-semibold"
                    : "text-muted-foreground hover:border-foreground/20 hover:text-foreground border-transparent",
                )}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {activeTab === "personal" ? (
        <div
          id="settings-panel-personal"
          role="tabpanel"
          aria-labelledby="settings-tab-personal"
        >
          <Section title="Profile">
            <form className="border-foreground/10 grid gap-4 rounded-xl border p-5 sm:grid-cols-2">
              <label className="text-sm">
                First name
                <input className={inputClass} defaultValue={me.first_name} />
              </label>
              <label className="text-sm">
                Last name
                <input className={inputClass} defaultValue={me.last_name} />
              </label>
              <label className="text-sm sm:col-span-2">
                Email
                <input
                  type="email"
                  className={inputClass}
                  defaultValue={me.email}
                />
              </label>
              <button
                type="button"
                className="bg-accent text-accent-foreground justify-self-start rounded-lg px-4 py-2 text-sm font-medium"
              >
                Save changes
              </button>
            </form>
          </Section>
        </div>
      ) : null}

      {activeTab === "organization" && organization ? (
        <div
          id="settings-panel-organization"
          role="tabpanel"
          aria-labelledby="settings-tab-organization"
        >
          <Section title="Organization details">
            <div className="border-foreground/10 rounded-xl border p-5">
              <p className="text-sm font-medium">
                {organization.organization_name}
              </p>
              <div className="border-foreground/10 mt-5 flex items-center justify-between gap-4 border-t pt-5">
                <div>
                  <p className="text-sm">{`${me.first_name} ${me.last_name}`}</p>
                  <p className="text-muted-foreground text-xs">{me.email}</p>
                </div>
                <StatusBadge>
                  {organization.role.charAt(0).toUpperCase() +
                    organization.role.slice(1)}
                </StatusBadge>
              </div>
            </div>
          </Section>
        </div>
      ) : null}

      {activeTab === "capabilities" && organization ? (
        <div
          id="settings-panel-capabilities"
          role="tabpanel"
          aria-labelledby="settings-tab-capabilities"
        >
          <Section title="Granted capabilities">
            <p className="text-muted-foreground -mt-2 mb-4 text-xs">
              What Dilanix currently makes available to your organization.
              Contact Dilanix to change any of these.
            </p>
            {capabilities.length ? (
              <div className="flex flex-col gap-5">
                {groupByDomain(capabilities).map(([domain, items]) => (
                  <div
                    key={domain || "other"}
                    className="border-foreground/10 rounded-xl border p-5"
                  >
                    <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                      {domainLabel(domain || null)}
                    </p>
                    <div className="border-foreground/10 divide-foreground/10 mt-3 divide-y">
                      {items.map((capability) => (
                        <div
                          key={capability.id}
                          className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                        >
                          <div>
                            <p className="text-sm">{capability.name}</p>
                            <p className="text-muted-foreground mt-0.5 font-mono text-xs">
                              {capability.code}
                            </p>
                          </div>
                          <StatusBadge
                            status={capabilityStatusTone(
                              capability.access_status,
                            )}
                          >
                            {capability.access_status.charAt(0).toUpperCase() +
                              capability.access_status.slice(1)}
                          </StatusBadge>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                No capabilities have been catalogued yet.
              </p>
            )}
          </Section>
        </div>
      ) : null}

      {activeTab === "security" ? (
        <div
          id="settings-panel-security"
          role="tabpanel"
          aria-labelledby="settings-tab-security"
        >
          <Section title="Account security">
            <div className="border-foreground/10 divide-foreground/10 divide-y rounded-xl border">
              {[
                ["Password", "Change the password used to sign in."],
                [
                  "Two-factor authentication",
                  "Add another layer of protection to your account.",
                ],
                [
                  "Active sessions",
                  "Review devices currently signed in to your account.",
                ],
              ].map(([title, desc], index) => (
                <div
                  key={title}
                  className="flex items-center justify-between gap-4 p-5"
                >
                  <div>
                    <p className="text-sm font-medium">{title}</p>
                    <p className="text-muted-foreground mt-1 text-xs">{desc}</p>
                  </div>
                  {index === 0 ? (
                    <Link
                      href="/change-password"
                      className="border-foreground/15 rounded-lg border px-3 py-2 text-xs font-medium"
                    >
                      Change
                    </Link>
                  ) : (
                    <button disabled className="text-muted-foreground text-xs">
                      Coming soon
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Section>
        </div>
      ) : null}
    </div>
  );
}
