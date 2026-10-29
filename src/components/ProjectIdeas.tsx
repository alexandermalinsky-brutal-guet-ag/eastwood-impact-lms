"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { removeProjectIdea, startOwnProject } from "@/lib/actions";
import { CoachChoice, type Coach } from "@/components/CoachChoice";
import { Modal } from "@/components/Modal";
import { buttonClass } from "@/components/ui";

export type Idea = {
  id: string;
  title: string;
  summary: string;
  suggestedById: string | null;
  suggestedByName: string;
  /** Formatted on the server — see formatRelative. */
  posted: string;
};

/** Initials for the avatar, from however much of a name we have. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

/**
 * The ideas board: one card per idea, posted by a person, with their name on
 * it. A noticeboard you cannot act on is just a list, so every card can be
 * taken on — which makes it your project, with your coach, and leaves the
 * idea up for anyone else who wants it too.
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

  return (
    <>
      {error ? (
        <p className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
          {error}
        </p>
      ) : null}

      {ideas.length === 0 ? (
        <div className="card border-dashed p-8 text-center">
          <p className="font-semibold text-ink">No ideas up yet</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            Noticed something worth doing that you are not going to run yourself? Post it, and
            someone else can pick it up.
          </p>
        </div>
      ) : (
        /* Columns rather than a grid, so cards of different lengths pack
           together instead of leaving a ragged row of whitespace. */
        <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5">
          {ideas.map((idea) => (
            <article key={idea.id} className="card break-inside-avoid p-5">
              <div className="flex items-center gap-2.5">
                <span
                  aria-hidden
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-royal-purple text-[0.7rem] font-bold text-white"
                >
                  {initials(idea.suggestedByName)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {idea.suggestedByName || "Someone"}
                  </p>
                  <p className="text-xs text-muted">{idea.posted}</p>
                </div>
              </div>

              <h3 className="mt-3.5 text-lg font-bold leading-snug tracking-tight text-ink">
                {idea.title}
              </h3>

              {idea.summary ? (
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">
                  {idea.summary}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3.5">
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
                    className="rounded-lg px-2.5 py-1 text-xs font-bold text-muted hover:text-red-700"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}

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
