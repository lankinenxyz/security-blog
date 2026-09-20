import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";

const WORDS_PER_MINUTE = 225;

/** Approximate words-per-minute reading time, never less than one minute. */
export function readingMinutes(markdown: string): number {
  const words = markdown.trim() === "" ? 0 : markdown.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/** Render a Markdown string to the HTML used for the article body and the feed. */
export async function markdownToHtml(markdown: string): Promise<string> {
  const file = await remark().use(remarkGfm).use(remarkHtml).process(markdown);
  return file.toString();
}
