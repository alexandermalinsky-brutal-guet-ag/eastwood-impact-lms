"use client";

import { useTransition } from "react";

import { joinProject, leaveProject, markComplete } from "@/lib/actions";
import { Button } from "@/components/ui";
import { MAX_LEVEL, type PhaseKey } from "@/lib/handbook";

export function JoinButton({
  projectSlug,
  enrolmentId,
  status,
  phase,
  level,
}: {
  projectSlug: string;
  enrolmentId: string | null;
  status: "active" | "complete" | "withdrawn" | null;
  phase: PhaseKey;
  level: number;
}) {
  const [pending, start] = useTransition();

  if (!enrolmentId) {
    return (
      <Button disabled={pending} onClick={() => start(() => void joinProject(projectSlug))} className="px-6 py-2.5">
        {pending ? "Starting…" : "Start this project"}
      </Button>
    );
  }

  // "Mark complete" used to be available at any point. It now needs the final
  // level validated, which only a coach can do.
  const canComplete = phase === "report" && level >= MAX_LEVEL;

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

      <Button
        variant="danger"
        disabled={pending}
        onClick={() => {
          if (confirm("Leave this project? Everything in it will be deleted.")) {
            start(() => void leaveProject(enrolmentId));
          }
        }}
      >
        Leave project
      </Button>
    </div>
  );
}
