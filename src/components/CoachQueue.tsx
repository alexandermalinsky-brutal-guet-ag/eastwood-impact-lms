"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { approveProposal, returnProposal } from "@/lib/actions";
import { buttonClass } from "@/components/ui";
import { formatDate } from "@/lib/dates";

/**
 * Proposals waiting on a coach, oldest first. Approve or send back with a
 * reason — a return is not a rejection, the student revises and resubmits.
 */
export function CoachQueue({
  proposals,
}: {
  proposals: {
    enrolmentId: string;
    title: string;
    studentName: string | null;
    problem: string;
    submittedAt: Date | null;
    projectSlug: string;
  }[];
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [returning, setReturning] = useState<string | null>(null);

  function run(work: () => Promise<void>) {
    start(async () => {
      setError("");
      try {
        await work();
      } catch (e) {
        setError(e instanceof Error ? e.message : "That did not work.");
      }
    });
  }

  if (proposals.length === 0) {
    return (
      <div className="card border-dashed p-8 text-center">
        <p className="font-semibold text-ink">The queue is clear</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted">
          No proposals are waiting on you. Students are free to keep drafting.
        </p>
      </div>
    );
  }

  return (
    <>
      {error ? (
        <p className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
          {error}
        </p>
      ) : null}

      <ul className="space-y-3">
        {proposals.map((item) => (
          <li
            key={item.enrolmentId}
            className="card p-4"
            style={{ borderLeft: "3px solid var(--color-royal-purple)" }}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[0.65rem] font-bold uppercase tracking-wider text-royal-purple">
                  Proposal to approve
                </p>
                <p className="mt-1 font-bold text-ink">
                  {item.studentName ?? "A student"}
                  <span className="font-normal text-muted"> · </span>
                  <Link href={`/projects/${item.projectSlug}`} className="font-semibold hover:text-royal-purple">
                    {item.title}
                  </Link>
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{item.problem}</p>
              </div>
              {item.submittedAt ? (
                <span className="shrink-0 text-xs text-muted">{formatDate(item.submittedAt)}</span>
              ) : null}
            </div>

            <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
              {returning === item.enrolmentId ? (
                <form
                  className="w-full space-y-2"
                  action={(fd) =>
                    run(async () => {
                      await returnProposal(item.enrolmentId, fd);
                      setReturning(null);
                    })
                  }
                >
                  <textarea
                    name="comment" rows={2} required maxLength={2000}
                    placeholder="What needs more work?"
                    className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
                  />
                  <div className="flex gap-2">
                    <button type="submit" disabled={pending} className={buttonClass("secondary")}>Send back</button>
                    <button type="button" onClick={() => setReturning(null)} className={buttonClass("ghost")}>Cancel</button>
                  </div>
                </form>
              ) : (
                <>
                  <button
                    type="button" disabled={pending}
                    onClick={() => run(() => approveProposal(item.enrolmentId))}
                    className={buttonClass("primary")}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setReturning(item.enrolmentId)}
                    className={buttonClass("secondary")}
                  >
                    Return with comments
                  </button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
