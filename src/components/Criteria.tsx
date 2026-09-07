"use client";

import { useRef, useTransition } from "react";

import { addCriterion, toggleCriterion } from "@/lib/actions";
import { buttonClass } from "@/components/ui";
import type { criteria as criteriaTable } from "@/db/schema";

type Criterion = typeof criteriaTable.$inferSelect;

export function Criteria({
  enrolmentId,
  criteria,
}: {
  enrolmentId: string;
  criteria: Criterion[];
}) {
  const [pending, start] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const met = criteria.filter((c) => c.met).length;

  return (
    <section>
      <div className="mb-5">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-royal-purple">
          Definition of done
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">
          Success criteria
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm text-muted">
          Agree these with your coach before you start. They are what &ldquo;finished&rdquo;
          means for this project — edit them so they fit the actual work.
        </p>
      </div>

      <div className="card p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-forest-green transition-all"
              style={{
                width: `${criteria.length ? (met / criteria.length) * 100 : 0}%`,
              }}
            />
          </div>
          <span className="text-xs font-bold tabular-nums text-muted">
            {met}/{criteria.length}
          </span>
        </div>

        <ul className="space-y-1">
          {criteria.map((criterion) => (
            <li key={criterion.id}>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 hover:bg-paper">
                <input
                  type="checkbox"
                  checked={criterion.met}
                  disabled={pending}
                  onChange={(event) =>
                    start(() =>
                      void toggleCriterion(criterion.id, event.target.checked),
                    )
                  }
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-forest-green)]"
                />
                <span
                  className={`text-sm leading-snug ${
                    criterion.met ? "text-muted line-through" : "text-ink"
                  }`}
                >
                  {criterion.label}
                </span>
              </label>
            </li>
          ))}
        </ul>

        <form
          ref={formRef}
          action={(formData) => {
            start(async () => {
              await addCriterion(enrolmentId, formData);
              formRef.current?.reset();
            });
          }}
          className="mt-4 flex gap-2 border-t border-line pt-4"
        >
          <label htmlFor="new-criterion" className="sr-only">
            New success criterion
          </label>
          <input
            id="new-criterion"
            name="label"
            required
            maxLength={240}
            placeholder="Add a criterion…"
            className="flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted/60"
          />
          <button type="submit" disabled={pending} className={buttonClass("secondary")}>
            Add
          </button>
        </form>
      </div>
    </section>
  );
}
