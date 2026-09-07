import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { StrandChip } from "@/components/ui";
import { strandOf } from "@/lib/brand";
import { getResource, resources } from "@/lib/curriculum";

export function generateStaticParams() {
  return resources.map((resource) => ({ slug: resource.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resource = getResource((await params).slug);
  return { title: resource?.title ?? "Practice" };
}

export default async function ResourcePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resource = getResource((await params).slug);
  if (!resource) notFound();

  const related = resources
    .filter((r) => r.category === resource.category && r.slug !== resource.slug)
    .slice(0, 8);

  return (
    <>
      <Link
        href="/toolkit"
        className="text-sm font-semibold text-muted hover:text-royal-purple"
      >
        ← Toolkit
      </Link>

      <header className="mt-4 max-w-2xl">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-muted">
            {resource.category}
          </span>
          {resource.corePractice ? (
            <span className="rounded-full bg-royal-purple px-3 py-1 text-xs font-bold text-white">
              Core practice
            </span>
          ) : null}
          {resource.strand ? <StrandChip strand={strandOf(resource.strand)} /> : null}
        </div>

        <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-ink">
          {resource.title}
        </h1>

        {resource.notes ? (
          <p className="mt-3 text-base leading-relaxed text-muted">
            {resource.notes}
          </p>
        ) : (
          <p className="mt-3 text-base leading-relaxed text-muted">
            {resource.origin === "handbook"
              ? "No summary recorded for this reference yet."
              : "This practice is on the team\u2019s list but has not been written up yet. If you use it, add what you learned so the next person starts further along."}
          </p>
        )}
      </header>

      {resource.href ? (
        <Link
          href={resource.href}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-royal-purple px-5 py-2.5 text-sm font-bold text-white hover:bg-deep-blue"
        >
          Read it on this platform →
        </Link>
      ) : null}

      <dl className="mt-8 grid max-w-2xl gap-6 sm:grid-cols-2">
        {resource.author ? (
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-muted">
              Author
            </dt>
            <dd className="mt-1 font-semibold text-ink">{resource.author}</dd>
          </div>
        ) : null}

        {resource.year ? (
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-muted">
              {resource.category === "Documentation" ? "Version" : "Published"}
            </dt>
            <dd className="mt-1 font-semibold text-ink">{resource.year}</dd>
          </div>
        ) : null}

        {resource.citation ? (
          <div className="sm:col-span-2">
            <dt className="text-xs font-bold uppercase tracking-wider text-muted">
              Cited in the handbook as
            </dt>
            <dd className="mt-1 font-mono text-sm text-ink">{resource.citation}</dd>
          </div>
        ) : null}

        {resource.origin === "workbook" || resource.leads.length > 0 ? (
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-muted">
              Owner
            </dt>
            <dd className="mt-1 font-semibold text-ink">
              {resource.leads.length
                ? resource.leads.join(" & ")
                : "Not yet assigned"}
            </dd>
          </div>
        ) : null}

        {resource.focus ? (
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-muted">
              Focus
            </dt>
            <dd className="mt-1 font-semibold capitalize text-ink">
              {resource.focus}
            </dd>
          </div>
        ) : null}

        {resource.url ? (
          <div className="sm:col-span-2">
            <dt className="text-xs font-bold uppercase tracking-wider text-muted">
              Reference
            </dt>
            <dd className="mt-1">
              <a
                href={resource.url}
                target="_blank"
                rel="noreferrer noopener"
                className="break-all font-semibold text-royal-purple underline"
              >
                {resource.url}
              </a>
            </dd>
          </div>
        ) : null}

        {resource.alsoListedAs.length > 0 ? (
          <div className="sm:col-span-2">
            <dt className="text-xs font-bold uppercase tracking-wider text-muted">
              Also listed in the workbook as
            </dt>
            <dd className="mt-1 text-sm text-muted">
              {resource.alsoListedAs.join(" · ")}
            </dd>
          </div>
        ) : null}
      </dl>

      {related.length > 0 ? (
        <section className="mt-12">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.16em] text-muted">
            More in {resource.category}
          </h2>
          <div className="flex flex-wrap gap-2">
            {related.map((item) => (
              <Link
                key={item.slug}
                href={`/toolkit/${item.slug}`}
                className="card px-4 py-2 text-sm font-medium text-ink hover:border-light-purple"
              >
                {item.title}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
