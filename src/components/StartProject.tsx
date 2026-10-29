"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { startOwnProject } from "@/lib/actions";
import { Modal } from "@/components/Modal";
import { buttonClass } from "@/components/ui";

/** Two routes in: your own idea (the default) or the catalogue as inspiration. */
export function StartProject() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  function close() {
    setOpen(false);
    setError("");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${buttonClass("primary")} px-6 py-3 text-base`}
      >
        Start a project
      </button>

      <Modal open={open} onClose={close} title="Start a project">
        <form
          action={(fd) =>
            start(async () => {
              setError("");
              try {
                const slug = await startOwnProject(fd);
                close();
                router.push(`/projects/${slug}`);
              } catch (e) {
                // Without this the dialog just sits there looking unbothered.
                setError(e instanceof Error ? e.message : "That did not work.");
              }
            })
          }
          className="space-y-2"
        >
          <label htmlFor="own-title" className="block text-xs font-bold uppercase tracking-wider text-muted">
            My own idea
          </label>
          <input
            id="own-title" name="title" required minLength={3} maxLength={120} autoFocus
            placeholder="Working title — you can change it later"
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
          />

          <label htmlFor="own-summary" className="block pt-1 text-xs font-bold uppercase tracking-wider text-muted">
            What is it, in a sentence{" "}
            <span className="font-medium normal-case tracking-normal">— optional</span>
          </label>
          <textarea
            id="own-summary" name="summary" rows={2} maxLength={300}
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
              {pending ? "Creating…" : "Create it"}
            </button>
            <button type="button" onClick={close} className={buttonClass("ghost")}>Cancel</button>
          </div>
        </form>
        <p className="mt-3 border-t border-line pt-3 text-sm text-muted">
          Or{" "}
          <a href="/projects" className="font-semibold text-royal-purple underline">
            look through the catalogue
          </a>{" "}
          for inspiration — it is a starting point, not a closed menu.
        </p>
      </Modal>
    </>
  );
}
