"use client";

import { useState, useTransition } from "react";

import { answerHelpRequest, askCoach, reviewEvidence, updateIndicator } from "@/lib/actions";
import { buttonClass, Empty } from "@/components/ui";
import { LEVEL_BY_N, MAX_LEVEL, PROPOSAL_FIELDS } from "@/lib/handbook";
import type {
  enrolments as enrolmentsTable, evidence as evidenceTable, helpRequests as helpTable,
} from "@/db/schema";
import { formatDate } from "@/lib/dates";

type Enrolment = typeof enrolmentsTable.$inferSelect;
type Evidence = typeof evidenceTable.$inferSelect;
type Help = typeof helpTable.$inferSelect;

/** Pulls the first number out of a free-text indicator value, e.g. "34 of 60". */
function num(v: string): number | null {
  const m = v.match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}

export function ImpactTracker({ enrolment, canEdit }: { enrolment: Enrolment; canEdit: boolean }) {
  const [pending, start] = useTransition();

  const base = num(enrolment.indicatorBaseline);
  const target = num(enrolment.indicatorTarget);
  const current = num(enrolment.indicatorCurrent) ?? base;
  const pct = base !== null && target !== null && current !== null && target !== base
    ? Math.max(0, Math.min(100, ((current - base) / (target - base)) * 100))
    : null;

  if (!enrolment.indicatorName) {
    return (
      <Empty title="No indicator yet">
        The indicator is the one number that says whether this project worked. Add it in the
        Impact Proposal on the Overview tab — what you measure, where it is today, where you want it.
      </Empty>
    );
  }

  return (
    <section>
      <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-royal-purple">Impact tracker</p>
      <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">{enrolment.indicatorName}</h2>

      <div className="card mt-4 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Today</p>
            <p className="text-3xl font-bold text-royal-purple">
              {enrolment.indicatorCurrent || enrolment.indicatorBaseline || "—"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Target</p>
            <p className="text-3xl font-bold text-forest-green">{enrolment.indicatorTarget || "—"}</p>
          </div>
        </div>

        {pct !== null ? (
          <>
            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-forest-green transition-all" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1.5 text-xs text-muted">
              Started at {enrolment.indicatorBaseline} · {Math.round(pct)}% of the way to target
            </p>
          </>
        ) : null}

        {canEdit ? (
          <form
            action={(fd) => start(() => void updateIndicator(enrolment.id, fd))}
            className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4"
          >
            <label htmlFor="ind" className="sr-only">Update the indicator</label>
            <input
              id="ind" name="indicatorCurrent" maxLength={100}
              defaultValue={enrolment.indicatorCurrent}
              placeholder={`Where it is now (was ${enrolment.indicatorBaseline || "?"})`}
              className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
            />
            <button type="submit" disabled={pending} className={buttonClass("secondary")}>Update</button>
          </form>
        ) : null}
      </div>
    </section>
  );
}

export function EvidenceLog({ evidence, canReview }: { evidence: Evidence[]; canReview: boolean }) {
  const [pending, start] = useTransition();
  const [returning, setReturning] = useState<string | null>(null);

  return (
    <section>
      <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-royal-purple">Evidence log</p>
      <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">What backs the progress</h2>
      <p className="mt-1.5 max-w-2xl text-sm text-muted">
        Progress here is backed by something — a link, a number, a description of what happened.
        One strong piece beats ten weak ones.
      </p>

      {evidence.length === 0 ? (
        <div className="mt-4">
          <Empty title="Nothing submitted yet">
            Evidence is what unlocks the next level. Submit it from the Overview tab —
            for example, “Interviewed 3 Year 7s, notes attached” with a link.
          </Empty>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {evidence.map((e) => {
            const level = LEVEL_BY_N.get(e.level);
            return (
              <li key={e.id} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted">
                      Level {e.level} · {level?.milestone}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-ink">{e.note}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider ${
                      e.status === "validated" ? "bg-forest-green text-white"
                        : e.status === "returned" ? "bg-mustard text-white"
                        : "border border-line text-muted"
                    }`}
                  >
                    {e.status === "submitted" ? "With coach" : e.status}
                  </span>
                </div>

                {e.url ? (
                  <a href={e.url} target="_blank" rel="noreferrer noopener"
                     className="mt-2 inline-block break-all text-sm font-semibold text-royal-purple underline">
                    {e.url}
                  </a>
                ) : null}
                {e.value ? <p className="mt-1 text-sm font-semibold text-ink">Measured: {e.value}</p> : null}

                <p className="mt-2 text-xs text-muted">
                  {formatDate(e.submittedAt)}
                  {e.reviewedByName ? ` · reviewed by ${e.reviewedByName}` : ""}
                </p>
                {e.reviewComment ? (
                  <p className="mt-1.5 border-l-2 border-line pl-3 text-sm text-muted">{e.reviewComment}</p>
                ) : null}

                {canReview && e.status === "submitted" ? (
                  returning === e.id ? (
                    <form
                      action={(fd) => start(async () => { await reviewEvidence(e.id, "returned", fd); setReturning(null); })}
                      className="mt-3 space-y-2 border-t border-line pt-3"
                    >
                      <label htmlFor={`rc-${e.id}`} className="block text-xs font-bold uppercase tracking-wider text-muted">
                        What would make this work?
                      </label>
                      <textarea id={`rc-${e.id}`} name="comment" rows={2} required maxLength={2000}
                        className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink" />
                      <div className="flex gap-2">
                        <button type="submit" disabled={pending} className={buttonClass("secondary")}>Send back</button>
                        <button type="button" onClick={() => setReturning(null)} className={buttonClass("ghost")}>Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <div className="mt-3 flex gap-2 border-t border-line pt-3">
                      <button type="button" disabled={pending}
                        onClick={() => start(() => void reviewEvidence(e.id, "validated"))}
                        className={buttonClass("primary")}>
                        Validate — unlock level {Math.min(e.level + 1, MAX_LEVEL)}
                      </button>
                      <button type="button" onClick={() => setReturning(e.id)} className={buttonClass("secondary")}>
                        Return
                      </button>
                    </div>
                  )
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function AskCoach({
  enrolmentId, requests, canAsk, canAnswer,
}: { enrolmentId: string; requests: Help[]; canAsk: boolean; canAnswer: boolean }) {
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-royal-purple">Stuck?</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">Ask my coach</h2>
        </div>
        {canAsk && !open ? (
          <button type="button" onClick={() => setOpen(true)} className={buttonClass("secondary")}>
            Ask a question
          </button>
        ) : null}
      </div>

      {open ? (
        <form
          action={(fd) => start(async () => { await askCoach(enrolmentId, fd); setOpen(false); })}
          className="card mb-4 space-y-2 p-4"
        >
          <label htmlFor="q" className="block text-xs font-bold uppercase tracking-wider text-muted">
            What do you need?
          </label>
          <textarea id="q" name="question" rows={3} required maxLength={1000}
            placeholder="Be specific — what have you tried, and where are you stuck?"
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink" />
          <div className="flex gap-2">
            <button type="submit" disabled={pending} className={buttonClass("primary")}>Send to my coach</button>
            <button type="button" onClick={() => setOpen(false)} className={buttonClass("ghost")}>Cancel</button>
          </div>
        </form>
      ) : null}

      {requests.length === 0 ? (
        <p className="text-sm text-muted">No questions yet.</p>
      ) : (
        <ul className="space-y-3">
          {requests.map((r) => (
            <li key={r.id} className="card p-4">
              <p className="text-sm leading-relaxed text-ink">{r.question}</p>
              <p className="mt-1 text-xs text-muted">{formatDate(r.createdAt)}</p>
              {r.answer ? (
                <div className="mt-3 rounded-lg bg-paper p-3">
                  <p className="text-sm leading-relaxed text-ink">{r.answer}</p>
                  <p className="mt-1 text-xs text-muted">— {r.answeredByName}</p>
                </div>
              ) : canAnswer ? (
                <form action={(fd) => start(() => void answerHelpRequest(r.id, fd))} className="mt-3 flex flex-wrap gap-2">
                  <label htmlFor={`a-${r.id}`} className="sr-only">Answer</label>
                  <input id={`a-${r.id}`} name="answer" required maxLength={2000} placeholder="Reply…"
                    className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink" />
                  <button type="submit" disabled={pending} className={buttonClass("secondary")}>Reply</button>
                </form>
              ) : (
                <p className="mt-2 text-xs font-semibold text-mustard">Waiting on your coach</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** The Impact Report, assembled from what the project already contains. */
export function ReportDraft({
  enrolment, detail,
}: {
  enrolment: Enrolment;
  detail: { evidence: Evidence[]; reflections: { reflect: string; furtherQuestion: string; cycle: number }[]; milestones: { title: string; done: boolean }[] };
}) {
  const validated = detail.evidence.filter((e) => e.status === "validated");
  const done = detail.milestones.filter((m) => m.done).length;
  const hit = enrolment.indicatorCurrent && enrolment.indicatorTarget
    && num(enrolment.indicatorCurrent) !== null && num(enrolment.indicatorTarget) !== null
    && num(enrolment.indicatorCurrent)! >= num(enrolment.indicatorTarget)!;

  return (
    <section className="space-y-6">
      <div>
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-royal-purple">Impact Report</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">What changed</h2>
        <p className="mt-1.5 max-w-2xl text-sm text-muted">
          Assembled from the project. A missed target with an honest reflection is still a good project.
        </p>
      </div>

      <div className="card p-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted">The problem</h3>
        <p className="mt-1 text-sm leading-relaxed text-ink">{enrolment.problem || "—"}</p>

        <h3 className="mt-4 text-xs font-bold uppercase tracking-wider text-muted">Target against result</h3>
        {enrolment.indicatorName ? (
          <p className="mt-1 text-sm text-ink">
            <span className="font-semibold">{enrolment.indicatorName}</span>: started at{" "}
            {enrolment.indicatorBaseline || "—"}, target {enrolment.indicatorTarget || "—"}, reached{" "}
            <span className={`font-bold ${hit ? "text-forest-green" : "text-mustard"}`}>
              {enrolment.indicatorCurrent || "not yet measured"}
            </span>
          </p>
        ) : <p className="mt-1 text-sm text-muted">No indicator was set.</p>}

        <h3 className="mt-4 text-xs font-bold uppercase tracking-wider text-muted">What was delivered</h3>
        <p className="mt-1 text-sm leading-relaxed text-ink">{enrolment.deliverable || "—"}</p>

        <h3 className="mt-4 text-xs font-bold uppercase tracking-wider text-muted">
          Evidence ({validated.length} validated · {done} of {detail.milestones.length} milestones)
        </h3>
        {validated.length ? (
          <ul className="mt-1.5 space-y-1.5">
            {validated.slice(0, 5).map((e) => (
              <li key={e.id} className="text-sm text-ink">
                <span className="text-muted">Level {e.level}:</span> {e.note}
              </li>
            ))}
          </ul>
        ) : <p className="mt-1 text-sm text-muted">No validated evidence yet.</p>}

        <h3 className="mt-4 text-xs font-bold uppercase tracking-wider text-muted">Final reflection</h3>
        {detail.reflections.length ? (
          <>
            <p className="mt-1 text-sm leading-relaxed text-ink">
              {detail.reflections[detail.reflections.length - 1].reflect || "—"}
            </p>
            {detail.reflections[detail.reflections.length - 1].furtherQuestion ? (
              <p className="mt-2 text-sm italic text-muted">
                Still asking: {detail.reflections[detail.reflections.length - 1].furtherQuestion}
              </p>
            ) : null}
          </>
        ) : <p className="mt-1 text-sm text-muted">No reflection cycles yet.</p>}
      </div>

      <p className="text-xs text-muted">
        PDF export and the public showcase page arrive in Release 3.
      </p>
    </section>
  );
}
