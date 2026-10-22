"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { startOwnProject } from "@/lib/actions";
import { buttonClass } from "@/components/ui";

/** Two routes in: your own idea (the default) or the catalogue as inspiration. */
export function StartProject() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={`${buttonClass("primary")} px-6 py-3 text-base`}>
        Start a project
      </button>
    );
  }

  return (
    <div className="card w-full max-w-md p-5">
      <h2 className="font-bold text-ink">Start a project</h2>
      <form
        action={(fd) =>
          start(async () => {
            const slug = await startOwnProject(fd);
            setOpen(false);
            router.push(`/projects/${slug}`);
          })
        }
        className="mt-3 space-y-2"
      >
        <label htmlFor="own-title" className="block text-xs font-bold uppercase tracking-wider text-muted">
          My own idea
        </label>
        <input
          id="own-title" name="title" required minLength={3} maxLength={120} autoFocus
          placeholder="Working title — you can change it later"
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
        />
        <div className="flex flex-wrap gap-2 pt-1">
          <button type="submit" disabled={pending} className={buttonClass("primary")}>
            {pending ? "Creating…" : "Create it"}
          </button>
          <button type="button" onClick={() => setOpen(false)} className={buttonClass("ghost")}>Cancel</button>
        </div>
      </form>
      <p className="mt-3 border-t border-line pt-3 text-sm text-muted">
        Or{" "}
        <a href="/projects" className="font-semibold text-royal-purple underline">
          look through the catalogue
        </a>{" "}
        for inspiration — it is a starting point, not a closed menu.
      </p>
    </div>
  );
}
