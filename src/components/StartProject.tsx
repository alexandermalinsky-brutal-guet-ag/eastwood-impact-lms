"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { addProjectIdea, startOwnProject } from "@/lib/actions";
import { CoachChoice, type Coach } from "@/components/CoachChoice";
import { Modal } from "@/components/Modal";
import { buttonClass } from "@/components/ui";

/**
 * Starting a project, in two steps: what it is, then who is coaching you.
 * Split rather than stacked because the second question has nothing to do
 * with the first, and a student who has not been told their coach yet should
 * hit that as its own wall rather than halfway down a form.
 *
 * The first step has a second way out: an idea you think is worth doing but
 * are not going to run goes on the noticeboard instead, and skips the coach
 * entirely — nobody has committed to it.
 */
export function StartProject({ coaches, large = false }: { coaches: Coach[]; large?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [coachId, setCoachId] = useState("");
  const [error, setError] = useState("");

  function close() {
    setOpen(false);
    setStep(1);
    setTitle("");
    setSummary("");
    setCoachId("");
    setError("");
  }

  function fields() {
    const fd = new FormData();
    fd.set("title", title);
    fd.set("summary", summary);
    return fd;
  }

  /** Shared so a rejection shows in the dialog rather than vanishing. */
  function run(work: () => Promise<void>) {
    start(async () => {
      setError("");
      try {
        await work();
      } catch (e) {
        // Without this the dialog just sits there looking unbothered.
        setError(e instanceof Error ? e.message : "That did not work.");
      }
    });
  }

  function create() {
    run(async () => {
      const fd = fields();
      fd.set("coachId", coachId);
      const slug = await startOwnProject(fd);
      close();
      router.push(`/projects/${slug}`);
    });
  }

  function suggest() {
    run(async () => {
      await addProjectIdea(fields());
      close();
      router.push("/projects#ideas");
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${buttonClass("primary")}${large ? " px-6 py-3 text-base" : ""}`}
      >
        Start a project
      </button>

      <Modal
        open={open}
        onClose={close}
        title={step === 1 ? "Start a project" : "Who is coaching you?"}
      >
        <p className="mb-3 text-[0.65rem] font-bold uppercase tracking-wider text-muted">
          Step {step} of 2
        </p>

        {step === 1 ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setStep(2);
            }}
            className="space-y-2"
          >
            <label htmlFor="own-title" className="block text-xs font-bold uppercase tracking-wider text-muted">
              My own idea
            </label>
            <input
              id="own-title" name="title" required minLength={3} maxLength={120} autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Working title — you can change it later"
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
            />

            <label htmlFor="own-summary" className="block pt-1 text-xs font-bold uppercase tracking-wider text-muted">
              What is it, in a sentence{" "}
              <span className="font-medium normal-case tracking-normal">— optional</span>
            </label>
            <textarea
              id="own-summary" name="summary" rows={2} maxLength={300}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Who it is for and what you want to change. The full proposal comes later."
              className="w-full resize-none rounded-lg border border-line bg-surface px-3 py-2 text-sm leading-relaxed text-ink"
            />

            {error ? (
              <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">
                {error}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2 pt-1">
              <button type="submit" disabled={pending} className={buttonClass("primary")}>
                Next
              </button>
              <button
                type="button"
                disabled={pending || title.trim().length < 3}
                onClick={suggest}
                className={buttonClass("secondary")}
              >
                {pending ? "Adding…" : "Add to project ideas"}
              </button>
              <button type="button" onClick={close} className={buttonClass("ghost")}>Cancel</button>
            </div>
            <p className="pt-1 text-xs leading-relaxed text-muted">
              <span className="font-semibold text-ink">Next</span> starts it as your project.{" "}
              <span className="font-semibold text-ink">Add to project ideas</span> puts it on the
              board for someone else to pick up — no coach needed.
            </p>
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              create();
            }}
            className="space-y-3"
          >
            <p className="text-sm leading-relaxed text-muted">
              Pick the coach you have been assigned to. They are the one who
              reads your proposal and approves it or sends it back.
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
                {pending ? "Creating…" : "Create it"}
              </button>
              <button type="button" onClick={() => setStep(1)} className={buttonClass("ghost")}>Back</button>
            </div>
          </form>
        )}

        {step === 1 ? (
          <p className="mt-3 border-t border-line pt-3 text-sm text-muted">
            Or{" "}
            <a href="/projects" className="font-semibold text-royal-purple underline">
              look through the catalogue
            </a>{" "}
            for inspiration — it is a starting point, not a closed menu.
          </p>
        ) : null}
      </Modal>
    </>
  );
}
