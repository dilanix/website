import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = {
  title: "Sign in",
  alternates: { canonical: "/sign-in" },
  robots: { index: false, follow: true },
};

export default async function SignInPage({
  searchParams,
}: PageProps<"/sign-in">) {
  const { "password-changed": passwordChanged } = await searchParams;

  return (
    <section className="flex flex-1 items-center py-20">
      <Container className="max-w-xl">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="text-muted-foreground text-sm">
            Sign in to your Dilanix account.
          </p>
        </div>

        {passwordChanged ? (
          <p className="text-success mt-6 text-sm">
            Password updated — sign in with your new password.
          </p>
        ) : null}

        <div className="mt-10">
          <SignInForm />
        </div>

        <p className="text-muted-foreground mt-8 text-sm">
          Don&apos;t have access yet?{" "}
          <a href="/contact" className="text-foreground hover:text-accent">
            Contact us
          </a>
        </p>
      </Container>
    </section>
  );
}
