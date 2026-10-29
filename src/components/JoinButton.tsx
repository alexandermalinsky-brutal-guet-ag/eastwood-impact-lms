"use client";

import { useState, useTransition } from "react";

import { joinProject, leaveProject, rejoinProject } from "@/lib/actions";
import { Button, buttonClass } from "@/components/ui";

/**
 * Getting on and off a project. Approval is the line: before it, the project
 * is a draft the student can simply drop; after it, a coach has spent time on
 * it, so leaving is a withdrawal and the reason is kept.
 */
export function JoinButton({
  projectSlug,
  enrolmentId,
  status,
  approved,
  withdrawnReason,
}: {
  projectSlug: string;
  enrolmentId: string | null;
  status: "active" | "withdrawn" | null;
  approved: boolean;
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

  if (leaving) {
    return (
      <div className="w-full max-w-sm rounded-[14px] border border-mustard/50 bg-mustard/5 p-5">
        {approved ? (
          <>
            <h3 className="font-bold text-ink">Withdraw from this project?</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              A coach approved this, so it is a withdrawal rather than a deletion. The project
              leaves your dashboard; the proposal stays on your profile and your coach is told why.
            </p>
            <p className="mt-2.5 text-sm leading-relaxed text-ink">
              Before you do — most projects that feel impossible need re-scoping, not abandoning.
              Talk to your coach first.
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
              No coach has approved it yet, so this is still a draft. Removing it deletes the
              proposal. Nothing is kept.
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
    <Button variant="danger" onClick={() => setLeaving(true)}>
      {approved ? "Withdraw from project" : "Remove project"}
    </Button>
  );
}
