import type { Metadata } from "next";
import Link from "next/link";

import { SectionHeading } from "@/components/ui";
import { STRANDS } from "@/lib/brand";
import { projectsInStrand, unassignedProjects } from "@/lib/curriculum";

export const metadata: Metadata = { title: "Strands" };

export default function StrandsPage() {
  return (
    <>
      <SectionHeading
        eyebrow="I · M · P · A · C · T"
        title="The six strands"
        description="The strands are a developmental lens: they say what kind of growth a project is meant to produce. They are an integrated system, not six separate tracks — projects are expected to span several and make the connections explicit."
      />

      <div className="grid gap-5 md:grid-cols-2">
        {STRANDS.map((strand) => {
          const count = projectsInStrand(strand).length;
          return (
            <Link
              key={strand.slug}
              href={`/strands/${strand.slug}`}
              className="group overflow-hidden rounded-[14px] border border-line bg-surface transition-shadow hover:shadow-lg"
            >
              <div
                className="flex items-start justify-between p-6"
                style={{ background: strand.colour, color: strand.ink }}
              >
                <div>
                  <p className="text-5xl font-bold leading-none opacity-40">
                    {strand.letter}
                  </p>
                  <h2 className="mt-4 text-2xl font-bold">{strand.name}</h2>
                  <p className="mt-1 text-sm font-medium opacity-80">
                    {strand.definition}
                  </p>
                </div>
                <span className="rounded-full bg-black/15 px-3 py-1 text-sm font-bold tabular-nums">
                  {count}
                </span>
              </div>
              <p className="p-6 text-sm leading-relaxed text-muted">
                {strand.summary}
              </p>
            </Link>
          );
        })}
      </div>

      {unassignedProjects.length > 0 ? (
        <div className="mt-8 rounded-[14px] border border-dashed border-line bg-surface p-6">
          <h2 className="font-bold text-ink">
            {unassignedProjects.length} projects still need a strand
          </h2>
          <p className="mt-1 text-sm text-muted">
            These came across from the planning workbook without one. A member of
            the IMPACT team needs to place them before students can find them by
            strand.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {unassignedProjects.map((project) => (
              <li key={project.slug}>
                <Link
                  href={`/projects/${project.slug}`}
                  className="inline-block rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink hover:border-light-purple"
                >
                  {project.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
}
