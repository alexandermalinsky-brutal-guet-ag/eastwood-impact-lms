"use client";

import { useTransition } from "react";

import { setStage } from "@/lib/actions";
import { buttonClass } from "@/components/ui";
import { STAGES, STAGE_ORDER, type StageKey } from "@/lib/handbook";

/**
 * Moving between stages. A student advances one step at a time and cannot walk
 * themselves through the Stage 2 approval gate; staff can move a project
 * anywhere, including back, when a coach-led review decides to re-scope.
 */
export function StageAdvance({
  enrolmentId,
  stage,
  isStaff,
  approved,
  charterSigned,
}: {
  enrolmentId: string;
  stage: StageKey;
  isStaff: boolean;
  approved: boolean;
  charterSigned: boolean;
}) {
  const [pending, start] = useTransition();
  const index = STAGE_ORDER.indexOf(stage);
  const next = STAGES[index + 1];

  if (isStaff) {
    return (
      <div className="flex items-center gap-2">
        <label htmlFor="stage" className="text-xs font-semibold text-muted">
          Move to
        </label>
        <select
          id="stage"
          value={stage}
          disabled={pending}
          onChange={(event) =>
            start(() => void setStage(enrolmentId, event.target.value as StageKey))
          }
          className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink"
        >
          {STAGES.map((s) => (
            <option key={s.key} value={s.key}>
              {s.number}. {s.shortName}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (!next) {
    return <span className="text-sm text-muted">Final stage</span>;
  }

  // Stage 2 is the approval gate, so the student never advances into it.
  const blocked =
    next.key === "commitment"
      ? "A coach moves the project on once the proposal is approved"
      : next.key === "execution" && !approved
        ? "Waiting on approval"
        : next.key === "execution" && !charterSigned
          ? "Sign the Commitment Charter first"
          : null;

  if (blocked) {
    return <span className="text-sm text-muted">{blocked}</span>;
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => void setStage(enrolmentId, next.key))}
      className={buttonClass("secondary")}
    >
      Move to {next.shortName}
    </button>
  );
}
