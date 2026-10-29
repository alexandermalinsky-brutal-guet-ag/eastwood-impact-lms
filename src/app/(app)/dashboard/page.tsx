import type { Metadata } from "next";
import Link from "next/link";

import { auth } from "@/auth";
import { AttendanceSummary } from "@/components/AttendanceSummary";
import { StartProject } from "@/components/StartProject";
import { Empty, LinkButton } from "@/components/ui";
import { PROPOSAL_STATES, proposalState } from "@/lib/proposal";
import { coachList, myAttendance, myEnrolments } from "@/lib/queries";

export const metadata: Metadata = { title: "Home" };
export const dynamic = "force-dynamic";

/**
 * The dashboard answers one question: what do I do today? One card per
 * project, each showing where its proposal stands and the single next step.
 */
export default async function Dashboard() {
  const session = await auth();
  const user = session!.user;

  const [enrolments, attendance, coaches] = await Promise.all([
    myEnrolments(user.id),
    myAttendance(user.id),
    coachList(),
  ]);
  const cards = enrolments
    .filter((e) => e.status === "active")
    .map((enrolment) => ({ enrolment, state: PROPOSAL_STATES[proposalState(enrolment)] }));

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
        <StartProject coaches={coaches} large />
      </div>

      {cards.length === 0 ? (
        <Empty title="No project yet">
          Start with your own idea, or look through what other students and coaches have put forward.
          Either way the first step is the same: say who it is for and what would be different.
        </Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {cards.map(({ enrolment, state }) => {
            return (
              <Link
                key={enrolment.id}
                href={`/projects/${enrolment.projectSlug}`}
                className="card block min-w-0 p-5 transition-shadow hover:shadow-md"
              >
                <p className={`inline-flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-wider ${state.text}`}>
                  <span className={`h-2 w-2 rounded-full ${state.dot}`} />
                  {state.label}
                </p>

                <h2 className="mt-2 text-lg font-bold leading-snug text-ink">
                  {enrolment.ownTitle || enrolment.projectSlug}
                </h2>

                <div className="mt-4 rounded-lg bg-paper p-3">
                  <p className="text-[0.62rem] font-bold uppercase tracking-wider text-royal-purple">Next</p>
                  <p className="mt-0.5 text-sm font-semibold leading-snug text-ink">{state.next}</p>
                </div>
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
