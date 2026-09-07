"use client";

import { useRef, useState, useTransition } from "react";

import { addGoal, deleteGoal, setGoalProgress } from "@/lib/actions";
import { buttonClass } from "@/components/ui";
import { GOAL_KINDS, type GoalKind } from "@/lib/handbook";
import type { goals as goalsTable } from "@/db/schema";

type Goal = typeof goalsTable.$inferSelect;

export function Goals({
  enrolmentId,
  goals,
  editable,
}: {
  enrolmentId: string;
  goals: Goal[];
  editable: boolean;
}) {
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const kindsUsed = new Set(goals.map((g) => g.kind));
  const missing = GOAL_KINDS.filter((k) => !kindsUsed.has(k.key));
  const achieved = goals.filter((g) => g.achieved).length;

  return (
    <section>
      <div className="mb-5">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-royal-purple">
          Stage 2 · agreed with your coach
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">
          SMART goals
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm text-muted">
          Three to five, combining tangible deliverables, process milestones and
          qualitative growth. Goals are recalibrated when circumstances change —
          that preserves ambition rather than penalising it.
        </p>
      </div>

      {/* The handbook requires a balanced set, so say so before approval. */}
      {goals.length > 0 && missing.length > 0 ? (
        <div className="mb-4 rounded-lg border border-mustard/40 bg-mustard/10 p-4 text-sm">
          <p className="font-semibold text-ink">
            This set is not balanced yet
          </p>
          <p className="mt-1 text-muted">
            Still missing {missing.map((m) => m.label.toLowerCase()).join(" and ")}.
          </p>
        </div>
      ) : null}

      {goals.length > 5 ? (
        <p className="mb-4 text-sm text-muted">
          {goals.length} goals — the handbook suggests three to five. More than
          that usually means the project needs re-scoping.
        </p>
      ) : null}

      <div className="card p-5">
        {goals.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted">
            No goals agreed yet. These are set with your coach when the project
            is approved.
          </p>
        ) : (
          <>
            <div className="mb-5 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full bg-royal-purple transition-all"
                  style={{ width: `${(achieved / goals.length) * 100}%` }}
                />
              </div>
              <span className="text-xs font-bold tabular-nums text-muted">
                {achieved}/{goals.length} achieved
              </span>
            </div>

            <ul className="space-y-3">
              {goals.map((goal) => {
                const kind = GOAL_KINDS.find((k) => k.key === goal.kind)!;
                return (
                  <li key={goal.id} className="rounded-lg bg-paper p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[0.68rem] font-bold text-white"
                        style={{ background: kind.colour }}
                      >
                        {kind.label}
                      </span>
                      {editable ? (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => start(() => void deleteGoal(goal.id))}
                          aria-label={`Delete goal "${goal.statement}"`}
                          className="text-xs font-semibold text-muted hover:text-red-700"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>

                    <p className="mt-2 font-semibold leading-snug text-ink">
                      {goal.statement}
                    </p>
                    {goal.measure ? (
                      <p className="mt-1 text-sm text-muted">
                        <span className="font-semibold">Measured by:</span>{" "}
                        {goal.measure}
                      </p>
                    ) : null}
                    {goal.dueBy ? (
                      <p className="mt-0.5 text-sm text-muted">
                        <span className="font-semibold">By:</span> {goal.dueBy}
                      </p>
                    ) : null}

                    <div className="mt-3 flex items-center gap-3">
                      <label
                        htmlFor={`progress-${goal.id}`}
                        className="sr-only"
                      >
                        Progress on {goal.statement}
                      </label>
                      <input
                        id={`progress-${goal.id}`}
                        type="range"
                        min={0}
                        max={100}
                        step={10}
                        defaultValue={goal.progress}
                        disabled={pending}
                        onMouseUp={(e) =>
                          start(() =>
                            void setGoalProgress(
                              goal.id,
                              Number(e.currentTarget.value),
                            ),
                          )
                        }
                        onTouchEnd={(e) =>
                          start(() =>
                            void setGoalProgress(
                              goal.id,
                              Number(e.currentTarget.value),
                            ),
                          )
                        }
                        className="flex-1 accent-[var(--color-royal-purple)]"
                      />
                      <span className="w-12 text-right text-xs font-bold tabular-nums text-muted">
                        {goal.progress}%
                      </span>
                    </div>

                    {goal.recalibrationNote ? (
                      <p className="mt-2 border-l-2 border-mustard pl-3 text-xs text-muted">
                        Recalibrated: {goal.recalibrationNote}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {editable ? (
          <div className="mt-5 border-t border-line pt-4">
            {open ? (
              <form
                ref={formRef}
                action={(formData) => {
                  start(async () => {
                    await addGoal(enrolmentId, formData);
                    formRef.current?.reset();
                    setOpen(false);
                  });
                }}
                className="space-y-3"
              >
                <div>
                  <label
                    htmlFor="goal-kind"
                    className="block text-xs font-bold uppercase tracking-wider text-muted"
                  >
                    Type
                  </label>
                  <select
                    id="goal-kind"
                    name="kind"
                    defaultValue={(missing[0]?.key ?? "deliverable") as GoalKind}
                    className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
                  >
                    {GOAL_KINDS.map((k) => (
                      <option key={k.key} value={k.key}>
                        {k.label} — {k.hint}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="goal-statement"
                    className="block text-xs font-bold uppercase tracking-wider text-muted"
                  >
                    Goal
                  </label>
                  <input
                    id="goal-statement"
                    name="statement"
                    required
                    maxLength={300}
                    placeholder="Specific, achievable, relevant…"
                    className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="goal-measure"
                      className="block text-xs font-bold uppercase tracking-wider text-muted"
                    >
                      Measured by
                    </label>
                    <input
                      id="goal-measure"
                      name="measure"
                      maxLength={300}
                      placeholder="How you will know it is met"
                      className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="goal-due"
                      className="block text-xs font-bold uppercase tracking-wider text-muted"
                    >
                      Time-bound
                    </label>
                    <input
                      id="goal-due"
                      name="dueBy"
                      maxLength={100}
                      placeholder="End of term 2"
                      className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button type="submit" disabled={pending} className={buttonClass("primary")}>
                    Add goal
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className={buttonClass("ghost")}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setOpen(true)}
                className={buttonClass("secondary")}
              >
                Add a goal
              </button>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
