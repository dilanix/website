import type { Metadata, Route } from "next";
import Link from "next/link";
import { getBlogPosts } from "@/lib/data/blog";
import { Container } from "@/components/ui/container";
import { ArrowRight, Clock, BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog & Engineering Notes — Dilanix",
  description:
    "Technical articles, cloud optimization guides, and AI unit economics insights from the Dilanix engineering team.",
  alternates: { canonical: "/blog" },
};

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <div className="flex flex-col">
      {/* Blog Header */}
      <section className="border-foreground/5 bg-foreground/[0.015] relative border-b py-16 sm:py-24">
        <Container>
          <div className="max-w-3xl">
            <div className="text-accent flex items-center gap-2 font-mono text-xs font-medium tracking-widest uppercase">
              <BookOpen size={14} />
              <span>Engineering Publications</span>
            </div>
            <h1 className="text-foreground mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Dilanix Blog & Engineering Insights
            </h1>
            <p className="text-muted-foreground mt-4 text-base leading-relaxed sm:text-lg">
              Deep dives on AI token optimization, multi-cloud cost
              architecture, detecting ghost infrastructure, and building
              high-efficiency distributed systems.
            </p>
          </div>
        </Container>
      </section>

      {/* Post Grid */}
      <section className="py-16 sm:py-24">
        <Container>
          <div className="grid gap-8 md:grid-cols-2">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="group border-foreground/10 bg-card-strong hover:border-foreground/25 flex flex-col justify-between rounded-2xl border p-6 transition-all duration-300 hover:shadow-xl hover:shadow-black/5 sm:p-8"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    {post.category ? (
                      <span className="bg-accent/10 text-accent rounded-full px-2.5 py-1 font-mono font-medium">
                        {post.category}
                      </span>
                    ) : null}
                    <div className="text-muted-foreground flex items-center gap-3 font-mono">
                      <span>{post.publishedAt}</span>
                      {post.readTime ? (
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {post.readTime}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <h2 className="text-foreground group-hover:text-accent mt-5 text-xl leading-snug font-semibold tracking-tight transition-colors sm:text-2xl">
                    <Link href={`/blog/${post.slug}` as Route}>
                      {post.title}
                    </Link>
                  </h2>

                  <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>

                <div className="border-foreground/5 mt-8 flex items-center justify-between border-t pt-6">
                  {post.author ? (
                    <div className="flex items-center gap-2">
                      <div className="bg-foreground/10 text-foreground flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold">
                        {post.author.name.charAt(0)}
                      </div>
                      <div className="text-xs">
                        <p className="text-foreground font-medium">
                          {post.author.name}
                        </p>
                        <p className="text-muted-foreground text-[11px]">
                          {post.author.role}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  <Link
                    href={`/blog/${post.slug}` as Route}
                    className="text-accent flex items-center gap-1 text-xs font-semibold transition-transform group-hover:translate-x-1"
                  >
                    Read article <ArrowRight size={13} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>
    </div>
  );
}
