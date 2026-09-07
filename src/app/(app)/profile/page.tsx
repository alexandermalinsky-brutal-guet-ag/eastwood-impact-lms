import type { Metadata } from "next";
import Link from "next/link";

import { auth } from "@/auth";
import { Card, Empty, SectionHeading, Stat, StrandChip } from "@/components/ui";
import { STRANDS, strandsOf } from "@/lib/brand";
import { getProject } from "@/lib/curriculum";
import { COACH_SCORECARD, STAGES, STUDENT_SCORECARD } from "@/lib/handbook";
import { enrolmentDetail, myEnrolments } from "@/lib/queries";

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

  const enrolments = await myEnrolments(user.id);
  const records = await Promise.all(
    enrolments.map(async (enrolment) => ({
      enrolment,
      project: getProject(enrolment.projectSlug),
      detail: await enrolmentDetail(enrolment.id),
    })),
  );

  const allGoals = records.flatMap((r) => r.detail.goals);
  const allReflections = records.flatMap((r) => r.detail.reflections);
  const coachCards = records.flatMap((r) =>
    r.detail.scorecards.filter((s) => s.kind === "coach"),
  );
  const studentCards = records.flatMap((r) =>
    r.detail.scorecards.filter((s) => s.kind === "student"),
  );

  // Strand coverage across every project this student has taken on.
  const strandCounts = new Map<string, number>();
  for (const record of records) {
    const names = record.enrolment.targetStrands.length
      ? record.enrolment.targetStrands
      : (record.project?.strands ?? []);
    for (const name of names) {
      strandCounts.set(name, (strandCounts.get(name) ?? 0) + 1);
    }
  }

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
              value={`${allGoals.filter((g) => g.achieved).length}/${allGoals.length}`}
              label="Goals achieved"
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

          <section className="mb-12">
            <h2 className="mb-1 text-xl font-bold tracking-tight text-ink">
              Strand coverage
            </h2>
            <p className="mb-5 max-w-2xl text-sm text-muted">
              Breadth matters. The programme is designed to prevent narrow
              specialisation — gaps here are worth a conversation with your
              coach.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {STRANDS.map((strand) => {
                const count = strandCounts.get(strand.name) ?? 0;
                return (
                  <div
                    key={strand.slug}
                    className={`rounded-[14px] p-4 ${count === 0 ? "border border-dashed border-line bg-surface" : ""}`}
                    style={
                      count > 0
                        ? { background: strand.colour, color: strand.ink }
                        : undefined
                    }
                  >
                    <div className="flex items-baseline justify-between">
                      <p
                        className={`font-bold ${count === 0 ? "text-muted" : ""}`}
                      >
                        {strand.name}
                      </p>
                      <span
                        className={`text-2xl font-bold tabular-nums ${
                          count === 0 ? "text-line" : "opacity-50"
                        }`}
                      >
                        {count}
                      </span>
                    </div>
                    <p
                      className={`mt-0.5 text-xs font-medium ${
                        count === 0 ? "text-muted" : "opacity-80"
                      }`}
                    >
                      {count === 0 ? "Not yet engaged" : strand.definition}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

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
                const stage = STAGES.find((s) => s.key === enrolment.stage)!;
                const strands = strandsOf(
                  enrolment.targetStrands.length
                    ? enrolment.targetStrands
                    : (project?.strands ?? []),
                );
                return (
                  <Link
                    key={enrolment.id}
                    href={`/projects/${enrolment.projectSlug}`}
                    className="card block p-5 transition-shadow hover:shadow-md"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold leading-snug text-ink">
                          {project?.title ?? enrolment.projectSlug}
                        </h3>
                        <p className="mt-0.5 text-sm text-muted">
                          Stage {stage.number} · {stage.shortName} ·{" "}
                          {enrolment.status}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {strands.map((s) => (
                          <StrandChip key={s.slug} strand={s} />
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted">
                      <span>
                        {detail.goals.filter((g) => g.achieved).length}/
                        {detail.goals.length} goals
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
