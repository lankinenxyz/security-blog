import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { PostCard } from "@/components/post-card";
import { buildMetadata } from "@/lib/metadata";
import { getPostsByTag, getTags } from "@/lib/posts";
import { absoluteUrl, site } from "@/lib/site";

export async function generateStaticParams() {
  const tags = await getTags();
  return tags.map((tag) => ({ tag: tag.slug }));
}

function describe(name: string, count: number) {
  return `${count} ${count === 1 ? "post" : "posts"} on ${name}, from ${site.name}.`;
}

export async function generateMetadata(
  props: PageProps<"/tags/[tag]">,
): Promise<Metadata> {
  const { tag: slug } = await props.params;
  const tag = (await getTags()).find((candidate) => candidate.slug === slug);

  if (!tag) {
    return { title: "Tag not found", robots: { index: false, follow: false } };
  }

  return buildMetadata({
    title: `Posts tagged ${tag.name}`,
    description: describe(tag.name, tag.count),
    pathname: `/tags/${tag.slug}`,
  });
}

export default async function TagPage(props: PageProps<"/tags/[tag]">) {
  const { tag: slug } = await props.params;
  const tag = (await getTags()).find((candidate) => candidate.slug === slug);

  if (!tag) {
    notFound();
  }

  const posts = await getPostsByTag(tag.slug);
  const url = absoluteUrl(`/tags/${tag.slug}`);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": url,
    url,
    name: `Posts tagged ${tag.name}`,
    description: describe(tag.name, tag.count),
    inLanguage: site.language,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: posts.map((post, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: post.title,
        url: absoluteUrl(`/posts/${post.slug}`),
      })),
    },
  };

  return (
    <>
      <JsonLd data={jsonLd} />

      <header className="mb-10">
        <p className="text-sm text-muted">Tag</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{tag.name}</h1>
        <p className="mt-3 text-muted">{describe(tag.name, tag.count)}</p>
      </header>

      <div className="flex flex-col gap-8">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </>
  );
}
