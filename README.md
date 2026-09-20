# Security Notes

A small blog built on Next.js 16 (App Router) with posts sourced from a Notion
database, and the SEO surface wired up: per-page canonicals, Open Graph and
Twitter cards, generated OG images, JSON-LD structured data, a sitemap,
`robots.txt` and an RSS feed.

## Getting started

```bash
bun install
bun run dev
```

Set the production origin before building for deploy, since it is baked into
canonical URLs, the sitemap, `robots.txt` and the feed:

```bash
cp .env.example .env.local   # then edit NEXT_PUBLIC_SITE_URL
bun run build && bun run start
```

## Sourcing posts from Notion

Posts come from a Notion database, queried at build time. To set it up:

1. Create an internal integration at
   [notion.so/my-integrations](https://www.notion.so/my-integrations) and copy
   its secret.
2. Share the database with the integration (**•••  → Connections**).
3. Set the environment variables:

   ```bash
   NOTION_TOKEN=secret_xxx
   NOTION_DATABASE_ID=<the database id from its URL>
   # NOTION_DATA_SOURCE_ID=<optional; defaults to the first data source>
   ```

The page body is fetched as Markdown and rendered to HTML. Database properties
are matched case-insensitively, with fallbacks:

| Post field  | Notion property (any of)                              | Fallback                     |
| ----------- | ---------------------------------------------------- | ---------------------------- |
| title       | the `title` property                                 | —                            |
| description | `Description`, `Summary`, `Excerpt`, `Subtitle`      | excerpt of the body          |
| date        | `Date`, `Published`, `Publish Date`, `Date Published`| the page's created time      |
| updated     | `Updated`, `Last Updated`, `Modified`                | omitted                      |
| tags        | `Tags`, `Categories`, `Topics` (multi-select)        | none                         |
| author      | `Author`, `Authors`, `By` (text, people, or select)  | empty                        |
| slug        | `Slug`, `Path`, `Permalink`                          | slugified title              |

A row is published when a `Published`/`Public`/`Live` checkbox is checked, or a
`Status`/`Stage`/`State` select reads Published/Live/Done. A database with no
such property publishes every row.

> Notion is queried at build time, so rerun the build (or trigger a redeploy) to
> pick up new or edited posts.

## What is implemented for SEO

| Area | Where |
| --- | --- |
| Title template, description, robots directives | `app/layout.tsx` |
| Per-page canonical, OG and Twitter tags | `lib/metadata.ts` |
| JSON-LD (`WebSite`, `Person`, `Blog`, `BlogPosting`, `BreadcrumbList`, `CollectionPage`) | `components/json-ld.tsx` and each page |
| Generated 1200×630 OG images | `app/opengraph-image.tsx`, `app/posts/[slug]/opengraph-image.tsx` |
| Sitemap with real `lastmod` dates | `app/sitemap.ts` |
| `robots.txt` pointing at the sitemap | `app/robots.ts` |
| RSS 2.0 feed with full content | `app/rss.xml/route.ts` |
| Internal linking (tags, previous/next post) | `app/posts/[slug]/page.tsx`, `app/tags/` |

Every route is prerendered at build time, so crawlers get complete HTML with
the metadata already in `<head>`.

## Before going live

- Set `NEXT_PUBLIC_SITE_URL` in the deploy environment.
- Update the site name, description and author in `lib/site.ts`.
- Add search-console tokens to the `verification` field in `app/layout.tsx`.
- Serve the site from a single origin and redirect the alternatives, so the
  canonical URLs and the sitemap agree with what is actually reachable.
