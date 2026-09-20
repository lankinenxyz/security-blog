import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/metadata";
import { getTags } from "@/lib/posts";
import { site } from "@/lib/site";

const description = `Every topic covered on ${site.name}, with the posts filed under each one.`;

export const metadata: Metadata = buildMetadata({
  title: "Topics",
  description,
  pathname: "/tags",
});

export default async function TagsPage() {
  const tags = await getTags();

  return (
    <>
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">Topics</h1>
        <p className="mt-3 text-muted">{description}</p>
      </header>

      <ul className="flex flex-wrap gap-3">
        {tags.map((tag) => (
          <li key={tag.slug}>
            <Link
              href={`/tags/${tag.slug}`}
              className="rounded-full border border-border px-4 py-2 hover:border-accent hover:text-accent"
            >
              {tag.name}{" "}
              <span className="text-muted">({tag.count})</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
