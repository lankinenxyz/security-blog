import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { JsonLd } from "@/components/json-ld";
import { rssTypes } from "@/lib/metadata";
import { absoluteUrl, site, siteUrl } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${site.name} — application security, in practice`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.author.name, url: site.author.url }],
  creator: site.author.name,
  publisher: site.name,
  category: "technology",
  // No `alternates.canonical` here on purpose: metadata merges shallowly, so a
  // canonical set on the root layout would be inherited by any page that does
  // not set its own. Pages build theirs with `buildMetadata`.
  alternates: {
    types: rssTypes,
  },
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: site.locale,
    url: absoluteUrl("/"),
    title: `${site.name} — application security, in practice`,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: site.name,
    description: site.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  // Add search-console tokens here once the site is verified, e.g.
  // verification: { google: process.env.GOOGLE_SITE_VERIFICATION },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

const navigation = [
  { href: "/", label: "Posts" },
  { href: "/about", label: "About" },
] as const;

export default function RootLayout({ children }: LayoutProps<"/">) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: absoluteUrl("/"),
        name: site.name,
        description: site.description,
        inLanguage: site.language,
        publisher: { "@id": `${siteUrl}/#person` },
      },
      {
        "@type": "Person",
        "@id": `${siteUrl}/#person`,
        name: site.author.name,
        url: site.author.url,
        sameAs: [site.author.website],
      },
    ],
  };

  return (
    <html
      lang={site.language}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <JsonLd data={jsonLd} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded focus:bg-foreground focus:px-3 focus:py-2 focus:text-background"
        >
          Skip to content
        </a>

        <header className="border-b border-border">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-5">
            <Link href="/" className="font-semibold tracking-tight">
              {site.name}
            </Link>
            <nav aria-label="Main">
              <ul className="flex gap-5 text-sm">
                {navigation.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-muted hover:text-accent">
                      {item.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <a
                    href={site.author.website}
                    className="text-muted hover:text-accent"
                    target="_blank"
                    rel="me noopener noreferrer"
                  >
                    Website
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </header>

        <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
          {children}
        </main>

        <footer className="border-t border-border">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-sm text-muted">
            <p>
              © {new Date().getFullYear()} {site.author.name}
            </p>
            <nav aria-label="Elsewhere">
              <ul className="flex flex-wrap items-center gap-5">
                <li>
                  <a
                    href={site.author.website}
                    className="hover:text-accent"
                    target="_blank"
                    rel="me noopener noreferrer"
                  >
                    lankinen.xyz
                  </a>
                </li>
                <li>
                  <a href="/rss.xml" className="hover:text-accent">
                    RSS feed
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
