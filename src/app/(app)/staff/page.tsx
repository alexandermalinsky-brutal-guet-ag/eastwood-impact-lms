import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Empty, SectionHeading, Stat, StrandChip } from "@/components/ui";
import { strandOf } from "@/lib/brand";
import {
  people,
  projects,
  resources,
  unassignedProjects,
} from "@/lib/curriculum";
import { enrolmentCounts, staffOverview } from "@/lib/queries";

export const metadata: Metadata = { title: "Staff" };
export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const session = await auth();
  if (session!.user.role === "student") redirect("/dashboard");

  const [counts, roster] = await Promise.all([
    enrolmentCounts(),
    staffOverview(),
  ]);

  const takenUp = projects
    .map((project) => ({ project, members: counts.get(project.slug) ?? 0 }))
    .filter((row) => row.members > 0)
    .sort((a, b) => b.members - a.members);

  const unled = projects.filter((project) => project.leads.length === 0);
  const totalEnrolments = [...counts.values()].reduce((n, v) => n + v, 0);

  return (
    <>
      <SectionHeading
        eyebrow="Curriculum team"
        title="Programme overview"
        description="Where students are actually going, and which parts of the plan still need a person against them."
      />

      <div className="mb-10 grid gap-4 sm:grid-cols-4">
        <Stat value={roster.length} label="People on the platform" />
        <Stat value={totalEnrolments} label="Enrolments" accent="var(--color-royal-purple)" />
        <Stat value={unled.length} label="Projects with no lead" accent="var(--color-mustard)" />
        <Stat
          value={unassignedProjects.length}
          label="Projects with no strand"
          accent="var(--color-mustard)"
        />
      </div>

      <section className="mb-12">
        <h2 className="mb-4 text-xl font-bold tracking-tight text-ink">
          Take-up by project
        </h2>
        {takenUp.length === 0 ? (
          <Empty title="No enrolments yet">
            Once students start joining projects, the popular ones surface here.
          </Empty>
        ) : (
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead className="bg-paper text-left text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-3 font-bold">Project</th>
                  <th className="px-4 py-3 font-bold">Strand</th>
                  <th className="px-4 py-3 font-bold">Point person</th>
                  <th className="px-4 py-3 text-right font-bold">Joined</th>
                </tr>
              </thead>
              <tbody>
                {takenUp.map(({ project, members }) => (
                  <tr key={project.slug} className="border-t border-line">
                    <td className="px-4 py-3">
                      <Link
                        href={`/projects/${project.slug}`}
                        className="font-semibold text-ink hover:text-royal-purple"
                      >
                        {project.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <StrandChip strand={strandOf(project.strand)} />
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {project.leads.join(" & ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-royal-purple">
                      {members}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-xl font-bold tracking-tight text-ink">People</h2>
        {roster.length === 0 ? (
          <Empty title="No accounts yet">
            Seed the database to create the first accounts — see{" "}
            <span className="font-mono text-xs">README.md</span>.
          </Empty>
        ) : (
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead className="bg-paper text-left text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-3 font-bold">Name</th>
                  <th className="px-4 py-3 font-bold">Email</th>
                  <th className="px-4 py-3 font-bold">Role</th>
                  <th className="px-4 py-3 text-right font-bold">Active</th>
                  <th className="px-4 py-3 text-right font-bold">Complete</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((person) => (
                  <tr key={person.id} className="border-t border-line">
                    <td className="px-4 py-3 font-semibold text-ink">
                      {person.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted">{person.email}</td>
                    <td className="px-4 py-3 capitalize text-muted">{person.role}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-ink">
                      {person.active}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted">
                      {person.complete}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mb-12">
        <h2 className="mb-2 text-xl font-bold tracking-tight text-ink">
          Gaps in the plan
        </h2>
        <p className="mb-5 text-sm text-muted">
          Straight from the planning workbook — nothing here is a system error,
          it is work the team has not done yet.
        </p>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="card p-5">
            <h3 className="font-bold text-ink">
              No strand{" "}
              <span className="tabular-nums text-muted">
                {unassignedProjects.length}
              </span>
            </h3>
            <ul className="mt-3 space-y-1.5">
              {unassignedProjects.map((project) => (
                <li key={project.slug}>
                  <Link
                    href={`/projects/${project.slug}`}
                    className="text-sm text-ink hover:text-royal-purple"
                  >
                    {project.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-5">
            <h3 className="font-bold text-ink">
              No point person{" "}
              <span className="tabular-nums text-muted">{unled.length}</span>
            </h3>
            <p className="mt-2 text-sm text-muted">
              {unled.length} of {projects.length} projects have nobody named
              against them. Students can still join, but there is no adult to
              coach them through it.
            </p>
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-semibold text-royal-purple">
                Show all
              </summary>
              <ul className="mt-3 space-y-1.5">
                {unled.map((project) => (
                  <li key={project.slug}>
                    <Link
                      href={`/projects/${project.slug}`}
                      className="text-sm text-ink hover:text-royal-purple"
                    >
                      {project.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold tracking-tight text-ink">
          Named in the workbook
        </h2>
        <p className="mb-5 text-sm text-muted">
          {people.length} people appear as a point person against a project or a
          practice. These are names from the planning sheet, not platform
          accounts.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {people.map((person) => (
            <div key={person.slug} className="card p-4">
              <p className="font-bold text-ink">{person.name}</p>
              <p className="mt-1 text-sm text-muted">
                {person.projects.length} project
                {person.projects.length === 1 ? "" : "s"} ·{" "}
                {person.resources.length} practice
                {person.resources.length === 1 ? "" : "s"}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs text-muted">
          Curriculum source: {projects.length} projects and {resources.length}{" "}
          practices, generated from the IMPACT planning workbook. Edit the
          workbook and run{" "}
          <span className="font-mono">npm run data:extract</span> to update.
        </p>
      </section>
    </>
  );
}
