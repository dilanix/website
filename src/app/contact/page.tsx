import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/data/site";
import { Container } from "@/components/ui/container";
import { ContactForm } from "@/components/contact/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Dilanix.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const settings = await getSiteSettings();

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
          <ContactForm email={settings.email} />
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
