import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogPosts, getBlogPostBySlug } from "@/lib/data/blog";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, ArrowRight } from "lucide-react";

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return { title: "Blog" };

  return {
    title: `${post.title} — Dilanix Blog`,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
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

  return (
    <article className="py-16 sm:py-24">
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

        {/* Article Body */}
        <div className="border-foreground/10 text-foreground/90 mt-12 space-y-6 border-t pt-10 text-base leading-relaxed sm:text-lg">
          {post.content ? (
            <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
              {post.content.split("\n\n").map((paragraph, index) => {
                if (paragraph.startsWith("### ")) {
                  return (
                    <h3
                      key={index}
                      className="text-foreground mt-8 mb-4 text-xl font-semibold sm:text-2xl"
                    >
                      {paragraph.replace("### ", "")}
                    </h3>
                  );
                }
                if (paragraph.startsWith("## ")) {
                  return (
                    <h2
                      key={index}
                      className="text-foreground mt-10 mb-4 text-2xl font-semibold sm:text-3xl"
                    >
                      {paragraph.replace("## ", "")}
                    </h2>
                  );
                }
                if (paragraph.startsWith("# ")) {
                  return null; // already handled by header
                }
                if (paragraph.startsWith("- ")) {
                  const items = paragraph.split("\n- ");
                  return (
                    <ul
                      key={index}
                      className="text-muted-foreground my-4 list-inside list-disc space-y-2"
                    >
                      {items.map((item, i) => (
                        <li key={i} className="text-foreground/90 text-base">
                          {item.replace(/^- /, "")}
                        </li>
                      ))}
                    </ul>
                  );
                }
                if (paragraph.startsWith("---")) {
                  return (
                    <hr key={index} className="border-foreground/10 my-8" />
                  );
                }
                return (
                  <p
                    key={index}
                    className="text-muted-foreground text-base leading-relaxed sm:text-lg"
                  >
                    {paragraph}
                  </p>
                );
              })}
            </div>
          ) : null}
        </div>

        {/* Bottom CTA Box */}
        <div className="border-accent/30 bg-accent/[0.04] mt-16 flex flex-col items-center justify-between gap-6 rounded-2xl border p-8 text-center sm:flex-row sm:text-left">
          <div>
            <span className="text-accent font-mono text-xs font-semibold tracking-wider uppercase">
              Take Action
            </span>
            <h3 className="text-foreground mt-1 text-xl font-semibold">
              Detect cloud waste & LLM inefficiencies with CostOps
            </h3>
            <p className="text-muted-foreground mt-2 max-w-md text-xs sm:text-sm">
              Start your 14-day discovery scan in under 2 minutes with
              zero-agent read-only setup.
            </p>
          </div>

          <Button
            href="/products/costops"
            variant="primary"
            className="shrink-0 px-5 py-2.5 text-sm"
          >
            Explore CostOps <ArrowRight size={14} />
          </Button>
        </div>
      </Container>
    </article>
  );
}
