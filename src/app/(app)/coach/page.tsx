import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { CoachQueue } from "@/components/CoachQueue";
import { Empty, SectionHeading } from "@/components/ui";
import { getProject } from "@/lib/curriculum";
import { PHASE_BY_KEY } from "@/lib/handbook";
import { coachBoard, plansAwaitingReview, proposalsAwaitingReview } from "@/lib/queries";

export const metadata: Metadata = { title: "Coach" };
export const dynamic = "force-dynamic";

const LIGHT = {
  "on-track": { label: "On track", dot: "bg-forest-green", text: "text-forest-green" },
  "at-risk": { label: "At risk", dot: "bg-mustard", text: "text-mustard" },
  stalled: { label: "Stalled", dot: "bg-red-600", text: "text-red-700" },
} as const;

/**
 * Coach home. The brief's test: open it once a day and see in one minute who
 * needs you. Action queue first, because that is what is waiting on the coach.
 */
export default async function CoachPage() {
  const session = await auth();
  if (session!.user.role === "student") redirect("/dashboard");

  const [board, proposals, plans] = await Promise.all([
    coachBoard(),
    proposalsAwaitingReview(),
    plansAwaitingReview(),
  ]);

  const title = (slug: string, own: string) => own || getProject(slug)?.title || slug;
  const waiting = proposals.length + plans.length + board.pendingEvidence.length + board.pendingHelp.length;
  const needAttention = board.rows.filter((r) => r.light !== "on-track");

  return (
    <>
      <SectionHeading
        eyebrow="Coach"
        title={waiting === 0 ? "Nothing waiting on you." : `${waiting} thing${waiting === 1 ? "" : "s"} waiting on you`}
        description="Oldest first. Everything here is blocked until you act on it."
      />

      <CoachQueue
        proposals={proposals.map((p) => ({ ...p, title: title(p.projectSlug, p.ownTitle) }))}
        plans={plans.map((p) => ({ ...p, title: title(p.projectSlug, p.ownTitle) }))}
        evidence={board.pendingEvidence.map((e) => ({ ...e, title: title(e.projectSlug, e.ownTitle) }))}
        help={board.pendingHelp.map((h) => ({ ...h, title: title(h.projectSlug, h.ownTitle) }))}
      />

      <section className="mt-12">
        <h2 className="mb-1 text-xl font-bold tracking-tight text-ink">My students</h2>
        <p className="mb-5 text-sm text-muted">
          Stalled means no evidence for seven days and a milestone past its date.
        </p>

        {board.rows.length === 0 ? (
          <Empty title="No students on projects yet">
            Once students start a project they appear here with a status light.
          </Empty>
        ) : (
          <>
            {needAttention.length > 0 ? (
              <p className="mb-3 text-sm font-semibold text-ink">
                {needAttention.length} need{needAttention.length === 1 ? "s" : ""} a look:{" "}
                <span className="font-normal text-muted">
                  {needAttention.map((r) => r.studentName ?? r.studentEmail).join(", ")}
                </span>
              </p>
            ) : null}

            <div className="card overflow-x-auto p-0">
              <table className="w-full min-w-[52rem] text-sm">
                <thead className="bg-paper text-left text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-4 py-3 font-bold">Student</th>
                    <th className="px-4 py-3 font-bold">Project</th>
                    <th className="px-4 py-3 font-bold">Phase</th>
                    <th className="px-4 py-3 font-bold">Next milestone</th>
                    <th className="px-4 py-3 font-bold">Last evidence</th>
                    <th className="px-4 py-3 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {board.rows.map((r) => {
                    const light = LIGHT[r.light];
                    return (
                      <tr key={r.enrolmentId} className="border-t border-line">
                        <td className="px-4 py-3 font-semibold text-ink">{r.studentName ?? r.studentEmail}</td>
                        <td className="px-4 py-3">
                          <Link href={`/projects/${r.projectSlug}`} className="text-ink hover:text-royal-purple">
                            {title(r.projectSlug, r.ownTitle)}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {PHASE_BY_KEY.get(r.phase)?.name} · L{r.level}
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {r.next ? (
                            <>
                              {r.next.title}
                              {r.next.dueDate ? (
                                <span className="block text-xs">
                                  {new Date(r.next.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                                </span>
                              ) : null}
                            </>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {r.lastEvidenceAt ? r.lastEvidenceAt.toLocaleDateString("en-GB") : "none yet"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 font-semibold ${light.text}`}>
                            <span className={`h-2 w-2 rounded-full ${light.dot}`} />
                            {light.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </>
  );
}
