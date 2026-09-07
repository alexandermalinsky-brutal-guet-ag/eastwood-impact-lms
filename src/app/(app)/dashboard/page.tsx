import type { Metadata } from "next";
import Link from "next/link";

import { auth } from "@/auth";
import { Card, Empty, LinkButton, SectionHeading, StrandChip, Stat } from "@/components/ui";
import { isDatabaseConfigured } from "@/db";
import { STRANDS, strandOf } from "@/lib/brand";
import { corePractices, getProject, projects, strandCounts } from "@/lib/curriculum";
import { enrolmentDetail, myEnrolments } from "@/lib/queries";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const session = await auth();
  const user = session!.user;
  const enrolments = await myEnrolments(user.id);

  const details = await Promise.all(
    enrolments.map(async (enrolment) => ({
      enrolment,
      project: getProject(enrolment.projectSlug),
      detail: await enrolmentDetail(enrolment.id),
    })),
  );

  const active = details.filter((d) => d.enrolment.status === "active");
  const complete = details.filter((d) => d.enrolment.status === "complete");
  const openTasks = details.reduce(
    (n, d) => n + d.detail.tasks.filter((t) => t.status !== "done").length,
    0,
  );

  const firstName = (user.name ?? user.email ?? "there").split(" ")[0];

  return (
    <>
      <div className="mb-9">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-royal-purple">
          IMPACT
        </p>
        <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-ink">
          Good to see you, {firstName}.
        </h1>
      </div>

      {!isDatabaseConfigured() ? (
        <div className="mb-8 rounded-[14px] border border-mustard/40 bg-mustard/10 p-5">
          <p className="font-semibold text-ink">Running without a database</p>
          <p className="mt-1 text-sm text-muted">
            The curriculum below is read from the repository, but enrolments and
            reflections cannot be saved until a Postgres store is attached to
            this project.
          </p>
        </div>
      ) : null}

      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <Stat value={active.length} label="Active projects" />
        <Stat
          value={openTasks}
          label="Open tasks"
          accent="var(--color-royal-purple)"
        />
        <Stat
          value={complete.length}
          label="Completed"
          accent="var(--color-forest-green)"
        />
      </div>

      <section className="mb-12">
        <SectionHeading
          title="Your projects"
          description="Everything you are signed up to, with the next thing waiting on you."
          action={<LinkButton href="/projects" variant="secondary">Browse projects</LinkButton>}
        />

        {active.length === 0 ? (
          <Empty title="You have not joined a project yet">
            Pick one from the{" "}
            <Link href="/projects" className="font-semibold text-royal-purple underline">
              project menu
            </Link>{" "}
            — there are {projects.length} to choose from.
          </Empty>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {active.map(({ enrolment, project, detail }) => {
              const done = detail.tasks.filter((t) => t.status === "done").length;
              const total = detail.tasks.length;
              const met = detail.criteria.filter((c) => c.met).length;
              const next = detail.tasks.find((t) => t.status !== "done");

              return (
                <Link
                  key={enrolment.id}
                  href={`/projects/${enrolment.projectSlug}`}
                  className="card block p-5 transition-shadow hover:shadow-md"
                >
                  <StrandChip strand={strandOf(project?.strand)} />
                  <h3 className="mt-3 text-lg font-bold leading-snug text-ink">
                    {project?.title ?? enrolment.projectSlug}
                  </h3>

                  <div className="mt-4 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                      <div
                        className="h-full rounded-full bg-royal-purple transition-all"
                        style={{ width: `${total ? (done / total) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold tabular-nums text-muted">
                      {done}/{total}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-muted">
                    {next ? (
                      <>
                        <span className="font-semibold text-ink">Next:</span>{" "}
                        {next.title}
                      </>
                    ) : (
                      "Board clear — time to open the next cycle."
                    )}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {met} of {detail.criteria.length} success criteria met ·{" "}
                    {detail.reflections.length} cycle
                    {detail.reflections.length === 1 ? "" : "s"}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {complete.length > 0 ? (
        <section className="mb-12">
          <SectionHeading title="Completed" />
          <div className="flex flex-wrap gap-2">
            {complete.map(({ enrolment, project }) => (
              <Link
                key={enrolment.id}
                href={`/projects/${enrolment.projectSlug}`}
                className="card px-4 py-2 text-sm font-semibold text-ink hover:border-light-purple"
              >
                {project?.title ?? enrolment.projectSlug}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mb-12">
        <SectionHeading
          eyebrow="The six strands"
          title="Where the work lives"
          action={<LinkButton href="/strands" variant="secondary">All strands</LinkButton>}
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {STRANDS.map((strand) => {
            const count = strandCounts.find((s) => s.strand.name === strand.name)!.count;
            return (
              <Link
                key={strand.slug}
                href={`/strands/${strand.slug}`}
                className="group rounded-[14px] p-5 transition-transform hover:-translate-y-0.5"
                style={{ background: strand.colour, color: strand.ink }}
              >
                <div className="flex items-baseline justify-between">
                  <h3 className="text-lg font-bold">{strand.name}</h3>
                  <span className="text-2xl font-bold tabular-nums opacity-50">
                    {count}
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium opacity-80">
                  {strand.definition}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <SectionHeading
          eyebrow="Toolkit"
          title="Core practices"
          description="The nine practices the IMPACT team is rolling out first, each with a member of staff who owns it."
          action={<LinkButton href="/toolkit" variant="secondary">Full toolkit</LinkButton>}
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {corePractices.map((practice) => (
            <Link key={practice.slug} href={`/toolkit/${practice.slug}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <p className="font-semibold leading-snug text-ink">
                  {practice.title}
                </p>
                <p className="mt-1.5 text-xs text-muted">
                  {practice.leads.length
                    ? `Owned by ${practice.leads.join(" & ")}`
                    : "No owner yet"}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
