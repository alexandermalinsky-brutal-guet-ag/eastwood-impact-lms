"use client";

import { useTransition } from "react";

import { setPhase } from "@/lib/actions";
import { PHASES } from "@/lib/handbook";

/**
 * Phase is a coach's judgement about demonstrated readiness, so it is an
 * explicit choice someone makes — never derived from the student's year group.
 */
export function PhaseSelect({
  userId,
  phase,
  name,
}: {
  userId: string;
  phase: "exploration" | "execution" | "legacy";
  name: string;
}) {
  const [pending, start] = useTransition();

  return (
    <>
      <label htmlFor={`phase-${userId}`} className="sr-only">
        Phase for {name}
      </label>
      <select
        id={`phase-${userId}`}
        value={phase}
        disabled={pending}
        onChange={(event) =>
          start(() =>
            void setPhase(userId, event.target.value as typeof phase),
          )
        }
        className="rounded-lg border border-line bg-surface px-2.5 py-1 text-xs font-semibold text-ink disabled:opacity-50"
      >
        {PHASES.map((p) => (
          <option key={p.key} value={p.key}>
            {p.name}
          </option>
        ))}
      </select>
    </>
  );
}
