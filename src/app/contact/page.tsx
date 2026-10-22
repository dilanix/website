import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/data/site";
import { Container } from "@/components/ui/container";
import { ContactForm } from "@/components/contact/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Talk to the Dilanix team — book a demo of AWS cost optimization and infrastructure mapping on your own account, or ask us anything.",
  alternates: { canonical: "/contact" },
};

function planName(code: string | string[] | undefined) {
  if (typeof code !== "string" || !/^[a-z0-9_-]{1,63}$/.test(code)) return null;
  return code
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function ContactPage({
  searchParams,
}: PageProps<"/contact">) {
  const [settings, params] = await Promise.all([
    getSiteSettings(),
    searchParams,
  ]);
  const plan = planName(params.plan);
  // "upgrade" comes from the dashboard's plan page rather than a pricing card.
  const planChange = params.plan === "upgrade";

  return (
    <section className="flex flex-1 items-center py-20">
      <Container className="max-w-xl">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Contact</h1>
          <p className="text-muted-foreground text-sm">
            Tell us what you&apos;re working on — we read every message.
          </p>
        </div>

        <div className="mt-10">
          <ContactForm
            email={settings.email}
            initialSubject={
              planChange ? "Plan change" : plan ? `${plan} plan` : undefined
            }
            initialMessage={
              planChange
                ? "We'd like to change our Dilanix plan. What we need: "
                : plan
                  ? `We're interested in the ${plan} plan. A bit about our cloud setup: `
                  : undefined
            }
          />
        </div>

        <p className="text-muted-foreground mt-8 text-sm">
          You can also reach us directly at{" "}
          <a
            href={`mailto:${settings.email}`}
            className="text-foreground hover:text-accent"
          >
            {settings.email}
          </a>
        </p>
      </Container>
    </section>
  );
}
