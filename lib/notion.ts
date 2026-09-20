/**
 * Notion as the content source.
 *
 * Posts are read from a Notion database configured through `NOTION_TOKEN` and a
 * database (or data source) id. Each row becomes a `Post`: its properties
 * supply the metadata and the page body is fetched as Markdown and rendered so
 * the rest of the site (feed, sitemap, tags, OG images) can consume it.
 *
 * The database may use any property names; these candidates are matched
 * case-insensitively, with sensible fallbacks when a property is absent:
 *
 *   - title       the page's `title` property
 *   - Description / Summary / Excerpt / Subtitle  (rich text)
 *   - Date / Published / Publish Date / Date Published  (date, or DD.MM.YYYY
 *       text; else created time)
 *   - Updated / Last Updated / Modified  (date; optional)
 *   - Tags / Categories / Topics  (multi-select)
 *   - Author / Authors / By  (rich text, people, or select)
 *   - Slug / Path / Permalink  (rich text; else slugified title)
 *
 * A row is treated as published when a `Published`/`Public`/`Live` checkbox is
 * true, or a `Status`/`Stage`/`State` select reads Published/Live/Done, etc.
 * A database with no such gating property publishes every row.
 */
import { Client, collectPaginatedAPI, isFullPage } from "@notionhq/client";
import type {
  PageObjectResponse,
  QueryDataSourceParameters,
  RichTextItemResponse,
} from "@notionhq/client";
import { markdownToHtml, readingMinutes } from "./markdown";
import type { Post } from "./posts";

type Properties = PageObjectResponse["properties"];
type PropertyValue = Properties[string];

/** In-flight/most-recent fetch, so a single build does not re-query per route. */
let inflight: { at: number; promise: Promise<Post[]> } | null = null;
const CACHE_TTL_MS = 60_000;

let client: Client | null = null;

