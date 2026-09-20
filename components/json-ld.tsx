/**
 * Renders a schema.org graph as a JSON-LD script tag.
 *
 * `<` is escaped so that a string in the payload can never close the script
 * element, which is the XSS risk in embedding `JSON.stringify` output.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
