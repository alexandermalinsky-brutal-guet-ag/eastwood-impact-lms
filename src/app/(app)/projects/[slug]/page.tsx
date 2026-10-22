import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { Criteria } from "@/components/Criteria";
import { ImpactProposal } from "@/components/ImpactProposal";
import { Kanban } from "@/components/Kanban";
import { LevelMap } from "@/components/LevelMap";
import { Plan } from "@/components/Plan";
import { ProjectTabs } from "@/components/ProjectTabs";
import { ReflectionCycles } from "@/components/ReflectionCycles";
import { AskCoach, EvidenceLog, ImpactTracker, ReportDraft } from "@/components/Execute";
import { JoinButton } from "@/components/JoinButton";
import { Empty } from "@/components/ui";
import { getProject, projects } from "@/lib/curriculum";
import { enrolmentDetail, myEnrolmentFor, projectRoster } from "@/lib/queries";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const project = getProject((await params).slug);
  return { title: project?.title ?? "Project" };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  const user = session!.user;

  const enrolment = await myEnrolmentFor(user.id, slug);
  const catalogue = getProject(slug);
  // An own-idea project has no catalogue entry; its title lives on the enrolment.
  if (!catalogue && !enrolment) notFound();

  const title = catalogue?.title ?? enrolment?.ownTitle ?? "Project";
  const detail = enrolment
    ? await enrolmentDetail(enrolment.id)
    : { tasks: [], criteria: [], reflections: [], milestones: [], evidence: [], help: [], scorecards: [] };
  const roster = await projectRoster(slug);
  const isStaff = user.role !== "student";
  const mine = Boolean(enrolment) && enrolment!.userId === user.id;

  return (
    <>
      <Link href="/projects" className="text-sm font-semibold text-muted hover:text-royal-purple">
        ← All projects
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-ink">{title}</h1>
          {enrolment?.problem ? (
            <p className="mt-3 text-base leading-relaxed text-muted">{enrolment.problem}</p>
          ) : catalogue?.description ? (
            <p className="mt-3 text-base leading-relaxed text-muted">{catalogue.description}</p>
          ) : null}

          {enrolment?.indicatorName ? (
            <p className="mt-4 inline-flex flex-wrap items-baseline gap-2 rounded-lg bg-paper px-4 py-2 text-sm">
              <span className="font-semibold text-ink">{enrolment.indicatorName}</span>
              <span className="text-muted">
                {enrolment.indicatorCurrent || enrolment.indicatorBaseline || "—"} → {enrolment.indicatorTarget || "—"}
              </span>
            </p>
          ) : null}
        </div>

        {enrolment ? (
          <JoinButton
            projectSlug={slug}
            enrolmentId={enrolment.id}
            status={enrolment.status}
            phase={enrolment.phase}
            level={enrolment.level}
          />
        ) : (
          <JoinButton projectSlug={slug} enrolmentId={null} status={null} phase="create" level={1} />
        )}
      </header>

      {enrolment ? (
        <div className="mt-8">
          <ProjectTabs
            phase={enrolment.phase}
            panes={{
              overview: (
                <div className="space-y-8">
                  <LevelMap
                    enrolmentId={enrolment.id}
                    level={enrolment.level}
                    evidence={detail.evidence}
                    canSubmit={mine}
                  />
                  <ImpactProposal enrolment={enrolment} canEdit={mine} canReview={isStaff} />
                </div>
              ),
              plan: (
                <Plan
                  enrolment={enrolment}
                  milestones={detail.milestones}
                  criteria={detail.criteria}
                  canEdit={mine}
                  canReview={isStaff}
                  CriteriaBlock={<Criteria enrolmentId={enrolment.id} criteria={detail.criteria} />}
                />
              ),
              work: (
                <div className="space-y-8">
                  <Kanban enrolmentId={enrolment.id} tasks={detail.tasks} />
                  <AskCoach enrolmentId={enrolment.id} requests={detail.help} canAsk={mine} canAnswer={isStaff} />
                  <ReflectionCycles enrolmentId={enrolment.id} reflections={detail.reflections} />
                </div>
              ),
              evidence: (
                <div className="space-y-8">
                  <ImpactTracker enrolment={enrolment} canEdit={mine} />
                  <EvidenceLog evidence={detail.evidence} canReview={isStaff} />
                </div>
              ),
              report: <ReportDraft enrolment={enrolment} detail={detail} />,
            }}
          />
        </div>
      ) : (
        <section className="mt-8">
          <Empty title="You are not on this project yet">
            Joining gives you the Impact Proposal, a dated plan, a level map that unlocks on evidence,
            and a report at the end that assembles itself from the work.
          </Empty>
        </section>
      )}

      {isStaff && roster.length > 0 ? (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-bold tracking-tight text-ink">Who is on this</h2>
          <div className="card overflow-x-auto p-0">
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
                    <td className="px-4 py-3 font-semibold text-ink">{row.name ?? row.email}</td>
                    <td className="px-4 py-3 capitalize text-muted">{row.role}</td>
                    <td className="px-4 py-3 capitalize text-muted">{row.status}</td>
                    <td className="px-4 py-3 tabular-nums text-muted">{row.joinedAt.toLocaleDateString("en-GB")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </>
  );
}
