import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { ImpactProposal } from "@/components/ImpactProposal";
import { JoinButton } from "@/components/JoinButton";
import { Empty } from "@/components/ui";
import { getProject, projects } from "@/lib/curriculum";
import { formatDate } from "@/lib/dates";
import { PROPOSAL_STATES, proposalState } from "@/lib/proposal";
import { coachList, enrolmentBySlug, myEnrolmentFor, projectRoster } from "@/lib/queries";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const project = getProject((await params).slug);
  return { title: project?.title ?? "Project" };
}

/**
 * A project is its Impact Proposal and nothing else. Who it is for, what
 * would be different, how you would know — written by the student, read by a
 * coach, approved or sent back. Everything that came after it is not built.
 */
export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  const user = session!.user;

  const mineHere = await myEnrolmentFor(user.id, slug);
  const catalogue = getProject(slug);
  const isStaff = user.role !== "student";

  // An own-idea project has no catalogue entry, so a coach opening it from
  // their queue has nothing to render unless we look it up by slug.
  const enrolment = mineHere ?? (isStaff ? await enrolmentBySlug(slug) : null);
  if (!catalogue && !enrolment) notFound();

  const title = catalogue?.title ?? enrolment?.ownTitle ?? "Project";
  const [roster, coaches] = await Promise.all([projectRoster(slug), coachList()]);
  const mine = Boolean(enrolment) && enrolment!.userId === user.id;
  const state = enrolment ? PROPOSAL_STATES[proposalState(enrolment)] : null;

  return (
    <>
      <Link href="/projects" className="text-sm font-semibold text-muted hover:text-royal-purple">
        ← All projects
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-2xl">
          {state ? (
            <p className={`mb-2 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${state.text}`}>
              <span className={`h-2 w-2 rounded-full ${state.dot}`} />
              {state.label}
            </p>
          ) : null}

          <h1 className="text-3xl font-bold leading-tight tracking-tight text-ink">{title}</h1>

          {/* The proposal's problem statement supersedes whatever was written
              on day one, which in turn stands in for a catalogue brief. */}
          {enrolment?.problem || catalogue?.description || enrolment?.ownSummary ? (
            <p className="mt-3 text-base leading-relaxed text-muted">
              {enrolment?.problem || catalogue?.description || enrolment?.ownSummary}
            </p>
          ) : null}

          {enrolment ? (
            <p className="mt-3 text-sm text-muted">
              Coached by{" "}
              <span className="font-semibold text-ink">
                {enrolment.coachName || "nobody yet"}
              </span>
            </p>
          ) : null}
        </div>

        <JoinButton
          projectSlug={slug}
          enrolmentId={enrolment?.id ?? null}
          status={enrolment?.status ?? null}
          approved={Boolean(enrolment?.approvedAt)}
          withdrawnReason={enrolment?.withdrawnReason ?? ""}
          coaches={coaches}
        />
      </header>

      {enrolment ? (
        <div className="mt-8">
          <ImpactProposal enrolment={enrolment} canEdit={mine} canReview={isStaff} />
        </div>
      ) : (
        <section className="mt-8">
          <Empty title="You are not on this project yet">
            Joining gives you the Impact Proposal: who it is for, what would be
            different, and how you would know. A coach reads it and either
            approves it or sends it back.
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
                    <td className="px-4 py-3 tabular-nums text-muted">{formatDate(row.joinedAt)}</td>
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
