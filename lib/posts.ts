import { cache } from "react";
import { getNotionPosts } from "./notion";

export type Post = {
  slug: string;
  title: string;
  description: string;
  /** ISO 8601 publication date. */
  date: string;
  /** ISO 8601 date of the last meaningful edit, if any. */
  updated?: string;
  author: string;
  tags: string[];
  readingMinutes: number;
  html: string;
};

export type Tag = {
  name: string;
  slug: string;
  count: number;
};

export function tagSlug(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Every published post, newest first, sourced from the Notion database.
 * Memoized so that a request rendering the page, its metadata and its OG image
 * only loads the content once.
 */
export const getPosts = cache(async (): Promise<Post[]> => {
  const posts = await getNotionPosts();
  return [...posts].sort((a, b) => b.date.localeCompare(a.date));
});

export const getPost = cache(async (slug: string): Promise<Post | undefined> => {
  const posts = await getPosts();
  return posts.find((post) => post.slug === slug);
});

/** The posts published just before and just after `slug`, for in-article links. */
export async function getAdjacentPosts(slug: string) {
  const posts = await getPosts();
  const index = posts.findIndex((post) => post.slug === slug);
  return {
    newer: index > 0 ? posts[index - 1] : undefined,
    older: index >= 0 && index < posts.length - 1 ? posts[index + 1] : undefined,
  };
}

export async function getTags(): Promise<Tag[]> {
  const posts = await getPosts();
  const bySlug = new Map<string, Tag>();

  for (const post of posts) {
    for (const name of post.tags) {
      const slug = tagSlug(name);
      const existing = bySlug.get(slug);
      if (existing) {
        existing.count += 1;
      } else {
        bySlug.set(slug, { name, slug, count: 1 });
      }
    }
  }

  return [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export async function getPostsByTag(slug: string): Promise<Post[]> {
  const posts = await getPosts();
  return posts.filter((post) => post.tags.some((tag) => tagSlug(tag) === slug));
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
