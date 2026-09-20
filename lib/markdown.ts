import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";

const WORDS_PER_MINUTE = 225;

/** Approximate words-per-minute reading time, never less than one minute. */
export function readingMinutes(markdown: string): number {
  const words = markdown.trim() === "" ? 0 : markdown.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/**
 * The Markdown coming out of the article body is authored by us in Notion, so
 * we let raw HTML through (the caption transform below emits `<figure>`). The
 * flip side is that `sanitize: false` trusts the source — fine for our own
 * content, not for anything user-submitted.
 */
async function render(markdown: string): Promise<string> {
  const file = await remark()
    .use(remarkGfm)
    .use(remarkHtml, { sanitize: false })
    .process(markdown);
  return file.toString();
}

/** Render a run of inline Markdown, dropping the single wrapping paragraph. */
async function renderInline(markdown: string): Promise<string> {
  const html = (await render(markdown)).trim();
  const match = html.match(/^<p>([\s\S]*)<\/p>$/);
  return (match ? match[1] : html).trim();
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Flatten Markdown to plain text for use in an `alt` attribute. */
function toPlainText(markdown: string): string {
  return markdown
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1") // links and images -> their text
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * A Notion image block renders as a standalone image line whose caption is
 * emitted as the image's alt text — Markdown and all — while the real image
 * URL is the final parenthesised group. The default rendering therefore buries
 * the caption in `alt` (invisible), loses any link inside it, and, because
 * Notion emits no blank lines around the line, glues the image into the middle
 * of the surrounding paragraph. This matches those lines.
 */
const IMAGE_LINE = /^!\[(.*)\]\((.*)\)\s*$/;

/** Split an image target into its URL and optional `"title"`. */
function splitTarget(target: string): { url: string; title?: string } {
  const titled = target.match(/^([\s\S]*?)\s+"([^"]*)"\s*$/);
  if (titled) {
    return { url: titled[1].trim(), title: titled[2] };
  }
  return { url: target.trim() };
}

/**
 * Turn each standalone image line into a `<figure>` with a rendered
 * `<figcaption>`, separated from surrounding text by blank lines so it is a
 * block of its own. Lines inside fenced code blocks are left untouched.
 */
async function imagesToFigures(markdown: string): Promise<string> {
  const lines = markdown.split("\n");
  const out: string[] = [];
  let inFence = false;

  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      out.push(line);
      continue;
    }

    const match = inFence ? null : line.match(IMAGE_LINE);
    if (!match) {
      out.push(line);
      continue;
    }

    const caption = match[1].trim();
    const { url, title } = splitTarget(match[2]);

    const attrs = [`src="${escapeAttribute(url)}"`, `alt="${escapeAttribute(toPlainText(caption))}"`];
    if (title) attrs.push(`title="${escapeAttribute(title)}"`);

    const figcaption = caption ? `\n<figcaption>${await renderInline(caption)}</figcaption>` : "";

    // Blank lines keep the figure a block of its own rather than folding it
    // into an adjacent paragraph.
    out.push("", `<figure><img ${attrs.join(" ")}>${figcaption}</figure>`, "");
  }

  return out.join("\n");
}

/** A line that is a thematic break on its own: `---`, `***` or `___`. */
const THEMATIC_BREAK = /^ {0,3}([-*_])[ \t]*(?:\1[ \t]*){2,}$/;

/**
 * Notion emits a divider as a bare `---` on the line directly below the
 * preceding paragraph, with no blank line between them. CommonMark then reads
 * that `---` as the underline of a Setext heading, turning the whole paragraph
 * above it into an `<h2>` and swallowing the divider. Surrounding each
 * standalone thematic break with blank lines makes it a block of its own, so
 * the paragraph stays a paragraph and the divider renders as an `<hr>`. Lines
 * inside fenced code blocks are left untouched.
 */
function isolateThematicBreaks(markdown: string): string {
  const lines = markdown.split("\n");
  const out: string[] = [];
  let inFence = false;

  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      out.push(line);
      continue;
    }

    if (!inFence && THEMATIC_BREAK.test(line)) {
      out.push("", line, "");
      continue;
    }

    out.push(line);
  }

  return out.join("\n");
}

/** Render a Markdown string to the HTML used for the article body and the feed. */
export async function markdownToHtml(markdown: string): Promise<string> {
  return render(await imagesToFigures(isolateThematicBreaks(markdown)));
}
