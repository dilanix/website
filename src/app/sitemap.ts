import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { getBlogPosts } from "@/lib/data/blog";

const staticRoutes = [
  "",
  "/products",
  "/solutions/aws-cost-optimization",
  "/company",
  "/blog",
  "/contact",
  "/privacy",
  "/terms",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getBlogPosts();
  const blogRoutes = posts.map((post) => `/blog/${post.slug}`);

  return [...staticRoutes, ...blogRoutes].map((path) => ({
    url: `${siteConfig.url}${path}`,
    lastModified: new Date(),
  }));
}
