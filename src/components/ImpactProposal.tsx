"use client";

import { useState, useTransition } from "react";

import { approveProposal, returnProposal, saveImpactProposal, submitProposal } from "@/lib/actions";
import { buttonClass } from "@/components/ui";
import { INDICATOR_FIELDS, PROPOSAL_FIELDS } from "@/lib/handbook";
import type { enrolments as enrolmentsTable } from "@/db/schema";

type Enrolment = typeof enrolmentsTable.$inferSelect;

/**
 * The Impact Proposal. Every field shows a strong and a weak example, because
 * students write better when they can see what good looks like.
 */
export function ImpactProposal({
  enrolment,
  canEdit,
  canReview,
}: {
  enrolment: Enrolment;
  canEdit: boolean;
  canReview: boolean;
}) {
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(!enrolment.problem && canEdit);
  const [showExamples, setShowExamples] = useState<string | null>(null);
  const [returning, setReturning] = useState(false);

  const submitted = Boolean(enrolment.proposalSubmittedAt);
  const approved = Boolean(enrolment.approvedAt);

  return (
    <section className="space-y-5">
      {enrolment.returnedComment ? (
        <div className="rounded-[14px] border border-mustard/50 bg-mustard/10 p-5">
          <p className="font-bold text-ink">Your coach sent this back</p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink">{enrolment.returnedComment}</p>
          <p className="mt-2 text-xs text-muted">Revise it below and submit again.</p>
        </div>
      ) : null}

      {editing ? (
        <form
          action={(fd) => start(async () => { await saveImpactProposal(enrolment.id, fd); setEditing(false); })}
          className="card space-y-5 p-5"
        >
          {PROPOSAL_FIELDS.map((f) => (
            <div key={f.key}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <label htmlFor={f.key} className="text-sm font-bold text-ink">{f.label}</label>
                <button
                  type="button"
                  onClick={() => setShowExamples(showExamples === f.key ? null : f.key)}
                  className="text-xs font-semibold text-royal-purple underline"
                >
                  {showExamples === f.key ? "Hide examples" : "Show an example"}
                </button>
              </div>
              <p className="mb-1.5 mt-0.5 text-xs text-muted">{f.hint}</p>

              {showExamples === f.key ? (
                <div className="mb-2 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg bg-forest-green/10 p-3">
                    <p className="text-[0.62rem] font-bold uppercase tracking-wider text-forest-green">Strong</p>
                    <p className="mt-1 text-sm leading-snug text-ink">{f.good}</p>
                  </div>
                  <div className="rounded-lg bg-paper p-3">
                    <p className="text-[0.62rem] font-bold uppercase tracking-wider text-muted">Too vague</p>
                    <p className="mt-1 text-sm leading-snug text-muted">{f.weak}</p>
                  </div>
                </div>
              ) : null}

              <textarea
                id={f.key} name={f.key} rows={2} maxLength={f.limit}
                defaultValue={enrolment[f.key]}
                className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm leading-relaxed text-ink"
              />
            </div>
          ))}

          <fieldset className="rounded-lg bg-paper p-4">
            <legend className="px-1 text-sm font-bold text-ink">How we will measure it</legend>
            <p className="mb-3 text-xs text-muted">
              One indicator, a value today, and where you want it. This is what makes the project
              about impact rather than activity.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {(["name", "baseline", "target"] as const).map((k) => {
                const field = INDICATOR_FIELDS[k];
                const name = k === "name" ? "indicatorName" : k === "baseline" ? "indicatorBaseline" : "indicatorTarget";
                return (
                  <div key={k}>
                    <label htmlFor={name} className="block text-xs font-bold text-ink">{field.label}</label>
                    <input
                      id={name} name={name} maxLength={200} defaultValue={enrolment[name]}
                      placeholder={field.good}
                      className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted/50"
                    />
                  </div>
                );
              })}
            </div>
          </fieldset>

          <div className="flex gap-2">
            <button type="submit" disabled={pending} className={buttonClass("primary")}>
              {pending ? "Saving…" : "Save proposal"}
            </button>
            {enrolment.problem ? (
              <button type="button" onClick={() => setEditing(false)} className={buttonClass("ghost")}>Cancel</button>
            ) : null}
          </div>
        </form>
      ) : (
        <div className="card space-y-4 p-5">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-lg font-bold text-ink">Impact Proposal</h2>
            {canEdit && !approved ? (
              <button type="button" onClick={() => setEditing(true)} className={buttonClass("secondary")}>Edit</button>
            ) : null}
          </div>

          {PROPOSAL_FIELDS.map((f) => (
            <div key={f.key}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">{f.label}</h3>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink">
                {enrolment[f.key] || <span className="text-muted">Not written yet</span>}
              </p>
            </div>
          ))}

          <div className="rounded-lg bg-paper p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">The measure</h3>
            {enrolment.indicatorName ? (
              <p className="mt-1.5 text-sm text-ink">
                <span className="font-semibold">{enrolment.indicatorName}</span>
                {" — from "}<span className="font-semibold">{enrolment.indicatorBaseline || "?"}</span>
                {" to "}<span className="font-semibold text-forest-green">{enrolment.indicatorTarget || "?"}</span>
              </p>
            ) : (
              <p className="mt-1.5 text-sm text-muted">No indicator set yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Submission and the approval gate */}
      {!approved ? (
        <div className="card p-5">
          {submitted ? (
            <>
              <p className="font-bold text-ink">With your coach for approval</p>
              <p className="mt-1 text-sm text-muted">
                Sent {enrolment.proposalSubmittedAt!.toLocaleDateString("en-GB")}.
              </p>
            </>
          ) : (
            <>
              <p className="font-bold text-ink">Ready to send?</p>
              <p className="mt-1 text-sm text-muted">
                A coach reads it and either approves it or sends it back with comments.
                You need at least the problem and a target.
              </p>
              {canEdit ? (
                <button
                  type="button" disabled={pending}
                  onClick={() => start(() => void submitProposal(enrolment.id))}
                  className={`${buttonClass("primary")} mt-3`}
                >
                  Submit for approval
                </button>
              ) : null}
            </>
          )}

          {canReview && submitted ? (
            <div className="mt-4 border-t border-line pt-4">
              {returning ? (
                <form
                  action={(fd) => start(async () => { await returnProposal(enrolment.id, fd); setReturning(false); })}
                  className="space-y-2"
                >
                  <label htmlFor="return-comment" className="block text-sm font-bold text-ink">
                    What needs more work?
                  </label>
                  <textarea
                    id="return-comment" name="comment" rows={3} required maxLength={2000}
                    className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
                  />
                  <div className="flex gap-2">
                    <button type="submit" disabled={pending} className={buttonClass("secondary")}>Send back</button>
                    <button type="button" onClick={() => setReturning(false)} className={buttonClass("ghost")}>Cancel</button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button" disabled={pending}
                    onClick={() => start(() => void approveProposal(enrolment.id))}
                    className={buttonClass("primary")}
                  >
                    Approve
                  </button>
                  <button type="button" onClick={() => setReturning(true)} className={buttonClass("secondary")}>
                    Return with comments
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-[14px] border border-forest-green/40 bg-forest-green/10 p-5">
          <p className="font-bold text-ink">Approved</p>
          <p className="mt-1 text-sm text-muted">
            by {enrolment.approvedByName || "a coach"} on{" "}
            {enrolment.approvedAt!.toLocaleDateString("en-GB")}
          </p>
        </div>
      )}
    </section>
  );
}
