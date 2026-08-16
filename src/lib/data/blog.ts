import type { BlogPost } from "@/types";

const posts: BlogPost[] = [];

// TODO: replace with `fetch(`${env.NEXT_PUBLIC_API_URL}/blog-posts`)` once the backend ships. Empty until then.
export async function getBlogPosts(): Promise<BlogPost[]> {
  return posts.filter((post) => post.status === "published");
}
