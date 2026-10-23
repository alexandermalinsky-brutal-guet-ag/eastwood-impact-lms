"use client";

import { useState, useTransition } from "react";

import { submitEvidence } from "@/lib/actions";
import { buttonClass } from "@/components/ui";
import { LEVELS, MAX_LEVEL } from "@/lib/handbook";
import type { evidence as evidenceTable } from "@/db/schema";
import { formatDate } from "@/lib/dates";

type Evidence = typeof evidenceTable.$inferSelect;

/**
 * The level map. A level unlocks only when a coach validates the evidence for
 * it — evidence unlocks, never activity. Returned evidence is not a failure:
 * the student revises and resubmits.
 */
export function LevelMap({
  enrolmentId,
  level,
  evidence,
  canSubmit,
}: {
  enrolmentId: string;
  level: number;
  evidence: Evidence[];
  canSubmit: boolean;
}) {
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);

  const latestFor = (n: number) => evidence.find((e) => e.level === n);
  const current = LEVELS.find((l) => l.n === level) ?? LEVELS[0];
  const waiting = latestFor(level)?.status === "submitted";
  const returned = latestFor(level)?.status === "returned";

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-royal-purple">
            Level {level} of {MAX_LEVEL}
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">
            {current.milestone}
          </h2>
        </div>
        <div className="flex items-center gap-1.5" aria-label={`Level ${level} of ${MAX_LEVEL}`}>
          {LEVELS.map((l) => (
            <span
              key={l.n}
              title={`${l.n}. ${l.milestone}`}
              className={`h-2 rounded-full transition-all ${
                l.n < level ? "w-7 bg-forest-green"
                  : l.n === level ? "w-10 bg-royal-purple"
                  : "w-7 bg-line"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="card p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">
          Evidence that unlocks the next level
        </p>
        <p className="mt-1.5 text-base leading-relaxed text-ink">{current.evidence}</p>

        {returned ? (
          <div className="mt-4 rounded-lg border border-mustard/50 bg-mustard/10 p-4">
            <p className="text-sm font-bold text-ink">Returned for another go</p>
            <p className="mt-1 text-sm text-muted">
              {latestFor(level)?.reviewComment || "Your coach asked for a revision."}
              {latestFor(level)?.reviewedByName ? ` — ${latestFor(level)!.reviewedByName}` : ""}
            </p>
            <p className="mt-1.5 text-xs text-muted">
              A return is not a failure. Revise it and send it again.
            </p>
          </div>
        ) : null}

        {waiting ? (
          <div className="mt-4 rounded-lg bg-paper p-4">
            <p className="text-sm font-semibold text-ink">With your coach</p>
            <p className="mt-1 text-sm text-muted">
              Submitted {formatDate(latestFor(level)!.submittedAt)}. You will see
              their answer here.
            </p>
          </div>
        ) : null}

        {canSubmit && !waiting && level <= MAX_LEVEL ? (
          open ? (
            <form
              action={(fd) => start(async () => { await submitEvidence(enrolmentId, fd); setOpen(false); })}
              className="mt-4 space-y-3 border-t border-line pt-4"
            >
              <input type="hidden" name="level" value={level} />
              <div>
                <label htmlFor="ev-note" className="block text-xs font-bold uppercase tracking-wider text-muted">
                  What is the evidence?
                </label>
                <textarea
                  id="ev-note" name="note" rows={3} required maxLength={2000}
                  placeholder="What you did, and what it shows."
                  className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="ev-url" className="block text-xs font-bold uppercase tracking-wider text-muted">
                    Link (optional)
                  </label>
                  <input
                    id="ev-url" name="url" maxLength={500} placeholder="A photo, document or page"
                    className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
                  />
                </div>
                <div>
                  <label htmlFor="ev-value" className="block text-xs font-bold uppercase tracking-wider text-muted">
                    A number (optional)
                  </label>
                  <input
                    id="ev-value" name="value" maxLength={100} placeholder="e.g. 34 of 60"
                    className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={pending} className={buttonClass("primary")}>
                  {pending ? "Sending…" : "Submit for validation"}
                </button>
                <button type="button" onClick={() => setOpen(false)} className={buttonClass("ghost")}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button type="button" onClick={() => setOpen(true)} className={`${buttonClass("primary")} mt-4`}>
              Submit evidence for level {level}
            </button>
          )
        ) : null}
      </div>

      <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {LEVELS.map((l) => {
          const done = l.n < level;
          const now = l.n === level;
          return (
            <li
              key={l.n}
              className={`rounded-lg border p-3 ${
                now ? "border-transparent bg-deep-blue text-white"
                  : done ? "border-transparent bg-forest-green/10"
                  : "border-line bg-surface"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[0.62rem] font-bold uppercase tracking-wider ${now ? "text-light-purple" : "text-muted"}`}>
                  Level {l.n}
                </span>
                {done ? <span className="text-xs font-bold text-forest-green">✓</span> : null}
                {!done && !now ? <span className="text-xs text-muted">🔒</span> : null}
              </div>
              <p className={`mt-1 text-sm font-semibold leading-snug ${now ? "text-white" : done ? "text-ink" : "text-muted"}`}>
                {l.milestone}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
