import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { CoachQueue } from "@/components/CoachQueue";
import { Empty, SectionHeading } from "@/components/ui";
import { getProject } from "@/lib/curriculum";
import { formatDate } from "@/lib/dates";
import { PROPOSAL_STATES, proposalState } from "@/lib/proposal";
import { proposalsAwaitingReview, studentProjects } from "@/lib/queries";

export const metadata: Metadata = { title: "Coach" };
export const dynamic = "force-dynamic";

/**
 * Coach home. The brief's test: open it once a day and see in one minute who
 * needs you. Action queue first, because that is what is waiting on the coach.
 */
export default async function CoachPage() {
  const session = await auth();
  if (session!.user.role === "student") redirect("/dashboard");
  const meId = session!.user.id;

  const [proposals, rows] = await Promise.all([
    proposalsAwaitingReview(),
    studentProjects(),
  ]);

  const title = (slug: string, own: string) => own || getProject(slug)?.title || slug;

  return (
    <>
      <SectionHeading
        eyebrow="Coach"
        title={
          proposals.length === 0
            ? "Nothing waiting on you."
            : `${proposals.length} proposal${proposals.length === 1 ? "" : "s"} waiting on you`
        }
        description="Oldest first. Everything here is blocked until you act on it."
      />

      <CoachQueue
        meId={meId}
        proposals={proposals.map((p) => ({ ...p, title: title(p.projectSlug, p.ownTitle) }))}
      />

      <section className="mt-12">
        <h2 className="mb-1 text-xl font-bold tracking-tight text-ink">My students</h2>
        <p className="mb-5 text-sm text-muted">
          Every student project and where its proposal stands.
        </p>

        {rows.length === 0 ? (
          <Empty title="No students on projects yet">
            Once students start a project they appear here.
          </Empty>
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="w-full min-w-[42rem] text-sm">
              <thead className="bg-paper text-left text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-3 font-bold">Student</th>
                  <th className="px-4 py-3 font-bold">Project</th>
                  <th className="px-4 py-3 font-bold">Coach</th>
                  <th className="px-4 py-3 font-bold">Started</th>
                  <th className="px-4 py-3 font-bold">Proposal</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const state = PROPOSAL_STATES[proposalState(r)];
                  return (
                    <tr key={r.enrolmentId} className="border-t border-line">
                      <td className="px-4 py-3 font-semibold text-ink">{r.studentName ?? r.studentEmail}</td>
                      <td className="px-4 py-3">
                        <Link href={`/projects/${r.projectSlug}`} className="text-ink hover:text-royal-purple">
                          {title(r.projectSlug, r.ownTitle)}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted">{r.coachName || "—"}</td>
                      <td className="px-4 py-3 tabular-nums text-muted">{formatDate(r.joinedAt)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 font-semibold ${state.text}`}>
                          <span className={`h-2 w-2 rounded-full ${state.dot}`} />
                          {state.label}
                        </span>
                        {r.status === "withdrawn" && r.withdrawnReason ? (
                          <span className="mt-1 block max-w-[16rem] text-xs font-normal text-muted">
                            {r.withdrawnReason}
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
