import type { Metadata } from "next";
import Link from "next/link";
import { getDashboardSession } from "@/lib/dashboard/session";
import {
  PageHeader,
  Section,
  StatusBadge,
} from "@/components/dashboard/primitives";
export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};
const inputClass =
  "border-foreground/15 bg-background mt-2 h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-accent";
export default async function SettingsPage() {
  const { me, organization } = await getDashboardSession();
  return (
    <div className="flex max-w-4xl flex-col gap-9">
      <PageHeader
        title="Settings"
        description={
          organization
            ? "Manage your personal profile, organization, and security."
            : "Manage your personal profile and security."
        }
      />
      <Section title="Personal">
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
      {organization ? (
        <Section title="Organization">
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
      ) : null}
      <Section title="Security">
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
  );
}
