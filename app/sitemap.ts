import type { MetadataRoute } from "next";
import { getPosts, getTags } from "@/lib/posts";
import { absoluteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, tags] = await Promise.all([getPosts(), getTags()]);
  const lastPublished = posts[0]?.updated ?? posts[0]?.date ?? new Date().toISOString();

  return [
    {
      url: absoluteUrl("/"),
      lastModified: lastPublished,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/about"),
      lastModified: lastPublished,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: absoluteUrl("/tags"),
      lastModified: lastPublished,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    ...posts.map((post) => ({
      url: absoluteUrl(`/posts/${post.slug}`),
      lastModified: post.updated ?? post.date,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...tags.map((tag) => ({
      url: absoluteUrl(`/tags/${tag.slug}`),
      lastModified: lastPublished,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
  ];
}