function getClient(): Client {
  if (!client) {
    client = new Client({ auth: process.env.NOTION_TOKEN });
  }
  return client;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function richTextToPlain(rich: RichTextItemResponse[]): string {
  return rich
    .map((item) => item.plain_text)
    .join("")
    .trim();
}

function findProperty(props: Properties, names: string[]): PropertyValue | undefined {
  const keys = Object.keys(props);
  for (const name of names) {
    const key = keys.find((k) => k.toLowerCase() === name.toLowerCase());
    if (key) return props[key];
  }
  return undefined;
}

function getTitle(props: Properties): string {
  for (const value of Object.values(props)) {
    if (value.type === "title") return richTextToPlain(value.title);
  }
  return "";
}

function getRichText(props: Properties, names: string[]): string {
  const prop = findProperty(props, names);
  return prop?.type === "rich_text" ? richTextToPlain(prop.rich_text) : "";
}

/**
 * Normalize a date written as free text in a Notion property. Handles the
 * `DD.MM.YYYY` form (also with `/` or `-` separators) used in the database
 * and returns an ISO `YYYY-MM-DD` string. Anything else — including native
 * ISO text like `2024-12-04` — is returned trimmed but unchanged, so
 * `toIsoDate` can make the final attempt.
 */
function parseDateText(text: string): string {
  const trimmed = text.trim();
  const dmy = trimmed.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (dmy) {
    const [, day, month, year] = dmy;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return trimmed;
}

function getDate(props: Properties, names: string[]): string | undefined {
  const prop = findProperty(props, names);
  if (prop?.type === "date") return prop.date?.start ?? undefined;
  if (prop?.type === "rich_text") {
    const text = richTextToPlain(prop.rich_text);
    return text ? parseDateText(text) : undefined;
  }
  return undefined;
}

function getTags(props: Properties): string[] {
  const prop = findProperty(props, ["Tags", "Categories", "Topics"]);
  return prop?.type === "multi_select" ? prop.multi_select.map((option) => option.name) : [];
}

function getAuthor(props: Properties): string {
  const prop = findProperty(props, ["Author", "Authors", "By"]);
  if (prop?.type === "rich_text") return richTextToPlain(prop.rich_text);
  if (prop?.type === "select") return prop.select?.name ?? "";
  if (prop?.type === "people") {
    return prop.people
      .map((person) => ("name" in person ? (person.name ?? "") : ""))
      .filter(Boolean)
      .join(", ");
  }
  return "";
}

function getSlug(props: Properties, title: string): string {
  const prop = findProperty(props, ["Slug", "Path", "Permalink"]);
  if (prop?.type === "rich_text") {
    const value = richTextToPlain(prop.rich_text);
    if (value) return slugify(value);
  }
  return slugify(title);
}

function isPublishedName(name: string | null | undefined): boolean {
  if (!name) return false;
  return ["published", "public", "live", "done", "complete", "completed"].includes(
    name.toLowerCase(),
  );
}

function isPublished(props: Properties): boolean {
  const checkbox = findProperty(props, ["Published", "Public", "Live"]);
  if (checkbox?.type === "checkbox") return checkbox.checkbox;

  const status = findProperty(props, ["Status", "Stage", "State"]);
  if (status?.type === "status") return isPublishedName(status.status?.name);
  if (status?.type === "select") return isPublishedName(status.select?.name);

  // No gating property: treat every row as published.
  return true;
}

/** A short plain-text excerpt from Markdown, used when no description is set. */
function excerpt(markdown: string, max = 160): string {
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`~[\]()!-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

function toIsoDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

async function pageToPost(page: PageObjectResponse): Promise<Post | null> {
  const props = page.properties;

  const title = getTitle(props);
  if (!title || !isPublished(props)) return null;

  const { markdown } = await getClient().pages.retrieveMarkdown({ page_id: page.id });
  const body = markdown ?? "";

  const updated = getDate(props, ["Updated", "Last Updated", "Updated At", "Modified"]);

  return {
    slug: getSlug(props, title),
    title,
    description:
      getRichText(props, ["Description", "Summary", "Excerpt", "Subtitle"]) || excerpt(body),
    date: toIsoDate(
      getDate(props, ["Date", "Published", "Publish Date", "Date Published"]) ??
        page.created_time,
    ),
    updated: updated ? toIsoDate(updated) : undefined,
    author: getAuthor(props),
    tags: getTags(props),
    readingMinutes: readingMinutes(body),
    html: await markdownToHtml(body),
  };
}

async function resolveDataSourceId(): Promise<string> {
  const dataSourceId = process.env.NOTION_DATA_SOURCE_ID?.trim();
  if (dataSourceId) return dataSourceId;

  const databaseId = process.env.NOTION_DATABASE_ID?.trim();
  if (!databaseId) {
    throw new Error(
      "Notion is not configured: set NOTION_TOKEN and NOTION_DATABASE_ID (or NOTION_DATA_SOURCE_ID).",
    );
  }
  const database = await getClient().databases.retrieve({ database_id: databaseId });
  if ("data_sources" in database && database.data_sources.length > 0) {
    return database.data_sources[0].id;
  }
  // Fall back to using the id directly (older single-source databases).
  return databaseId;
}

async function fetchNotionPosts(): Promise<Post[]> {
  const notion = getClient();
  const dataSourceId = await resolveDataSourceId();

  const rows = await collectPaginatedAPI(
    (args: QueryDataSourceParameters) => notion.dataSources.query(args),
    { data_source_id: dataSourceId },
  );

  const posts = await Promise.all(rows.filter(isFullPage).map(pageToPost));
  return posts.filter((post): post is Post => post !== null);
}

/** Every published post from Notion, deduplicated for the duration of a build. */
export async function getNotionPosts(): Promise<Post[]> {
  if (inflight && Date.now() - inflight.at < CACHE_TTL_MS) {
    return inflight.promise;
  }
  const promise = fetchNotionPosts();
  inflight = { at: Date.now(), promise };
  try {
    return await promise;
  } catch (error) {
    inflight = null;
    throw error;
  }
}
