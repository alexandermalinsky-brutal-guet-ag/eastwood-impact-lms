"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { addProjectIdea } from "@/lib/actions";
import { Modal } from "@/components/Modal";
import { Button, buttonClass } from "@/components/ui";

/**
 * Putting an idea on the board. No coach and no proposal — nobody has taken
 * it on, so none of that applies yet.
 */
export function PostIdea() {
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
      <Button variant="secondary" onClick={() => { setOpen(true); setError(""); }}>
        Post an idea
      </Button>

      <Modal open={open} onClose={close} title="Post an idea">
        <form
          action={(fd) =>
            start(async () => {
              setError("");
              try {
                await addProjectIdea(fd);
                close();
                router.refresh();
              } catch (e) {
                setError(e instanceof Error ? e.message : "That did not work.");
              }
            })
          }
          className="space-y-2"
        >
          <p className="text-sm leading-relaxed text-muted">
            Something worth doing that you are not going to run yourself. No coach needed —
            nobody has taken it on yet.
          </p>

          <label htmlFor="idea-title" className="block pt-1 text-xs font-bold uppercase tracking-wider text-muted">
            Title
          </label>
          <input
            id="idea-title" name="title" required minLength={3} maxLength={120} autoFocus
            placeholder="The Dinner Club"
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
          />

          <label htmlFor="idea-summary" className="block pt-1 text-xs font-bold uppercase tracking-wider text-muted">
            What is it, and why does it matter?
          </label>
          <textarea
            id="idea-summary" name="summary" rows={6} maxLength={2000}
            placeholder="Who it is for, what would be different, and anything you already know about how it could work."
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm leading-relaxed text-ink"
          />

          {error ? (
            <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-1">
            <button type="submit" disabled={pending} className={buttonClass("primary")}>
              {pending ? "Posting…" : "Post it"}
            </button>
            <button type="button" onClick={close} className={buttonClass("ghost")}>Cancel</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
