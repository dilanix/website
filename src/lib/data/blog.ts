import { env } from "@/env";
import type { BlogPost } from "@/types";

type ApiBlogPostDto = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content?: string;
  category: string;
  read_time: string;
  author_name: string;
  author_role: string | null;
  status: "draft" | "published" | "archived";
  published_at: string | null;
  cover_image_url: string | null;
  tags: string[];
  sort_order?: number;
};

type ApiBlogListDto = {
  items: ApiBlogPostDto[];
  total: number;
  categories: string[];
};

function formatPublishedAt(value: string | null): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

function isoDate(value: string | null): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function mapDtoToBlogPost(dto: ApiBlogPostDto): BlogPost {
  return {
    slug: dto.slug,
    title: dto.title,
    excerpt: dto.excerpt,
    content: dto.content,
    coverImageUrl: dto.cover_image_url ?? undefined,
    category: dto.category,
    readTime: dto.read_time,
    author: {
      name: dto.author_name,
      role: dto.author_role || "Engineering",
    },
    publishedAt: formatPublishedAt(dto.published_at),
    publishedAtIso: isoDate(dto.published_at),
    status: dto.status === "published" ? "published" : "draft",
  };
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/v1/blog?limit=50`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return [];
    }

    const data = (await res.json()) as ApiBlogListDto;

    return data.items.map(mapDtoToBlogPost);
  } catch {
    return [];
  }
}

export async function getBlogPostBySlug(
  slug: string,
): Promise<BlogPost | undefined> {
  try {
    const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/v1/blog/${slug}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return undefined;
    }

    const data = (await res.json()) as ApiBlogPostDto;

    return mapDtoToBlogPost(data);
  } catch {
    return undefined;
  }
}
