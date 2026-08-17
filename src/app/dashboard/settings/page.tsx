import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getMe, AuthApiError } from "@/lib/auth/api";
import { getAccessToken } from "@/lib/auth/session";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { signOutAction } from "../actions";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    redirect("/sign-in");
  }

  let me;
  try {
    me = await getMe(accessToken);
  } catch (error) {
    if (error instanceof AuthApiError) {
      redirect("/api/auth/logout");
    }
    throw error;
  }

  return (
    <div className="flex max-w-xl flex-col gap-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your profile and account security.
        </p>
      </div>

      <div>
        <h2 className="text-lg font-semibold tracking-tight">Profile</h2>
        <div className="border-foreground/10 mt-4 rounded-xl border p-5">
          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Name</dt>
              <dd className="text-foreground">
                {me.first_name} {me.last_name}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="text-foreground">{me.email}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Status</dt>
              <dd className="flex gap-2">
                <Badge tone={me.is_verified ? "success" : "neutral"}>
                  {me.is_verified ? "Verified" : "Unverified"}
                </Badge>
                {me.is_superuser ? <Badge tone="accent">Admin</Badge> : null}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold tracking-tight">Security</h2>
        <div className="border-foreground/10 mt-4 flex items-center justify-between gap-4 rounded-xl border p-5">
          <div>
            <p className="text-foreground text-sm font-medium">Password</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Change the password used to sign in.
            </p>
          </div>
          <Link
            href="/change-password"
            className={cn(buttonVariants("secondary"), "shrink-0")}
          >
            Change password
          </Link>
        </div>
      </div>

      <form action={signOutAction}>
        <button type="submit" className={cn(buttonVariants("secondary"))}>
          Sign out
        </button>
      </form>
    </div>
  );
}
