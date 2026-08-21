import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { cancelChangePasswordAction } from "./actions";
import {
  getAccessToken,
  MUST_CHANGE_PASSWORD_COOKIE,
} from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Change password",
  alternates: { canonical: "/change-password" },
  robots: { index: false, follow: false },
};

export default async function ChangePasswordPage() {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    redirect("/sign-in");
  }

  const cookieStore = await cookies();
  const isForced = cookieStore.get(MUST_CHANGE_PASSWORD_COOKIE)?.value === "1";

  return (
    <section className="flex flex-1 items-center py-20">
      <Container className="max-w-xl">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Change your password
          </h1>
          <p className="text-muted-foreground text-sm">
            {isForced
              ? "This is your first sign-in — set a new password before continuing."
              : "Update the password on your Dilanix account."}
          </p>
        </div>

        <div className="mt-10">
          <ChangePasswordForm />
        </div>

        {isForced ? (
          <form action={cancelChangePasswordAction} className="mt-8">
            <button
              type="submit"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              Sign out instead
            </button>
          </form>
        ) : null}
      </Container>
    </section>
  );
}
