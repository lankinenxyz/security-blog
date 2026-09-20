import { ImageResponse } from "next/og";
import { getPost, getPosts } from "@/lib/posts";
import { site } from "@/lib/site";

export const alt = `An article on ${site.name}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Without this the image route is rendered on demand instead of at build time.
export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#09090b",
          color: "#f4f4f5",
          padding: 80,
        }}
      >
        <div style={{ display: "flex", fontSize: 32, color: "#2dd4bf" }}>
          {site.name}
        </div>
        <div style={{ display: "flex", fontSize: 60, lineHeight: 1.2 }}>
          {post?.title ?? site.name}
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#a1a1aa" }}>
          {post ? `${post.author || site.author.name} · ${post.readingMinutes} min read` : ""}
        </div>
      </div>
    ),
    size,
  );
}
