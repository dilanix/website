import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { getBlogPosts } from "@/lib/data/blog";

const staticRoutes = [
  "",
  "/products",
  "/guides",
  "/solutions/aws-cost-optimization",
  "/company",
  "/blog",
  "/contact",
  "/privacy",
  "/terms",
];

// Static pages carry no `lastModified`: a date that changes on every request
// tells search engines nothing. Articles carry their publication date.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getBlogPosts();

  return [
    ...staticRoutes.map((path) => ({ url: `${siteConfig.url}${path}` })),
    ...posts.map((post) => ({
      url: `${siteConfig.url}/blog/${post.slug}`,
      ...(post.publishedAtIso ? { lastModified: post.publishedAtIso } : {}),
    })),
  ];
}
