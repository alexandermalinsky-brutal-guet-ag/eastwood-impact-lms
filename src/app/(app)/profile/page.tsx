import type { Metadata } from "next";
import Link from "next/link";

import { auth } from "@/auth";
import { Empty, SectionHeading } from "@/components/ui";
import { getProject } from "@/lib/curriculum";
import { formatLongDate } from "@/lib/dates";
import { PHASES } from "@/lib/handbook";
import { PROPOSAL_STATES, proposalState } from "@/lib/proposal";
import { myEnrolments, myProfile } from "@/lib/queries";

export const metadata: Metadata = { title: "Impact Profile" };
export const dynamic = "force-dynamic";

/**
 * Who you are, what phase of the programme you are in, and every project you
 * have started. The synthesis of scorecards and reflections this page used to
 * carry went with the phases that produced them.
 */
export default async function ProfilePage() {
  const session = await auth();
  const user = session!.user;

  const [profile, enrolments] = await Promise.all([
    myProfile(user.id),
    myEnrolments(user.id),
  ]);
  const phase = PHASES.find((p) => p.key === (profile?.phase ?? "exploration"))!;

  return (
    <>
      <SectionHeading
        eyebrow="Eastwood Passport"
        title="Your Impact Profile"
        description="Where you are in the programme, and everything you have put your name to."
      />

      <section className="mb-10 overflow-hidden rounded-[14px] border border-line bg-surface">
        <div className="brand-gradient p-6 text-white">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-light-purple">
            {profile?.role === "student" ? "Student" : profile?.role === "coach" ? "Coach" : "Admin"}
            {profile?.grade ? ` · Grade ${profile.grade}` : ""}
            {profile?.academicYear ? ` · ${profile.academicYear}` : ""}
          </p>
          <h2 className="mt-1.5 text-2xl font-bold tracking-tight">
            {profile?.name ?? user.email}
          </h2>
          <p className="mt-0.5 text-sm text-white/70">{profile?.email ?? user.email}</p>
        </div>

        <div className="grid gap-0 sm:grid-cols-3">
          {PHASES.map((p) => {
            const current = p.key === phase.key;
            const passed = PHASES.indexOf(p) < PHASES.indexOf(phase);
            return (
              <div
                key={p.key}
                aria-current={current ? "step" : undefined}
                className={`border-t border-line p-5 sm:border-l sm:border-t-0 sm:first:border-l-0 ${
                  current ? "bg-royal-purple/5" : ""
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className={`font-bold ${current ? "text-royal-purple" : passed ? "text-ink" : "text-muted"}`}>
                    {p.name}
                  </p>
                  {current ? (
                    <span className="rounded-full bg-royal-purple px-2.5 py-0.5 text-[0.62rem] font-bold uppercase tracking-wider text-white">
                      You are here
                    </span>
                  ) : passed ? (
                    <span className="text-xs font-bold text-forest-green">✓</span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs font-medium text-muted">{p.typicalGrade}</p>
                {current ? (
                  <p className="mt-2 text-sm leading-relaxed text-ink">{p.expectation}</p>
                ) : null}
              </div>
            );
          })}
        </div>

        <p className="border-t border-line px-5 py-3 text-xs leading-relaxed text-muted">
          Phase is set by a coach on demonstrated readiness — not by year group.
          Growth is developmental, not chronological.
        </p>
      </section>

      <section>
        <h2 className="mb-5 text-xl font-bold tracking-tight text-ink">Your projects</h2>

        {enrolments.length === 0 ? (
          <Empty title="Nothing here yet">
            Your profile fills in as you work.{" "}
            <Link href="/projects" className="font-semibold text-royal-purple underline">
              Start a project
            </Link>{" "}
            to begin.
          </Empty>
        ) : (
          <div className="space-y-4">
            {enrolments.map((enrolment) => {
              const project = getProject(enrolment.projectSlug);
              const state = PROPOSAL_STATES[proposalState(enrolment)];
              const withdrawn = enrolment.status === "withdrawn";
              return (
                <Link
                  key={enrolment.id}
                  href={`/projects/${enrolment.projectSlug}`}
                  className={`card block p-5 transition-shadow hover:shadow-md ${withdrawn ? "border-dashed" : ""}`}
                >
                  <p className={`inline-flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-wider ${state.text}`}>
                    <span className={`h-2 w-2 rounded-full ${state.dot}`} />
                    {state.label}
                  </p>

                  <h3 className="mt-1.5 text-lg font-bold leading-snug text-ink">
                    {enrolment.ownTitle || project?.title || enrolment.projectSlug}
                  </h3>

                  <p className="mt-0.5 text-sm text-muted">
                    {withdrawn && enrolment.withdrawnAt
                      ? `Withdrawn ${formatLongDate(enrolment.withdrawnAt)}`
                      : enrolment.approvedAt
                        ? `Approved ${formatLongDate(enrolment.approvedAt)} by ${enrolment.approvedByName || "a coach"}`
                        : `Started ${formatLongDate(enrolment.joinedAt)}`}
                  </p>

                  {withdrawn && enrolment.withdrawnReason ? (
                    <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
                      {enrolment.withdrawnReason}
                    </p>
                  ) : null}
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
