"use client";

import { useState, useTransition } from "react";

import { saveScorecard } from "@/lib/actions";
import { buttonClass } from "@/components/ui";
import { COACH_SCORECARD, STUDENT_SCORECARD } from "@/lib/handbook";
import type { scorecards as scorecardsTable } from "@/db/schema";

type Scorecard = typeof scorecardsTable.$inferSelect;

function parse(json: string): Record<string, string | number> {
  try {
    return JSON.parse(json) as Record<string, string | number>;
  } catch {
    return {};
  }
}

const SCALE = [1, 2, 3, 4, 5];

/**
 * Student scorecards are reflective tools reviewed by a coach — explicitly not
 * self-grading. Coach scorecards are completed twice monthly and calibrated in
 * the Coach Council. Same shape, different author and audience.
 */
export function Scorecards({
  enrolmentId,
  scorecards,
  kind,
  canWrite,
}: {
  enrolmentId: string;
  scorecards: Scorecard[];
  kind: "student" | "coach";
  canWrite: boolean;
}) {
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);

  const dimensions = kind === "student" ? STUDENT_SCORECARD : COACH_SCORECARD;
  const mine = scorecards.filter((s) => s.kind === kind);

  const heading =
    kind === "student" ? "Student IMPACT Scorecard" : "Coach Scorecard";
  const blurb =
    kind === "student"
      ? "A reflective tool your coach reads, not a self-grade. Completed bi-monthly — the written notes matter more than the numbers."
      : "Completed twice monthly and calibrated in the Coach Council, which reduces individual bias and keeps standards consistent across projects.";

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-royal-purple">
            {kind === "student" ? "Self-reflection" : "Coach evaluation"}
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">
            {heading}
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm text-muted">{blurb}</p>
        </div>
        {canWrite && !open ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={buttonClass("secondary")}
          >
            New entry
          </button>
        ) : null}
      </div>

      {open ? (
        <form
          action={(formData) => {
            start(async () => {
              await saveScorecard(enrolmentId, kind, formData);
              setOpen(false);
            });
          }}
          className="card mb-5 space-y-5 p-5"
        >
          <div>
            <label
              htmlFor="period"
              className="block text-xs font-bold uppercase tracking-wider text-muted"
            >
              Period
            </label>
            <input
              id="period"
              name="periodLabel"
              maxLength={60}
              placeholder="e.g. January, first half"
              className="mt-1.5 w-full max-w-xs rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
            />
          </div>

          {dimensions.map((dimension) => (
            <fieldset key={dimension.key} className="border-t border-line pt-4">
              <legend className="text-sm font-bold text-ink">
                {dimension.label}
              </legend>
              {"hint" in dimension ? (
                <p className="mb-2 mt-0.5 text-xs text-muted">{dimension.hint}</p>
              ) : null}

              <div className="mb-2.5 flex flex-wrap gap-1.5">
                {SCALE.map((value) => (
                  <label
                    key={value}
                    className="cursor-pointer rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-muted has-[:checked]:border-transparent has-[:checked]:bg-royal-purple has-[:checked]:text-white"
                  >
                    <input
                      type="radio"
                      name={`rating.${dimension.key}`}
                      value={value}
                      defaultChecked={value === 3}
                      className="sr-only"
                    />
                    {value}
                  </label>
                ))}
              </div>

              <label htmlFor={`note-${dimension.key}`} className="sr-only">
                Notes on {dimension.label}
              </label>
              <textarea
                id={`note-${dimension.key}`}
                name={`note.${dimension.key}`}
                rows={2}
                maxLength={2000}
                placeholder="What actually happened?"
                className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
              />
            </fieldset>
          ))}

          <div>
            <label
              htmlFor="comment"
              className="block text-sm font-bold text-ink"
            >
              Overall
            </label>
            <textarea
              id="comment"
              name="comment"
              rows={3}
              maxLength={4000}
              className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
            />
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={pending} className={buttonClass("primary")}>
              {pending ? "Saving…" : "Save scorecard"}
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
      ) : null}

      {mine.length === 0 ? (
        <div className="card border-dashed p-6 text-center text-sm text-muted">
          No entries yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {mine.map((card) => {
            const ratings = parse(card.ratings);
            const notes = parse(card.notes);
            return (
              <li key={card.id} className="card p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-bold text-ink">
                    {card.periodLabel || card.createdAt.toLocaleDateString("en-GB")}
                  </p>
                  <p className="text-xs text-muted">
                    {card.createdAt.toLocaleDateString("en-GB")}
                  </p>
                </div>

                <dl className="mt-3 space-y-2.5">
                  {dimensions.map((dimension) => {
                    const score = Number(ratings[dimension.key] ?? 0);
                    const note = String(notes[dimension.key] ?? "");
                    return (
                      <div key={dimension.key}>
                        <div className="flex items-center gap-3">
                          <dt className="w-52 shrink-0 text-sm text-muted">
                            {dimension.label}
                          </dt>
                          <dd className="flex gap-1" aria-label={`${score} out of 5`}>
                            {SCALE.map((v) => (
                              <span
                                key={v}
                                className={`h-2 w-6 rounded-full ${
                                  v <= score ? "bg-royal-purple" : "bg-line"
                                }`}
                              />
                            ))}
                          </dd>
                        </div>
                        {note ? (
                          <p className="ml-0 mt-1 text-sm leading-relaxed text-ink sm:ml-52">
                            {note}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </dl>

                {card.comment ? (
                  <p className="mt-4 rounded-lg bg-paper p-3 text-sm leading-relaxed text-ink">
                    {card.comment}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
