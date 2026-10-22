import Link from "next/link";

import type { Project } from "@/lib/curriculum";

/**
 * A catalogue entry is a starting point, not a closed menu. The strand is a
 * quiet tag rather than the headline — impact is the organising idea now.
 */
export function ProjectCard({ project, members }: { project: Project; members: number }) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="card flex h-full flex-col p-5 transition-shadow hover:shadow-md"
    >
      <h3 className="text-base font-bold leading-snug text-ink">{project.title}</h3>

      {project.description ? (
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{project.description}</p>
      ) : (
        <p className="mt-2 text-sm leading-relaxed text-muted">
          No brief written yet — shaping it is the first part of the work.
        </p>
      )}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4 text-xs">
        <span className="font-medium text-muted">
          {project.leads.length ? `Coach: ${project.leads.join(" & ")}` : "Looking for a student lead"}
        </span>
        <div className="flex items-center gap-2">
          {members > 0 ? (
            <span className="font-semibold tabular-nums text-royal-purple">{members} working on it</span>
          ) : null}
          {project.strand ? (
            <span className="rounded-full border border-line px-2 py-0.5 text-[0.62rem] text-muted">
              {project.strand}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
