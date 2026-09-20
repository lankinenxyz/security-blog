import type { Metadata } from "next";
import { absoluteUrl, site, siteUrl } from "./site";

/** The RSS feed, advertised as an alternate representation of every page. */
export const rssTypes = {
  "application/rss+xml": `${siteUrl}/rss.xml`,
};

type BuildMetadataOptions = {
  title: string;
  description: string;
  /** Site-relative path, used for the canonical URL and `og:url`. */
  pathname: string;
  /** Pass `true` on the home page so the site name is not duplicated. */
  absoluteTitle?: boolean;
  article?: {
    publishedTime: string;
    modifiedTime?: string;
    authors: string[];
    tags: string[];
  };
};

/**
 * Builds a page's metadata.
 *
 * Next.js merges metadata shallowly, so a page that sets `openGraph` or
 * `alternates` replaces the root layout's version wholesale. Routing every
 * page through this helper keeps the canonical URL, the feed link and the
 * Open Graph tags consistent instead of silently dropping them.
 */
export function buildMetadata({
  title,
  description,
  pathname,
  absoluteTitle = false,
  article,
}: BuildMetadataOptions): Metadata {
  const url = absoluteUrl(pathname);

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical: url,
      types: rssTypes,
    },
    openGraph: {
      type: article ? "article" : "website",
      url,
      siteName: site.name,
      locale: site.locale,
      title,
      description,
      ...(article
        ? {
            publishedTime: article.publishedTime,
            modifiedTime: article.modifiedTime ?? article.publishedTime,
            authors: article.authors,
            tags: article.tags,
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(site.twitterHandle ? { creator: site.twitterHandle } : {}),
    },
  };
}
