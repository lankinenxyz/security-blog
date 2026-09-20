/**
 * Central site configuration.
 *
 * `NEXT_PUBLIC_SITE_URL` must be set to the production origin (no trailing
 * slash) before building for production: it feeds `metadataBase`, every
 * canonical URL, the sitemap, robots.txt and the RSS feed.
 */
const FALLBACK_URL = "http://localhost:3000";

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? FALLBACK_URL).replace(
  /\/+$/,
  "",
);

export const site = {
  name: "Security Notes",
  title: "Security Notes",
  description:
    "Practical write-ups on application security, threat modelling and defensive engineering, for people who ship software.",
  locale: "en_US",
  language: "en",
  author: {
    name: "Elias Lankinen",
    url: `${siteUrl}/about`,
    /** The author's personal website, linked from the header, footer and About page. */
    website: "https://lankinen.xyz",
  },
  /** Used for the `twitter:creator` tag. Leave empty to omit it. */
  twitterHandle: "",
} as const;

/**
 * Resolve a site-relative path to an absolute URL, without a trailing slash so
 * that sitemap entries match the canonical URLs Next.js emits.
 */
export function absoluteUrl(pathname: string): string {
  const url = new URL(pathname, `${siteUrl}/`).toString();
  return url.length > siteUrl.length ? url.replace(/\/$/, "") : siteUrl;
}
