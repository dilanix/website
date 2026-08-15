import type { BlogPost } from "@/types";

const posts: BlogPost[] = [];

/** Stand-in for `GET /api/blog-posts`. Empty until the blog ships. */
export async function getBlogPosts(): Promise<BlogPost[]> {
  return posts;
}
