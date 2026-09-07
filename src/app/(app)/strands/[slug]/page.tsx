import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectCard } from "@/components/ProjectCard";
import { INTEGRATION_NOTE, STRANDS, STRAND_BY_SLUG } from "@/lib/brand";
import { projectsInStrand, resources } from "@/lib/curriculum";
import { enrolmentCounts } from "@/lib/queries";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return STRANDS.map((strand) => ({ slug: strand.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const strand = STRAND_BY_SLUG.get((await params).slug);
  return { title: strand?.name ?? "Strand" };
}

export default async function StrandPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const strand = STRAND_BY_SLUG.get((await params).slug);
  if (!strand) notFound();

  const items = projectsInStrand(strand);
  const counts = await enrolmentCounts();
  const linkedResources = resources.filter((r) => r.strand === strand.name);
  const others = STRANDS.filter((s) => s.slug !== strand.slug);

  return (
    <>
      <Link
        href="/strands"
        className="text-sm font-semibold text-muted hover:text-royal-purple"
      >
        ← All strands
      </Link>

      <header
        className="mt-4 rounded-[14px] p-8"
        style={{ background: strand.colour, color: strand.ink }}
      >
        <p className="text-6xl font-bold leading-none opacity-35">
          {strand.letter}
        </p>
        <h1 className="mt-5 text-4xl font-bold tracking-tight">{strand.name}</h1>
        <p className="mt-2 text-lg font-semibold opacity-85">
          {strand.definition}
        </p>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed opacity-85">
          {strand.summary}
        </p>
      </header>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <section className="card p-6">
          <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-royal-purple">
            What it develops
          </h2>
          <ul className="mt-4 space-y-2.5">
            {strand.develops.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed text-ink">
                <span
                  className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: strand.colour }}
                />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-6">
          <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-royal-purple">
            Projects in this strand may involve
          </h2>
          <ul className="mt-4 space-y-2.5">
            {strand.projectsMay.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed text-ink">
                <span
                  className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: strand.colour }}
                />
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <p className="mt-6 rounded-[14px] border border-dashed border-line bg-surface p-5 text-sm leading-relaxed text-muted">
        {INTEGRATION_NOTE}{" "}
        <Link href="/handbook" className="font-semibold text-royal-purple underline">
          How the strands work together
        </Link>
      </p>

      <h2 className="mb-5 mt-12 text-xl font-bold tracking-tight text-ink">
        {items.length} project{items.length === 1 ? "" : "s"} led by this strand
      </h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((project) => (
          <ProjectCard
            key={project.slug}
            project={project}
            members={counts.get(project.slug) ?? 0}
          />
        ))}
      </div>

      {linkedResources.length > 0 ? (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-bold tracking-tight text-ink">
            Practices tied to this strand
          </h2>
          <div className="flex flex-wrap gap-2">
            {linkedResources.map((resource) => (
              <Link
                key={resource.slug}
                href={`/toolkit/${resource.slug}`}
                className="card px-4 py-2 text-sm font-semibold text-ink hover:border-light-purple"
              >
                {resource.title}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-12">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.16em] text-muted">
          The other five
        </h2>
        <div className="flex flex-wrap gap-2">
          {others.map((other) => (
            <Link
              key={other.slug}
              href={`/strands/${other.slug}`}
              className="rounded-full px-4 py-2 text-sm font-bold transition-transform hover:-translate-y-0.5"
              style={{ background: other.colour, color: other.ink }}
            >
              {other.name}
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
