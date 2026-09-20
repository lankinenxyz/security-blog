import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { buildMetadata } from "@/lib/metadata";
import {
  formatDate,
  getAdjacentPosts,
  getPost,
  getPosts,
  tagSlug,
} from "@/lib/posts";
import { absoluteUrl, site, siteUrl } from "@/lib/site";

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(
  props: PageProps<"/posts/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const post = await getPost(slug);

  if (!post) {
    // Nothing to describe, and the page itself will 404.
    return { title: "Post not found", robots: { index: false, follow: false } };
  }

  return buildMetadata({
    title: post.title,
    description: post.description,
    pathname: `/posts/${post.slug}`,
    article: {
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      authors: [post.author || site.author.name],
      tags: post.tags,
    },
  });
}

export default async function PostPage(props: PageProps<"/posts/[slug]">) {
  const { slug } = await props.params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const { newer, older } = await getAdjacentPosts(post.slug);
  const url = absoluteUrl(`/posts/${post.slug}`);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": url,
        url,
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        headline: post.title,
        description: post.description,
        datePublished: post.date,
        dateModified: post.updated ?? post.date,
        inLanguage: site.language,
        keywords: post.tags,
        wordCount: post.readingMinutes * 225,
        author: {
          "@type": "Person",
          name: post.author || site.author.name,
          url: site.author.url,
        },
        publisher: { "@id": `${siteUrl}/#person` },
        isPartOf: { "@id": `${siteUrl}/#blog` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: site.name,
            item: absoluteUrl("/"),
          },
          { "@type": "ListItem", position: 2, name: post.title, item: url },
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />

      <article>
        <header className="mb-8 border-b border-border pb-8">
          <h1 className="text-3xl font-semibold tracking-tight">{post.title}</h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-2 text-sm text-muted">
            <span>By {post.author || site.author.name}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span aria-hidden="true">·</span>
            <span>{post.readingMinutes} min read</span>
          </p>
          {post.updated && (
            <p className="mt-1 text-sm text-muted">
              Updated <time dateTime={post.updated}>{formatDate(post.updated)}</time>
            </p>
          )}
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
        </header>

        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: post.html }}
        />
      </article>

      {(newer || older) && (
        <nav
          aria-label="More posts"
          className="mt-12 grid gap-4 border-t border-border pt-8 sm:grid-cols-2"
        >
          {older && (
            <Link href={`/posts/${older.slug}`} className="group">
              <span className="text-sm text-muted">Previous post</span>
              <span className="mt-1 block font-medium group-hover:text-accent">
                {older.title}
              </span>
            </Link>
          )}
          {newer && (
            <Link href={`/posts/${newer.slug}`} className="group sm:col-start-2 sm:text-right">
              <span className="text-sm text-muted">Next post</span>
              <span className="mt-1 block font-medium group-hover:text-accent">
                {newer.title}
              </span>
            </Link>
          )}
        </nav>
      )}
    </>
  );
}
