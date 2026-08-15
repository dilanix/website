import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function SignInPage() {
  return (
    <section className="flex flex-1 items-center py-20">
      <Container className="max-w-xl">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="text-muted-foreground text-sm">
            Sign in to your Dilanix account.
          </p>
        </div>

        <div className="mt-10">
          <SignInForm />
        </div>

        <p className="text-muted-foreground mt-8 text-sm">
          Don&apos;t have access yet?{" "}
          <a href="#" className="text-foreground hover:text-accent">
            Contact us
          </a>
        </p>
      </Container>
    </section>
  );
}
