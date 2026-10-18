import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { env } from "@/env";
import { requireDashboardOrganization } from "@/lib/dashboard/session";
import { findDocsPage } from "@/content/docs/registry";
import { DOCS_PAGE_COMPONENTS } from "@/content/docs/pages";
import { DocHero } from "@/components/docs/doc-blocks";
import { ApiReference } from "@/components/docs/api-reference";
import { buildApiReference, fetchOpenApi } from "@/lib/docs/openapi";

export async function generateMetadata({
  params,
}: PageProps<"/dashboard/docs/[slug]">): Promise<Metadata> {
  const page = findDocsPage((await params).slug);
  return {
    title: page ? `${page.title} — Documentation` : "Documentation",
    robots: { index: false, follow: false },
  };
}

export default async function DocsPage({
  params,
}: PageProps<"/dashboard/docs/[slug]">) {
  const { slug } = await params;
  const page = findDocsPage(slug);
  if (!page) notFound();
  const { organization } = await requireDashboardOrganization();
  const baseUrl = env.NEXT_PUBLIC_API_URL;

  if (slug === "api-reference") {
    let groups;
    try {
      groups = buildApiReference(await fetchOpenApi(baseUrl));
    } catch {
      groups = null;
    }
    return (
      <>
        <DocHero
          eyebrow="Developers"
          icon="braces"
          title="API reference"
          description={page.description}
        />
        {groups ? (
          <ApiReference
            groups={groups}
            baseUrl={baseUrl}
            organizationId={organization.organization_id}
          />
        ) : (
          <p className="text-muted-foreground text-sm">
            The API description could not be loaded right now. Try again in a
            moment.
          </p>
        )}
      </>
    );
  }

  const Page = DOCS_PAGE_COMPONENTS[slug];
  if (!Page) notFound();
  return (
    <Page baseUrl={baseUrl} organizationId={organization.organization_id} />
  );
}
