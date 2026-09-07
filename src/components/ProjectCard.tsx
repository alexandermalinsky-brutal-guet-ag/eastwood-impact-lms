import Link from "next/link";

import { StrandChip } from "@/components/ui";
import { strandOf } from "@/lib/brand";
import type { Project } from "@/lib/curriculum";

export function ProjectCard({
  project,
  members,
}: {
  project: Project;
  members: number;
}) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="card flex h-full flex-col p-5 transition-shadow hover:shadow-md"
    >
      <StrandChip strand={strandOf(project.strand)} />

      <h3 className="mt-3 text-base font-bold leading-snug text-ink">
        {project.title}
      </h3>

      {project.description ? (
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">
          {project.description}
        </p>
      ) : null}

      <div className="mt-auto flex items-center justify-between pt-4 text-xs text-muted">
        <span className="font-medium">
          {project.leads.length
            ? `Led by ${project.leads.join(" & ")}`
            : "Needs a lead"}
        </span>
        {members > 0 ? (
          <span className="font-semibold tabular-nums text-royal-purple">
            {members} joined
          </span>
        ) : null}
      </div>
    </Link>
  );
}
