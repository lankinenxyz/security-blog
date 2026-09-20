import Link from "next/link";
import { formatDate, tagSlug, type Post } from "@/lib/posts";

export function PostCard({ post }: { post: Post }) {
  return (
    <article className="border-b border-border pb-8 last:border-0">
      <h2 className="text-xl font-semibold tracking-tight">
        <Link href={`/posts/${post.slug}`} className="hover:text-accent">
          {post.title}
        </Link>
      </h2>
      <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted">
        <time dateTime={post.date}>{formatDate(post.date)}</time>
        <span aria-hidden="true">·</span>
        <span>{post.readingMinutes} min read</span>
      </p>
      <p className="mt-3 text-muted">{post.description}</p>
      {post.tags.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2 text-sm">
          {post.tags.map((tag) => (
            <li key={tag}>
              <Link
                href={`/tags/${tagSlug(tag)}`}
                className="rounded-full border border-border px-3 py-1 text-muted hover:border-accent hover:text-accent"
              >
                {tag}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
