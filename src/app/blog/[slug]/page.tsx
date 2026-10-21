import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogPostBySlug } from "@/lib/data/blog";
import { siteConfig } from "@/config/site";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, ArrowRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return { title: "Blog" };

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    // Setting `openGraph` here replaces the root one, so it names its image
    // too — the cover, else the site's card.
    openGraph: {
      type: "article",
      url: `/blog/${post.slug}`,
      publishedTime: post.publishedAtIso,
      authors: post.author ? [post.author.name] : undefined,
      section: post.category,
      images: [post.coverImageUrl ?? "/opengraph-image"],
    },
  };
}

export default async function BlogPostPage({
  params,
}: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    ...(post.publishedAtIso ? { datePublished: post.publishedAtIso } : {}),
    ...(post.coverImageUrl ? { image: [post.coverImageUrl] } : {}),
    author: post.author
      ? { "@type": "Person", name: post.author.name }
      : { "@type": "Organization", name: siteConfig.name },
    publisher: {
      "@type": "Organization",
      "@id": `${siteConfig.url}/#organization`,
      name: siteConfig.name,
      logo: `${siteConfig.url}/dilanix-logo.png`,
    },
    mainEntityOfPage: `${siteConfig.url}/blog/${post.slug}`,
  };

  return (
    <article className="py-16 sm:py-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <Container className="max-w-3xl">
        {/* Back navigation */}
        <Link
          href="/blog"
          className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-1.5 font-mono text-xs transition-colors"
        >
          <ArrowLeft size={14} /> Back to all articles
        </Link>

        {/* Article Meta Header */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {post.category && (
              <span className="bg-accent/10 text-accent rounded-full px-3 py-1 font-mono font-semibold">
                {post.category}
              </span>
            )}
            <span className="text-muted-foreground font-mono">
              {post.publishedAt}
            </span>
            {post.readTime && (
              <span className="text-muted-foreground flex items-center gap-1 font-mono">
                <Clock size={12} /> {post.readTime}
              </span>
            )}
          </div>

          <h1 className="text-foreground text-3xl leading-[1.15] font-semibold tracking-tight sm:text-4xl md:text-5xl">
            {post.title}
          </h1>

          <p className="text-muted-foreground pt-2 text-lg leading-relaxed">
            {post.excerpt}
          </p>

          {post.author && (
            <div className="border-foreground/10 flex items-center gap-3 border-t pt-6">
              <div className="bg-accent/15 text-accent flex h-10 w-10 items-center justify-center rounded-full font-bold">
                {post.author.name.charAt(0)}
              </div>
              <div>
                <p className="text-foreground text-sm font-semibold">
                  {post.author.name}
                </p>
                <p className="text-muted-foreground text-xs">
                  {post.author.role}
                </p>
              </div>
            </div>
          )}
        </div>

        {post.coverImageUrl ? (
          <div className="border-foreground/10 relative mt-10 aspect-[16/9] overflow-hidden rounded-2xl border">
            <Image
              src={post.coverImageUrl}
              alt={post.title}
              fill
              priority
              unoptimized
              sizes="(min-width: 768px) 768px, 100vw"
              className="object-cover"
            />
          </div>
        ) : null}

        {/* Article Body */}
        <div className="border-foreground/10 mt-12 border-t pt-10">
          {post.content ? (
            <div className="max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeSanitize]}
                components={{
                  h1: ({ children }) => (
                    <h2 className="text-foreground mt-10 mb-4 text-2xl font-semibold sm:text-3xl">
                      {children}
                    </h2>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-foreground mt-10 mb-4 text-2xl font-semibold sm:text-3xl">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-foreground mt-8 mb-4 text-xl font-semibold sm:text-2xl">
                      {children}
                    </h3>
                  ),
                  h4: ({ children }) => (
                    <h4 className="text-foreground mt-7 mb-3 text-lg font-semibold sm:text-xl">
                      {children}
                    </h4>
                  ),
                  p: ({ children }) => (
                    <p className="text-muted-foreground my-5 text-base leading-relaxed sm:text-lg">
                      {children}
                    </p>
                  ),
                  strong: ({ children }) => (
                    <strong className="text-foreground font-semibold">
                      {children}
                    </strong>
                  ),
                  em: ({ children }) => (
                    <em className="text-foreground/90 italic">{children}</em>
                  ),
                  del: ({ children }) => (
                    <del className="text-muted-foreground line-through">
                      {children}
                    </del>
                  ),
                  ul: ({ children }) => (
                    <ul className="text-muted-foreground my-5 list-outside list-disc space-y-2 pl-6">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="text-muted-foreground my-5 list-outside list-decimal space-y-2 pl-6">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-foreground/90 pl-1 text-base leading-relaxed sm:text-lg">
                      {children}
                    </li>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-accent/60 text-muted-foreground my-6 border-l-4 pl-5 italic">
                      {children}
                    </blockquote>
                  ),
                  hr: () => <hr className="border-foreground/10 my-10" />,
                  a: ({ href, children }) => {
                    const external = href?.startsWith("http");

                    return (
                      <a
                        href={href}
                        target={external ? "_blank" : undefined}
                        rel={external ? "noreferrer" : undefined}
                        className="text-accent underline decoration-current/40 underline-offset-4 transition-opacity hover:opacity-80"
                      >
                        {children}
                      </a>
                    );
                  },
                  pre: ({ children }) => (
                    <pre className="border-foreground/10 bg-foreground/[0.04] my-6 overflow-x-auto rounded-xl border p-5 text-sm leading-relaxed">
                      {children}
                    </pre>
                  ),
                  code: ({ children }) => (
                    <code className="bg-foreground/[0.06] text-foreground rounded px-1.5 py-0.5 font-mono text-[0.9em]">
                      {children}
                    </code>
                  ),
                  table: ({ children }) => (
                    <div className="my-7 overflow-x-auto">
                      <table className="border-foreground/10 w-full border-collapse border text-sm">
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="border-foreground/10 bg-foreground/[0.04] border px-4 py-3 text-left font-semibold">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border-foreground/10 border px-4 py-3">
                      {children}
                    </td>
                  ),
                }}
              >
                {post.content}
              </ReactMarkdown>
            </div>
          ) : null}
        </div>

        {/* Bottom CTA Box */}
        <div className="border-accent/30 bg-accent/[0.04] mt-16 flex flex-col items-center justify-between gap-6 rounded-2xl border p-8 text-center sm:flex-row sm:text-left">
          <div>
            <span className="text-accent font-mono text-xs font-semibold tracking-wider uppercase">
              Get In Touch
            </span>
            <h3 className="text-foreground mt-1 text-xl font-semibold">
              Explore custom infrastructure software with Dilanix
            </h3>
            <p className="text-muted-foreground mt-2 max-w-md text-xs sm:text-sm">
              We partner with high-scale engineering organizations to build
              focused solutions.
            </p>
          </div>

          <Button
            href="/contact"
            variant="primary"
            className="shrink-0 px-5 py-2.5 text-sm"
          >
            Contact Engineering <ArrowRight size={14} />
          </Button>
        </div>
      </Container>
    </article>
  );
}
