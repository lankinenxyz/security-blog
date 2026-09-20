import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { buildMetadata } from "@/lib/metadata";
import { absoluteUrl, site, siteUrl } from "@/lib/site";

const description = `Who writes ${site.name}, and what the posts here are for.`;

export const metadata: Metadata = buildMetadata({
  title: "About",
  description,
  pathname: "/about",
});

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    url: absoluteUrl("/about"),
    name: `About ${site.name}`,
    description,
    inLanguage: site.language,
    mainEntity: {
      "@type": "Person",
      "@id": `${siteUrl}/#person`,
      name: site.author.name,
      url: site.author.url,
      sameAs: [site.author.website],
      jobTitle: "Security engineer",
    },
  };

  return (
    <>
      <JsonLd data={jsonLd} />

      <article className="prose max-w-none">
        <h1>About</h1>
        <p>
          {site.name} is written by {site.author.name}. It collects the write-ups
          that would otherwise stay in internal docs: the controls that hold up
          in production, the ones that only look like controls, and the reasoning
          for telling them apart.
        </p>
        <p>
          More about me, and everything else I work on, lives at{" "}
          <a href={site.author.website} rel="me noopener noreferrer" target="_blank">
            lankinen.xyz
          </a>
          .
        </p>
        <h2>What you will find here</h2>
        <ul>
          <li>Web application security, with an emphasis on what browsers enforce for you.</li>
          <li>Threat modelling that a team can finish and act on.</li>
          <li>Build and delivery security, because the pipeline ships the code.</li>
        </ul>
        <h2>Corrections</h2>
        <p>
          If a post gets something wrong, that is worth fixing. Posts carry a
          published date, and substantive edits update the modified date shown on
          the article.
        </p>
      </article>
    </>
  );
}
