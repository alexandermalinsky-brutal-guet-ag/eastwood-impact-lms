import type { Metadata } from "next";
import Link from "next/link";

import { auth } from "@/auth";
import { AttendanceSummary } from "@/components/AttendanceSummary";
import { StartProject } from "@/components/StartProject";
import { Empty, LinkButton } from "@/components/ui";
import { getProject } from "@/lib/curriculum";
import { formatDueDate } from "@/lib/dates";
import { LEVEL_BY_N, MAX_LEVEL, PHASE_BY_KEY } from "@/lib/handbook";
import { enrolmentDetail, myAttendance, myEnrolments } from "@/lib/queries";

export const metadata: Metadata = { title: "Home" };
export const dynamic = "force-dynamic";

/**
 * The dashboard answers one question: what do I do today? One card per
 * project, each showing the single next step. Strands and the toolkit block
 * are gone — they were describing the programme, not helping anyone act.
 */
export default async function Dashboard() {
  const session = await auth();
  const user = session!.user;

  const [enrolments, attendance] = await Promise.all([
    myEnrolments(user.id),
    myAttendance(user.id),
  ]);
  const cards = await Promise.all(
    enrolments
      .filter((e) => e.status === "active")
      .map(async (enrolment) => {
        const detail = await enrolmentDetail(enrolment.id);
        const level = LEVEL_BY_N.get(enrolment.level);
        const nextMilestone = detail.milestones.find((m) => !m.done);
        const waiting = detail.evidence.some((e) => e.level === enrolment.level && e.status === "submitted");
        const returned = detail.evidence.find((e) => e.level === enrolment.level && e.status === "returned");

        // One next step, chosen by what actually blocks the project.
        let next = "Open the project";
        if (returned) next = "Revise and resubmit your evidence";
        else if (waiting) next = "Waiting on your coach to review your evidence";
        else if (!enrolment.problem) next = "Write the Impact Proposal";
        else if (!enrolment.proposalSubmittedAt && !enrolment.approvedAt) next = "Submit your proposal for approval";
        else if (!enrolment.approvedAt) next = "Waiting on your coach to approve the proposal";
        else if (detail.milestones.length < 3) next = "Add at least three dated milestones";
        else if (!enrolment.charterSignedAt) next = "Sign the Commitment Charter";
        else if (!enrolment.planValidatedAt) next = "Waiting on your coach to validate the plan";
        else if (nextMilestone) next = nextMilestone.title;
        else if (level) next = `Submit evidence: ${level.milestone}`;

        return {
          enrolment, detail, level, next,
          done: detail.milestones.filter((m) => m.done).length,
          total: detail.milestones.length,
          due: nextMilestone?.dueDate ?? "",
          blocked: waiting,
        };
      }),
  );

  const firstName = (user.name ?? user.email ?? "there").split(" ")[0];

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-royal-purple">IMPACT</p>
          <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-ink">
            {cards.length === 0 ? `Let's start something, ${firstName}.` : `Here's today, ${firstName}.`}
          </h1>
        </div>
        <StartProject />
      </div>

      {cards.length === 0 ? (
        <Empty title="No project yet">
          Start with your own idea, or look through what other students and coaches have put forward.
          Either way the first step is the same: say who it is for and what would be different.
        </Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {cards.map(({ enrolment, level, next, done, total, due, blocked }) => {
            const project = getProject(enrolment.projectSlug);
            const phase = PHASE_BY_KEY.get(enrolment.phase);
            const overdue = due && Date.parse(due) < Date.now();
            return (
              <Link
                key={enrolment.id}
                href={`/projects/${enrolment.projectSlug}`}
                className="card block min-w-0 p-5 transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[0.65rem] font-bold uppercase tracking-wider text-muted">
                    {phase?.name} · Level {enrolment.level} of {MAX_LEVEL}
                  </span>
                  {blocked ? (
                    <span className="rounded-full bg-paper px-2.5 py-0.5 text-[0.62rem] font-bold uppercase tracking-wider text-muted">
                      With coach
                    </span>
                  ) : null}
                </div>

                <h2 className="mt-2 text-lg font-bold leading-snug text-ink">
                  {enrolment.ownTitle || project?.title || enrolment.projectSlug}
                </h2>

                <div className="mt-4 rounded-lg bg-paper p-3">
                  <p className="text-[0.62rem] font-bold uppercase tracking-wider text-royal-purple">Next</p>
                  <p className="mt-0.5 text-sm font-semibold leading-snug text-ink">{next}</p>
                  {due ? (
                    <p className={`mt-1 text-xs ${overdue ? "font-bold text-mustard" : "text-muted"}`}>
                      {overdue ? "Overdue — " : "by "}
                      {formatDueDate(due, { day: "numeric", month: "short" })}
                    </p>
                  ) : null}
                </div>

                {total > 0 ? (
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                      <div className="h-full rounded-full bg-royal-purple transition-all"
                           style={{ width: `${(done / total) * 100}%` }} />
                    </div>
                    <span className="text-xs font-semibold tabular-nums text-muted">
                      {done}/{total} milestones
                    </span>
                  </div>
                ) : null}

                {enrolment.indicatorName ? (
                  <p className="mt-2 truncate text-xs text-muted">
                    {enrolment.indicatorName}: {enrolment.indicatorCurrent || enrolment.indicatorBaseline || "—"} → {enrolment.indicatorTarget}
                  </p>
                ) : null}
              </Link>
            );
          })}
        </div>
      )}

      <AttendanceSummary tally={attendance.tally} sessions={attendance.sessions} />

      <p className="mt-10 text-sm text-muted">
        New to this?{" "}
        <Link href="/handbook" className="font-semibold text-royal-purple underline">
          How IMPACT works
        </Link>{" "}
        · or{" "}
        <LinkButton href="/projects" variant="ghost" className="!px-0 !py-0 align-baseline">
          browse projects
        </LinkButton>
      </p>
    </>
  );
}
