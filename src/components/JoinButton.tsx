"use client";

import { useState, useTransition } from "react";

import { joinProject, leaveProject, markComplete, rejoinProject } from "@/lib/actions";
import { Button, buttonClass } from "@/components/ui";
import { MAX_LEVEL, type PhaseKey } from "@/lib/handbook";

export function JoinButton({
  projectSlug,
  enrolmentId,
  status,
  phase,
  level,
  charterSigned,
  withdrawnReason,
}: {
  projectSlug: string;
  enrolmentId: string | null;
  status: "active" | "complete" | "withdrawn" | null;
  phase: PhaseKey;
  level: number;
  charterSigned: boolean;
  withdrawnReason: string;
}) {
  const [pending, start] = useTransition();
  const [leaving, setLeaving] = useState(false);

  if (!enrolmentId) {
    return (
      <Button disabled={pending} onClick={() => start(() => void joinProject(projectSlug))} className="px-6 py-2.5">
        {pending ? "Starting…" : "Start this project"}
      </Button>
    );
  }

  if (status === "withdrawn") {
    return (
      <div className="max-w-xs rounded-[14px] border border-line bg-surface p-4">
        <p className="font-bold text-ink">Withdrawn</p>
        {withdrawnReason ? (
          <p className="mt-1 text-sm leading-relaxed text-muted">{withdrawnReason}</p>
        ) : null}
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() => start(() => void rejoinProject(enrolmentId))}
          className="mt-3 w-full"
        >
          Pick it back up
        </Button>
      </div>
    );
  }

  // Completing needs the final level validated, which only a coach can do.
  const canComplete = phase === "report" && level >= MAX_LEVEL;

  if (leaving) {
    return (
      <div className="w-full max-w-sm rounded-[14px] border border-mustard/50 bg-mustard/5 p-5">
        {charterSigned ? (
          <>
            <h3 className="font-bold text-ink">Withdraw from this project?</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              You signed the charter, so this is a withdrawal rather than a deletion. The project
              leaves your dashboard; your proposal, evidence and reflections stay on your profile
              and your coach is told why.
            </p>
            <p className="mt-2.5 text-sm leading-relaxed text-ink">
              Before you do — most projects that feel impossible need re-scoping, not abandoning.
              Ask your coach on the Work tab first.
            </p>

            <form
              action={(formData) => start(() => void leaveProject(enrolmentId, formData))}
              className="mt-4 space-y-2"
            >
              <label htmlFor="withdraw-reason" className="block text-xs font-bold uppercase tracking-wider text-muted">
                What happened?
              </label>
              <textarea
                id="withdraw-reason"
                name="reason"
                rows={3}
                required
                minLength={10}
                maxLength={2000}
                placeholder="Be honest — this is the record, not a form to get past."
                className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
              />
              <div className="flex flex-wrap gap-2">
                <button type="submit" disabled={pending} className={buttonClass("danger")}>
                  {pending ? "Withdrawing…" : "Withdraw"}
                </button>
                <button type="button" onClick={() => setLeaving(false)} className={buttonClass("ghost")}>
                  Keep going
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h3 className="font-bold text-ink">Remove this project?</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              You have not signed the charter yet, so this is still a draft. Removing it deletes
              the proposal and anything on the board. Nothing is kept.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => start(() => void leaveProject(enrolmentId))}
                className={buttonClass("danger")}
              >
                {pending ? "Removing…" : "Remove it"}
              </button>
              <button type="button" onClick={() => setLeaving(false)} className={buttonClass("ghost")}>
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-stretch gap-2">
      {status === "complete" ? (
        <span className="rounded-lg bg-forest-green px-4 py-2 text-center text-sm font-bold text-white">
          Completed
        </span>
      ) : canComplete ? (
        <Button disabled={pending} onClick={() => start(() => void markComplete(enrolmentId))} className="px-6 py-2.5">
          Mark complete
        </Button>
      ) : (
        <span className="rounded-lg border border-line px-4 py-2 text-center text-xs text-muted">
          Completes at level {MAX_LEVEL}, after the final showcase
        </span>
      )}

      {status === "complete" ? null : (
        <Button variant="danger" onClick={() => setLeaving(true)}>
          {charterSigned ? "Withdraw from project" : "Remove project"}
        </Button>
      )}
    </div>
  );
}
