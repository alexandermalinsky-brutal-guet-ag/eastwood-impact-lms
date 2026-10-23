import type { Metadata } from "next";
import Link from "next/link";

import { auth } from "@/auth";
import { Card, Empty, SectionHeading, Stat } from "@/components/ui";
import { getProject } from "@/lib/curriculum";
import { COACH_SCORECARD, PHASE_BY_KEY, PHASES, STUDENT_SCORECARD } from "@/lib/handbook";
import { enrolmentDetail, myEnrolments, myProfile } from "@/lib/queries";

export const metadata: Metadata = { title: "Impact Profile" };
export const dynamic = "force-dynamic";

function parse(json: string): Record<string, number> {
  try {
    return JSON.parse(json) as Record<string, number>;
  } catch {
    return {};
  }
}

/**
 * The Impact Profile: a holistic synthesis of a student's experiential journey.
 * Deliberately not a single grade — it aggregates goals, scorecards, reflection
 * and outcomes so that what a student did and how they grew are both visible.
 */
export default async function ProfilePage() {
  const session = await auth();
  const user = session!.user;

  const [profile, enrolments] = await Promise.all([
    myProfile(user.id),
    myEnrolments(user.id),
  ]);
  const phase = PHASES.find((p) => p.key === (profile?.phase ?? "exploration"))!;
  const records = await Promise.all(
    enrolments.map(async (enrolment) => ({
      enrolment,
      project: getProject(enrolment.projectSlug),
      detail: await enrolmentDetail(enrolment.id),
    })),
  );

  const allMilestones = records.flatMap((r) => r.detail.milestones);
  const allReflections = records.flatMap((r) => r.detail.reflections);
  const coachCards = records.flatMap((r) =>
    r.detail.scorecards.filter((s) => s.kind === "coach"),
  );
  const studentCards = records.flatMap((r) =>
    r.detail.scorecards.filter((s) => s.kind === "student"),
  );

  /** Mean rating per dimension across all coach scorecards. */
  function averages(cards: typeof coachCards, keys: readonly { key: string; label: string }[]) {
    return keys.map((dimension) => {
      const scores = cards
        .map((card) => parse(card.ratings)[dimension.key])
        .filter((n): n is number => typeof n === "number");
      return {
        ...dimension,
        average: scores.length
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : null,
        count: scores.length,
      };
    });
  }

  const coachAverages = averages(coachCards, COACH_SCORECARD);
  const studentAverages = averages(studentCards, STUDENT_SCORECARD);
  const hasEvidence = records.length > 0;

  return (
    <>
      <SectionHeading
        eyebrow="Eastwood Passport"
        title="Your Impact Profile"
        description="Not a grade. A synthesis of what you committed to, what you delivered, and how you grew — drawn from your goals, scorecards, reflections and project outcomes."
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

      {!hasEvidence ? (
        <Empty title="Nothing to synthesise yet">
          Your profile fills in as you work.{" "}
          <Link href="/projects" className="font-semibold text-royal-purple underline">
            Join a project
          </Link>{" "}
          to start building it.
        </Empty>
      ) : (
        <>
          <div className="mb-12 grid gap-4 sm:grid-cols-4">
            <Stat value={records.length} label="Projects" />
            <Stat
              value={`${allMilestones.filter((m) => m.done).length}/${allMilestones.length}`}
              label="Milestones done"
              accent="var(--color-royal-purple)"
            />
            <Stat
              value={allReflections.length}
              label="Reflection cycles"
              accent="var(--color-forest-green)"
            />
            <Stat
              value={coachCards.length + studentCards.length}
              label="Scorecards"
              accent="var(--color-mustard)"
            />
          </div>

          {coachCards.length > 0 ? (
            <section className="mb-12">
              <h2 className="mb-1 text-xl font-bold tracking-tight text-ink">
                Coach evaluation
              </h2>
              <p className="mb-5 text-sm text-muted">
                Averaged across {coachCards.length} scorecard
                {coachCards.length === 1 ? "" : "s"}, calibrated in the Coach
                Council.
              </p>
              <Card>
                <dl className="space-y-3">
                  {coachAverages.map((dimension) => (
                    <div key={dimension.key} className="flex items-center gap-4">
                      <dt className="w-56 shrink-0 text-sm text-muted">
                        {dimension.label}
                      </dt>
                      <dd className="flex flex-1 items-center gap-3">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
                          <div
                            className="h-full rounded-full bg-royal-purple"
                            style={{
                              width: `${((dimension.average ?? 0) / 5) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="w-10 text-right text-sm font-bold tabular-nums text-ink">
                          {dimension.average?.toFixed(1) ?? "—"}
                        </span>
                      </dd>
                    </div>
                  ))}
                </dl>
              </Card>
            </section>
          ) : null}

          {studentCards.length > 0 ? (
            <section className="mb-12">
              <h2 className="mb-1 text-xl font-bold tracking-tight text-ink">
                Your own reflection
              </h2>
              <p className="mb-5 text-sm text-muted">
                How you have rated yourself across {studentCards.length} entr
                {studentCards.length === 1 ? "y" : "ies"}. Divergence from the
                coach view above is useful, not a problem.
              </p>
              <Card>
                <dl className="space-y-3">
                  {studentAverages.map((dimension) => (
                    <div key={dimension.key} className="flex items-center gap-4">
                      <dt className="w-56 shrink-0 text-sm text-muted">
                        {dimension.label}
                      </dt>
                      <dd className="flex flex-1 items-center gap-3">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
                          <div
                            className="h-full rounded-full bg-moonrock"
                            style={{
                              width: `${((dimension.average ?? 0) / 5) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="w-10 text-right text-sm font-bold tabular-nums text-ink">
                          {dimension.average?.toFixed(1) ?? "—"}
                        </span>
                      </dd>
                    </div>
                  ))}
                </dl>
              </Card>
            </section>
          ) : null}

          <section>
            <h2 className="mb-5 text-xl font-bold tracking-tight text-ink">
              Portfolio of commitment
            </h2>
            <div className="space-y-4">
              {records.map(({ enrolment, project, detail }) => {
                const phase = PHASE_BY_KEY.get(enrolment.phase)!;
                const withdrawn = enrolment.status === "withdrawn";
                return (
                  <Link
                    key={enrolment.id}
                    href={`/projects/${enrolment.projectSlug}`}
                    className={`card block p-5 transition-shadow hover:shadow-md ${withdrawn ? "border-dashed" : ""}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold leading-snug text-ink">
                          {enrolment.ownTitle || project?.title || enrolment.projectSlug}
                        </h3>
                        <p className="mt-0.5 text-sm text-muted">
                          {withdrawn
                            ? `Withdrawn${
                                enrolment.withdrawnAt
                                  ? ` ${enrolment.withdrawnAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
                                  : ""
                              } · reached ${phase.name}`
                            : `Phase ${phase.number} · ${phase.name} · ${enrolment.status}`}
                        </p>
                        {withdrawn && enrolment.withdrawnReason ? (
                          <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
                            {enrolment.withdrawnReason}
                          </p>
                        ) : null}
                      </div>

                    </div>

                    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted">
                      <span>
                        {detail.milestones.filter((m) => m.done).length}/
                        {detail.milestones.length} milestones
                      </span>
                      <span>{detail.reflections.length} reflection cycles</span>
                      <span>
                        {detail.tasks.filter((t) => t.status === "done").length}/
                        {detail.tasks.length} tasks
                      </span>
                      {enrolment.charterSignedAt ? (
                        <span className="font-semibold text-forest-green">
                          Charter signed
                        </span>
                      ) : null}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </>
      )}
    </>
  );
}
