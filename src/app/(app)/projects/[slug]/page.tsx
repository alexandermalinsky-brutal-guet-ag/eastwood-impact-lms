import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { JoinButton } from "@/components/JoinButton";
import { Kanban } from "@/components/Kanban";
import { Criteria } from "@/components/Criteria";
import { ReflectionCycles } from "@/components/ReflectionCycles";
import { Goals } from "@/components/Goals";
import { JourneyTracker } from "@/components/JourneyTracker";
import { Proposal } from "@/components/Proposal";
import { Scorecards } from "@/components/Scorecard";
import { StageAdvance } from "@/components/StageAdvance";
import { StrandChip } from "@/components/ui";
import { strandOf, strandsOf } from "@/lib/brand";
import { PROJECT_TYPES } from "@/lib/handbook";
import { corePractices, getProject, projects } from "@/lib/curriculum";
import { enrolmentDetail, myEnrolmentFor, projectRoster } from "@/lib/queries";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const project = getProject((await params).slug);
  return { title: project?.title ?? "Project" };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const session = await auth();
  const user = session!.user;
  const strand = strandOf(project.strand);
  const enrolment = await myEnrolmentFor(user.id, slug);
  const detail = enrolment
    ? await enrolmentDetail(enrolment.id)
    : { tasks: [], criteria: [], reflections: [], goals: [], scorecards: [] };
  const roster = await projectRoster(slug);
  const isStaff = user.role !== "student";

  return (
    <>
      <Link
        href={strand ? `/strands/${strand.slug}` : "/projects"}
        className="text-sm font-semibold text-muted hover:text-royal-purple"
      >
        ← {strand ? strand.name : "All projects"}
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            {project.strands.length > 0 ? (
              strandsOf(project.strands).map((s) => (
                <StrandChip key={s.slug} strand={s} size="md" />
              ))
            ) : (
              <StrandChip strand={strand} size="md" />
            )}
            {project.origin === "handbook" ? (
              <span className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-muted">
                Handbook kickoff project
              </span>
            ) : null}
            {project.projectType ? (
              <span className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-muted">
                {PROJECT_TYPES.find((t) => t.key === project.projectType)?.label}
              </span>
            ) : null}
          </div>
          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-ink">
            {project.title}
          </h1>

          {project.description ? (
            <p className="mt-3 text-base leading-relaxed text-muted">
              {project.description}
            </p>
          ) : (
            <p className="mt-3 text-base leading-relaxed text-muted">
              This project came from the IMPACT planning workbook and does not
              have a written brief yet — shaping it is part of the work.
            </p>
          )}

          <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-muted">
                Point person
              </dt>
              <dd className="mt-0.5 font-semibold text-ink">
                {project.leads.length ? project.leads.join(" & ") : "Not yet assigned"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-muted">
                Signed up
              </dt>
              <dd className="mt-0.5 font-semibold text-ink tabular-nums">
                {roster.length}
              </dd>
            </div>
            {project.notes ? (
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-muted">
                  Note
                </dt>
                <dd className="mt-0.5 font-semibold text-ink">{project.notes}</dd>
              </div>
            ) : null}
          </dl>
        </div>

        <JoinButton
          projectSlug={slug}
          enrolmentId={enrolment?.id ?? null}
          status={enrolment?.status ?? null}
        />
      </header>

      {enrolment ? (
        <div className="mt-12 space-y-12">
          <section>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
              <h2 className="text-xl font-bold tracking-tight text-ink">
                The IMPACT Journey
              </h2>
              <StageAdvance
                enrolmentId={enrolment.id}
                stage={enrolment.stage}
                isStaff={isStaff}
                approved={Boolean(enrolment.approvedAt)}
                charterSigned={Boolean(enrolment.charterSignedAt)}
              />
            </div>
            <JourneyTracker current={enrolment.stage} />
          </section>

          <Proposal enrolment={enrolment} canApprove={isStaff} />

          {enrolment.stage !== "ideation" ? (
            <Goals
              enrolmentId={enrolment.id}
              goals={detail.goals}
              editable
            />
          ) : null}

          <Kanban enrolmentId={enrolment.id} tasks={detail.tasks} />
          <Criteria enrolmentId={enrolment.id} criteria={detail.criteria} />
          <ReflectionCycles
            enrolmentId={enrolment.id}
            reflections={detail.reflections}
          />

          <Scorecards
            enrolmentId={enrolment.id}
            scorecards={detail.scorecards}
            kind="student"
            canWrite
          />
          <Scorecards
            enrolmentId={enrolment.id}
            scorecards={detail.scorecards}
            kind="coach"
            canWrite={isStaff}
          />
        </div>
      ) : (
        <section className="mt-12 rounded-[14px] border border-line bg-surface p-8">
          <h2 className="text-xl font-bold tracking-tight text-ink">
            What joining gives you
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            A kanban board for the work, a set of success criteria you agree with
            your coach, and a Plan – Act – Reflect record that becomes the
            evidence you show at demo time.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              ["Kanban board", "Backlog → doing → review → done, in one place."],
              ["Success criteria", "Your definition of done, agreed up front."],
              ["Plan · Act · Reflect", "One entry per cycle, plus the question it raised."],
            ].map(([title, body]) => (
              <li key={title} className="rounded-lg bg-paper p-4">
                <p className="font-semibold text-ink">{title}</p>
                <p className="mt-1 text-sm text-muted">{body}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {isStaff && roster.length > 0 ? (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-bold tracking-tight text-ink">
            Roster
          </h2>
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead className="bg-paper text-left text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-3 font-bold">Name</th>
                  <th className="px-4 py-3 font-bold">Role</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold">Joined</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((row) => (
                  <tr key={row.id} className="border-t border-line">
                    <td className="px-4 py-3 font-semibold text-ink">
                      {row.name ?? row.email}
                    </td>
                    <td className="px-4 py-3 capitalize text-muted">{row.role}</td>
                    <td className="px-4 py-3 capitalize text-muted">{row.status}</td>
                    <td className="px-4 py-3 tabular-nums text-muted">
                      {row.joinedAt.toLocaleDateString("en-GB")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="mt-12">
        <h2 className="mb-4 text-xl font-bold tracking-tight text-ink">
          Practices that help here
        </h2>
        <div className="flex flex-wrap gap-2">
          {corePractices.slice(0, 6).map((practice) => (
            <Link
              key={practice.slug}
              href={`/toolkit/${practice.slug}`}
              className="card px-4 py-2 text-sm font-semibold text-ink hover:border-light-purple"
            >
              {practice.title}
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
