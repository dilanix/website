import { afterEach, describe, expect, it, vi } from "vitest";
import type { BlogPost } from "@/types";

vi.mock("@/env", () => ({ env: { NEXT_PUBLIC_API_URL: "https://core.test" } }));

const post: BlogPost = {
  slug: "rightsizing-rds",
  title: "Rightsizing RDS safely",
  excerpt: "How Dilanix checks a database before it suggests a smaller size.",
  category: "Engineering",
  author: { name: "Alex Morgan", role: "Engineering" },
  publishedAt: "Oct 01, 2026",
  publishedAtIso: "2026-10-01T10:00:00.000Z",
  status: "published",
};

vi.mock("@/lib/data/blog", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/data/blog")>()),
  getBlogPosts: vi.fn(async () => [post]),
  getBlogPostBySlug: vi.fn(async () => post),
}));

const { siteConfig } = await import("@/config/site");
const { default: sitemap } = await import("./sitemap");
const { generateMetadata } = await import("./blog/[slug]/page");
const blogData =
  await vi.importActual<typeof import("@/lib/data/blog")>("@/lib/data/blog");

afterEach(() => vi.unstubAllGlobals());

describe("SEO", () => {
  it("uses the origin the apex domain redirects to", () => {
    expect(siteConfig.url).toBe("https://www.dilanix.org");
  });

  it("lists pages on the canonical origin, dating only articles", async () => {
    const entries = await sitemap();
    for (const entry of entries)
      expect(entry.url.startsWith(siteConfig.url)).toBe(true);
    expect(entries.find((entry) => entry.url === siteConfig.url)).toEqual({
      url: siteConfig.url,
    });
    expect(
      entries.find((entry) => entry.url.endsWith(`/blog/${post.slug}`)),
    ).toEqual({
      url: `${siteConfig.url}/blog/${post.slug}`,
      lastModified: post.publishedAtIso,
    });
  });

  it("gives an article its own title and card, falling back to the site's image", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: post.slug }),
    } as Parameters<typeof generateMetadata>[0]);
    expect(metadata.title).toBe(post.title);
    expect(metadata.alternates?.canonical).toBe(`/blog/${post.slug}`);
    expect(metadata.openGraph).toMatchObject({
      type: "article",
      publishedTime: post.publishedAtIso,
      images: ["/opengraph-image"],
    });
  });

  it("keeps an article's publication date as ISO 8601", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          items: [
            {
              id: "1",
              slug: "a",
              title: "A",
              excerpt: "",
              category: "",
              read_time: "",
              author_name: "",
              author_role: null,
              status: "published",
              published_at: "2026-10-01T10:00:00Z",
              cover_image_url: null,
              tags: [],
            },
            {
              id: "2",
              slug: "b",
              title: "B",
              excerpt: "",
              category: "",
              read_time: "",
              author_name: "",
              author_role: null,
              status: "published",
              published_at: null,
              cover_image_url: null,
              tags: [],
            },
          ],
          total: 2,
          categories: [],
        }),
      ),
    );
    const [dated, undated] = await blogData.getBlogPosts();
    expect(dated.publishedAtIso).toBe("2026-10-01T10:00:00.000Z");
    expect(undated.publishedAtIso).toBeUndefined();
  });
});
