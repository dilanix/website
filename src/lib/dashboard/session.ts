import "server-only";

import { redirect } from "next/navigation";
import { AuthApiError, getMe } from "@/lib/auth/api";
import { getAccessToken } from "@/lib/auth/session";

export async function getDashboardSession() {
  const token = await getAccessToken();
  if (!token) {
    redirect("/sign-in");
  }

  try {
    const me = await getMe(token);
    return {
      token,
      me,
      organization: me.organizations[0] ?? null,
    };
  } catch (error) {
    if (error instanceof AuthApiError) {
      redirect("/api/auth/logout");
    }
    throw error;
  }
}

export async function requireDashboardOrganization() {
  const session = await getDashboardSession();
  if (!session.organization) {
    redirect("/dashboard/settings");
  }
  return { ...session, organization: session.organization };
}
