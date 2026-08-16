import type { Metadata } from "next";
import { getBlogPosts } from "@/lib/data/blog";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Blog",
  description: "Engineering notes and updates from Dilanix.",
  alternates: { canonical: "/blog" },
};

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <section className="py-20 sm:py-28">
      <Container className="max-w-3xl">
        <div className="flex flex-col gap-3 text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Blog
          </h1>
          <p className="text-muted-foreground text-lg">
            Notes on what we&apos;re building and why.
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="border-foreground/10 mt-16 rounded-xl border border-dashed p-12 text-center">
            <p className="text-muted-foreground text-sm">
              Ideas, engineering notes, and updates from Dilanix will appear
              here.
            </p>
          </div>
        ) : (
          <ul className="mt-16 flex flex-col gap-8">
            {posts.map((post) => (
              <li
                key={post.slug}
                className="border-foreground/10 border-b pb-8 last:border-b-0"
              >
                <p className="text-muted-foreground text-xs">
                  {post.publishedAt}
                </p>
                <h2 className="text-foreground mt-1 text-xl font-medium">
                  {post.title}
                </h2>
                <p className="text-muted-foreground mt-2 text-sm">
                  {post.excerpt}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}
