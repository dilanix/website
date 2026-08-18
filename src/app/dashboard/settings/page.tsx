import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getMe, AuthApiError } from "@/lib/auth/api";
import { getAccessToken } from "@/lib/auth/session";
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
  const token = await getAccessToken();
  if (!token) redirect("/sign-in");
  let me;
  try {
    me = await getMe(token);
  } catch (error) {
    if (error instanceof AuthApiError) redirect("/api/auth/logout");
    throw error;
  }
  return (
    <div className="flex max-w-4xl flex-col gap-9">
      <PageHeader
        title="Settings"
        description="Manage your personal profile, organization, and security."
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
      <Section title="Organization">
        <div className="border-foreground/10 rounded-xl border p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              Organization name
              <input className={inputClass} defaultValue="Dilanix" />
            </label>
            <label className="text-sm">
              Slug
              <input className={inputClass} defaultValue="dilanix" />
            </label>
          </div>
          <div className="border-foreground/10 mt-6 border-t pt-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Members</h3>
              <button className="border-foreground/15 rounded-lg border px-3 py-2 text-xs font-medium">
                Invite member
              </button>
            </div>
            <div className="divide-foreground/10 mt-3 divide-y">
              {[
                [`${me.first_name} ${me.last_name}`, me.email, "Owner"],
                ["John", "john@example.com", "Member"],
              ].map(([name, email, role]) => (
                <div
                  key={email}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div>
                    <p className="text-sm">{name}</p>
                    <p className="text-muted-foreground text-xs">{email}</p>
                  </div>
                  <StatusBadge>{role}</StatusBadge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>
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
