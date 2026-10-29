"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { removeProjectIdea, startOwnProject } from "@/lib/actions";
import { CoachChoice, type Coach } from "@/components/CoachChoice";
import { Modal } from "@/components/Modal";
import { Empty, buttonClass } from "@/components/ui";
import { formatDate } from "@/lib/dates";

export type Idea = {
  id: string;
  title: string;
  summary: string;
  suggestedById: string | null;
  suggestedByName: string;
  createdAt: Date;
};

/**
 * Ideas students have put up for each other. A noticeboard you cannot act on
 * is just a list, so every row can be taken on — which makes it your project,
 * with your coach, and leaves the idea up for anyone else who wants it too.
 */
export function ProjectIdeas({
  ideas,
  coaches,
  meId,
  canModerate,
}: {
  ideas: Idea[];
  coaches: Coach[];
  meId: string;
  /** Coaches and admins can take down anyone's idea; students only their own. */
  canModerate: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [taking, setTaking] = useState<Idea | null>(null);
  const [coachId, setCoachId] = useState("");
  const [error, setError] = useState("");

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

  if (ideas.length === 0) {
    return (
      <Empty title="No ideas on the board yet">
        Noticed something worth doing that you are not going to run yourself?
        Put it up from <span className="font-semibold">Start a project</span>.
      </Empty>
    );
  }

  return (
    <>
      {error ? (
        <p className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
          {error}
        </p>
      ) : null}

      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[40rem] text-sm">
          <thead className="bg-paper text-left text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3 font-bold">Idea</th>
              <th className="px-4 py-3 font-bold">Suggested by</th>
              <th className="px-4 py-3 font-bold">When</th>
              <th className="px-4 py-3 text-right font-bold">Take it on</th>
            </tr>
          </thead>
          <tbody>
            {ideas.map((idea) => (
              <tr key={idea.id} className="border-t border-line align-top">
                <td className="px-4 py-3">
                  <p className="font-semibold text-ink">{idea.title}</p>
                  {idea.summary ? (
                    <p className="mt-0.5 max-w-prose text-sm leading-relaxed text-muted">
                      {idea.summary}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-muted">{idea.suggestedByName || "—"}</td>
                <td className="px-4 py-3 tabular-nums text-muted">{formatDate(idea.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-1.5">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => { setTaking(idea); setCoachId(""); setError(""); }}
                      className={buttonClass("secondary")}
                    >
                      Start this
                    </button>
                    {canModerate || idea.suggestedById === meId ? (
                      <button
                        type="button"
                        disabled={pending}
                        aria-label={`Remove ${idea.title}`}
                        onClick={() => run(() => removeProjectIdea(idea.id))}
                        className="rounded-lg border border-line bg-surface px-2.5 py-1 text-xs font-bold text-muted hover:border-red-300 hover:text-red-700"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={Boolean(taking)}
        onClose={() => { setTaking(null); setError(""); }}
        title="Who is coaching you?"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const idea = taking;
            if (!idea) return;
            run(async () => {
              const fd = new FormData();
              fd.set("title", idea.title);
              fd.set("summary", idea.summary);
              fd.set("coachId", coachId);
              const slug = await startOwnProject(fd);
              setTaking(null);
              router.push(`/projects/${slug}`);
            });
          }}
          className="space-y-3"
        >
          <p className="text-sm leading-relaxed text-muted">
            Starting <span className="font-semibold text-ink">{taking?.title}</span> as your own
            project. Pick the coach you have been assigned to — the idea stays on the board for
            anyone else.
          </p>

          <CoachChoice coaches={coaches} value={coachId} onChange={setCoachId} />

          {error ? (
            <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="submit"
              disabled={pending || (coaches.length > 0 && !coachId)}
              className={buttonClass("primary")}
            >
              {pending ? "Starting…" : "Start it"}
            </button>
            <button
              type="button"
              onClick={() => { setTaking(null); setError(""); }}
              className={buttonClass("ghost")}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
