import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  // Next.js already marks the not-found response `noindex`.
  title: "Page not found",
};

export default function NotFound() {
  return (
    <section>
      <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-3 text-muted">
        That URL does not match anything here. It may have been renamed.
      </p>
      <p className="mt-6">
        <Link href="/" className="text-accent hover:underline">
          Back to all posts
        </Link>
      </p>
    </section>
  );
}
