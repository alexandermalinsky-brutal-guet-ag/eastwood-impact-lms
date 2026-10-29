import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { ImpactProposal } from "@/components/ImpactProposal";
import { LeaveProject } from "@/components/LeaveProject";
import { formatDate } from "@/lib/dates";
import { PROPOSAL_STATES, proposalState } from "@/lib/proposal";
import { enrolmentBySlug, myEnrolmentFor, projectRoster } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Project" };

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
  const isStaff = user.role !== "student";

  // A coach opening a project from their queue does not own it, so it has to
  // be looked up by slug as well as by owner.
  const enrolment = mineHere ?? (isStaff ? await enrolmentBySlug(slug) : null);
  if (!enrolment) notFound();

  const title = enrolment.ownTitle || slug;
  const roster = await projectRoster(slug);
  const mine = enrolment.userId === user.id;
  const state = PROPOSAL_STATES[proposalState(enrolment)];

  return (
    <>
      <Link href="/dashboard" className="text-sm font-semibold text-muted hover:text-royal-purple">
        ← Back
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-2xl">
          <p className={`mb-2 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${state.text}`}>
            <span className={`h-2 w-2 rounded-full ${state.dot}`} />
            {state.label}
          </p>

          <h1 className="text-3xl font-bold leading-tight tracking-tight text-ink">{title}</h1>

          {/* The proposal's problem statement supersedes the one-liner written
              on day one, once there is one. */}
          {enrolment.problem || enrolment.ownSummary ? (
            <p className="mt-3 text-base leading-relaxed text-muted">
              {enrolment.problem || enrolment.ownSummary}
            </p>
          ) : null}

          <p className="mt-3 text-sm text-muted">
            Coached by{" "}
            <span className="font-semibold text-ink">
              {enrolment.coachName || "nobody yet"}
            </span>
          </p>
        </div>

        {mine ? (
          <LeaveProject
            enrolmentId={enrolment.id}
            status={enrolment.status}
            approved={Boolean(enrolment.approvedAt)}
            withdrawnReason={enrolment.withdrawnReason}
          />
        ) : null}
      </header>

      <div className="mt-8">
        <ImpactProposal enrolment={enrolment} canEdit={mine} canReview={isStaff} />
      </div>

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
