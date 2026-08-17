import { redirect } from "next/navigation";
import { getMe, AuthApiError } from "@/lib/auth/api";
import { getAccessToken } from "@/lib/auth/session";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
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
    <DashboardShell
      user={{
        firstName: me.first_name,
        lastName: me.last_name,
        email: me.email,
      }}
    >
      {children}
    </DashboardShell>
  );
}
