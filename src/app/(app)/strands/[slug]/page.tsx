import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectCard } from "@/components/ProjectCard";
import { STRANDS, STRAND_BY_SLUG } from "@/lib/brand";
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
        <p className="mt-2 text-lg font-semibold opacity-85">{strand.tagline}</p>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed opacity-80">
          {strand.description}
        </p>
      </header>

      <h2 className="mb-5 mt-10 text-xl font-bold tracking-tight text-ink">
        {items.length} project{items.length === 1 ? "" : "s"} in this strand
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
    </>
  );
}
