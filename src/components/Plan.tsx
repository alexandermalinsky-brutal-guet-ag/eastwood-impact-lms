"use client";

import { useRef, useTransition } from "react";

import { addMilestone, deleteMilestone, signCharterNamed, toggleMilestone, validatePlan } from "@/lib/actions";
import { buttonClass } from "@/components/ui";
import type { criteria as criteriaTable, enrolments as enrolmentsTable, milestones as milestonesTable } from "@/db/schema";

type Milestone = typeof milestonesTable.$inferSelect;
type Criterion = typeof criteriaTable.$inferSelect;
type Enrolment = typeof enrolmentsTable.$inferSelect;

/**
 * Plan: the definition of done and dated milestones. Together these replaced
 * the old SMART goals and the separate success-criteria list — one plan, not
 * two overlapping trackers.
 */
export function Plan({
  enrolment,
  milestones,
  criteria,
  canEdit,
  canReview,
  CriteriaBlock,
}: {
  enrolment: Enrolment;
  milestones: Milestone[];
  criteria: Criterion[];
  canEdit: boolean;
  canReview: boolean;
  CriteriaBlock: React.ReactNode;
}) {
  const [pending, start] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const done = milestones.filter((m) => m.done).length;
  const validated = Boolean(enrolment.planValidatedAt);
  const signed = Boolean(enrolment.charterSignedAt);

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-4">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-royal-purple">
            Definition of done
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">What finished looks like</h2>
          <p className="mt-1.5 max-w-2xl text-sm text-muted">
            Three to five criteria, each one you could actually check. Agreed with your coach before you start.
          </p>
        </div>
        {CriteriaBlock}
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-royal-purple">Milestones</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">
              The dated plan
              <span className="ml-2 text-base font-semibold text-muted">{done}/{milestones.length}</span>
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm text-muted">
              Three to six dated steps, ending with the showcase. Each one you add also lands on your board,
              so you never start from an empty Kanban.
            </p>
          </div>
        </div>

        {milestones.length === 0 ? (
          <div className="card border-dashed p-6">
            <p className="font-semibold text-ink">No milestones yet</p>
            <p className="mt-1 max-w-xl text-sm text-muted">
              Break the project into three to six dated steps. For a six-week cycle that is roughly one a week —
              for example “Interview 3 people affected” by 14 November, then “First prototype tested” by 28 November.
            </p>
          </div>
        ) : (
          <ol className="space-y-2">
            {milestones.map((m, i) => {
              const overdue = !m.done && m.dueDate && Date.parse(m.dueDate) < Date.now();
              return (
                <li key={m.id} className="card flex items-start gap-3 p-4">
                  <input
                    type="checkbox" checked={m.done} disabled={pending || !canEdit}
                    onChange={(e) => start(() => void toggleMilestone(m.id, e.target.checked))}
                    aria-label={`Mark "${m.title}" done`}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-forest-green)]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold leading-snug ${m.done ? "text-muted line-through" : "text-ink"}`}>
                      <span className="mr-2 text-muted">{i + 1}.</span>{m.title}
                    </p>
                    {m.dueDate ? (
                      <p className={`mt-0.5 text-xs ${overdue ? "font-bold text-mustard" : "text-muted"}`}>
                        {overdue ? "Overdue — " : "Due "}
                        {new Date(m.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </p>
                    ) : null}
                  </div>
                  {canEdit ? (
                    <button
                      type="button" disabled={pending}
                      onClick={() => start(() => void deleteMilestone(m.id))}
                      aria-label={`Remove "${m.title}"`}
                      className="text-xs font-semibold text-muted hover:text-red-700"
                    >
                      Remove
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ol>
        )}

        {canEdit ? (
          <form
            ref={formRef}
            action={(fd) => start(async () => { await addMilestone(enrolment.id, fd); formRef.current?.reset(); })}
            className="mt-3 flex flex-wrap gap-2"
          >
            <label htmlFor="ms-title" className="sr-only">Milestone</label>
            <input
              id="ms-title" name="title" required maxLength={200} placeholder="What has to be done…"
              className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
            />
            <label htmlFor="ms-due" className="sr-only">Due date</label>
            <input
              id="ms-due" name="dueDate" type="date"
              className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
            />
            <button type="submit" disabled={pending} className={buttonClass("secondary")}>Add</button>
          </form>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className={`rounded-[14px] border p-5 ${signed ? "border-transparent bg-forest-green/10" : "border-line bg-surface"}`}>
          <h3 className="font-bold text-ink">Commitment Charter</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            {signed
              ? `Signed by ${enrolment.charterSignedByName || "the student"} on ${enrolment.charterSignedAt!.toLocaleDateString("en-GB")}.`
              : "By signing, you agree to see this through unless a coach-led review decides to change direction."}
          </p>
          {!signed && canEdit ? (
            <button
              type="button" disabled={pending || !enrolment.approvedAt}
              onClick={() => start(() => void signCharterNamed(enrolment.id))}
              className={`${buttonClass("primary")} mt-3`}
            >
              {enrolment.approvedAt ? "Sign the charter" : "Awaiting approval"}
            </button>
          ) : null}
        </div>

        <div className={`rounded-[14px] border p-5 ${validated ? "border-transparent bg-forest-green/10" : "border-line bg-surface"}`}>
          <h3 className="font-bold text-ink">Plan validated</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            {validated
              ? `Validated by ${enrolment.planValidatedByName} on ${enrolment.planValidatedAt!.toLocaleDateString("en-GB")}.`
              : "A coach checks the plan before Execute starts. Needs at least three dated milestones."}
          </p>
          {canReview && !validated ? (
            <button
              type="button" disabled={pending}
              onClick={() => start(() => void validatePlan(enrolment.id))}
              className={`${buttonClass("primary")} mt-3`}
            >
              Validate the plan
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
