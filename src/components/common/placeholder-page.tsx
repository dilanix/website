import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";

/**
 * Minimal "coming soon" page for routes that exist (so nothing links to a
 * dead `#`) but don't have real content yet — e.g. legal/status pages
 * before there's anything real to publish.
 */
export function PlaceholderPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-1 items-center py-20">
      <Container className="max-w-xl text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-4 text-sm">{children}</p>
      </Container>
    </section>
  );
}
