"use client";

import { useTransition } from "react";

import { joinProject, leaveProject, setEnrolmentStatus } from "@/lib/actions";
import { Button } from "@/components/ui";

export function JoinButton({
  projectSlug,
  enrolmentId,
  status,
}: {
  projectSlug: string;
  enrolmentId: string | null;
  status: "active" | "complete" | "withdrawn" | null;
}) {
  const [pending, start] = useTransition();

  if (!enrolmentId) {
    return (
      <Button
        disabled={pending}
        onClick={() => start(() => void joinProject(projectSlug))}
        className="px-6 py-2.5"
      >
        {pending ? "Joining…" : "Join this project"}
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-stretch gap-2">
      {status === "complete" ? (
        <>
          <span className="rounded-lg bg-forest-green px-4 py-2 text-center text-sm font-bold text-white">
            Completed
          </span>
          <Button
            variant="ghost"
            disabled={pending}
            onClick={() => start(() => void setEnrolmentStatus(enrolmentId, "active"))}
          >
            Reopen
          </Button>
        </>
      ) : (
        <Button
          disabled={pending}
          onClick={() => start(() => void setEnrolmentStatus(enrolmentId, "complete"))}
          className="px-6 py-2.5"
        >
          Mark complete
        </Button>
      )}

      <Button
        variant="danger"
        disabled={pending}
        onClick={() => {
          if (
            confirm(
              "Leave this project? Your board, criteria and reflections for it will be deleted.",
            )
          ) {
            start(() => void leaveProject(enrolmentId));
          }
        }}
      >
        Leave project
      </Button>
    </div>
  );
}
