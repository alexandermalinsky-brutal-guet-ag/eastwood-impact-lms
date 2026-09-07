"use client";

import { useMemo, useState } from "react";

import { ProjectCard } from "@/components/ProjectCard";
import { Empty } from "@/components/ui";
import { STRANDS, UNASSIGNED } from "@/lib/brand";
import type { Project } from "@/lib/curriculum";

type Item = Project & { members: number };

export function ProjectFilters({ projects }: { projects: Item[] }) {
  const [strand, setStrand] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((project) => {
      if (strand === UNASSIGNED.slug) {
        if (project.strand) return false;
      } else if (strand && project.strand !== strand) {
        return false;
      }
      if (!q) return true;
      return (
        project.title.toLowerCase().includes(q) ||
        project.description.toLowerCase().includes(q) ||
        project.leads.some((lead) => lead.toLowerCase().includes(q))
      );
    });
  }, [projects, strand, query]);

  const unassignedCount = projects.filter((p) => !p.strand).length;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setStrand(null)}
          aria-pressed={strand === null}
          className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
            strand === null
              ? "bg-deep-blue text-white"
              : "border border-line bg-surface text-muted hover:text-royal-purple"
          }`}
        >
          All {projects.length}
        </button>

        {STRANDS.map((s) => {
          const active = strand === s.name;
          const count = projects.filter((p) => p.strand === s.name).length;
          return (
            <button
              key={s.slug}
              type="button"
              onClick={() => setStrand(active ? null : s.name)}
              aria-pressed={active}
              className="rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors"
              style={
                active
                  ? { background: s.colour, color: s.ink }
                  : { background: "#fff", color: "var(--color-muted)", border: "1px solid var(--color-line)" }
              }
            >
              {s.name} {count}
            </button>
          );
        })}

        {unassignedCount > 0 ? (
          <button
            type="button"
            onClick={() =>
              setStrand(strand === UNASSIGNED.slug ? null : UNASSIGNED.slug)
            }
            aria-pressed={strand === UNASSIGNED.slug}
            className={`rounded-full border border-dashed px-3.5 py-1.5 text-sm font-semibold transition-colors ${
              strand === UNASSIGNED.slug
                ? "border-transparent bg-[#8b8b9a] text-white"
                : "border-line bg-surface text-muted hover:text-royal-purple"
            }`}
          >
            Needs a strand {unassignedCount}
          </button>
        ) : null}
      </div>

      <div className="mb-7">
        <label htmlFor="project-search" className="sr-only">
          Search projects
        </label>
        <input
          id="project-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search projects, descriptions or leads…"
          className="w-full rounded-lg border border-line bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-muted/60 sm:max-w-md"
        />
      </div>

      <p aria-live="polite" className="mb-4 text-sm text-muted">
        Showing {filtered.length} of {projects.length}
      </p>

      {filtered.length === 0 ? (
        <Empty title="Nothing matches that">
          Try a different word, or clear the strand filter.
        </Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCard
              key={project.slug}
              project={project}
              members={project.members}
            />
          ))}
        </div>
      )}
    </>
  );
}
