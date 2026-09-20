import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { PostCard } from "@/components/post-card";
import { buildMetadata } from "@/lib/metadata";
import { getPosts } from "@/lib/posts";
import { absoluteUrl, site, siteUrl } from "@/lib/site";

export const metadata: Metadata = buildMetadata({
  title: `${site.name} — application security, in practice`,
  description: site.description,
  pathname: "/",
  absoluteTitle: true,
});

export default async function HomePage() {
  const posts = await getPosts();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${siteUrl}/#blog`,
    url: absoluteUrl("/"),
    name: site.name,
    description: site.description,
    inLanguage: site.language,
    author: { "@type": "Person", name: site.author.name, url: site.author.url },
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      "@id": absoluteUrl(`/posts/${post.slug}`),
      headline: post.title,
      description: post.description,
      datePublished: post.date,
      dateModified: post.updated ?? post.date,
      url: absoluteUrl(`/posts/${post.slug}`),
    })),
  };

  return (
    <>
      <JsonLd data={jsonLd} />

      <section className="mb-12">
        <h1 className="text-3xl font-semibold tracking-tight">{site.name}</h1>
        <p className="mt-3 text-lg text-muted">{site.description}</p>
      </section>

      <h2 className="sr-only">All posts</h2>
      <div className="flex flex-col gap-8">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </>
  );
}
