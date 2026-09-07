"use client";

import { useState, useTransition } from "react";

import { saveReflection, startNextCycle } from "@/lib/actions";
import { buttonClass } from "@/components/ui";
import type { reflections as reflectionsTable } from "@/db/schema";

type Reflection = typeof reflectionsTable.$inferSelect;

const FIELDS = [
  {
    name: "plan",
    label: "Plan",
    hint: "What are you going to do, and what do you expect to happen?",
    colour: "var(--color-blue-purple)",
  },
  {
    name: "act",
    label: "Act",
    hint: "What did you actually do? Include the parts that went sideways.",
    colour: "var(--color-mustard)",
  },
  {
    name: "reflect",
    label: "Reflect",
    hint: "What is different now, and what would you do differently next time?",
    colour: "var(--color-forest-green)",
  },
] as const;

export function ReflectionCycles({
  enrolmentId,
  reflections,
}: {
  enrolmentId: string;
  reflections: Reflection[];
}) {
  const [pending, start] = useTransition();
  const [openCycle, setOpenCycle] = useState(
    reflections.length ? reflections[reflections.length - 1].cycle : 1,
  );

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-royal-purple">
            Learning record
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">
            Plan · Act · Reflect
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm text-muted">
            One entry per cycle. This is the record you show at demo time, so
            write it as you go rather than at the end.
          </p>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() => start(() => void startNextCycle(enrolmentId))}
          className={buttonClass("secondary")}
        >
          Start cycle {reflections.length + 1}
        </button>
      </div>

      {reflections.length > 1 ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {reflections.map((reflection) => (
            <button
              key={reflection.id}
              type="button"
              onClick={() => setOpenCycle(reflection.cycle)}
              aria-pressed={openCycle === reflection.cycle}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${
                openCycle === reflection.cycle
                  ? "bg-deep-blue text-white"
                  : "border border-line bg-surface text-muted hover:text-royal-purple"
              }`}
            >
              Cycle {reflection.cycle}
            </button>
          ))}
        </div>
      ) : null}

      {reflections
        .filter((reflection) => reflection.cycle === openCycle)
        .map((reflection) => (
          <form
            key={reflection.id}
            action={(formData) =>
              start(() => void saveReflection(reflection.id, formData))
            }
            className="card space-y-5 p-5"
          >
            {FIELDS.map((field) => (
              <div key={field.name}>
                <label
                  htmlFor={`${field.name}-${reflection.id}`}
                  className="flex items-center gap-2 text-sm font-bold text-ink"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: field.colour }}
                  />
                  {field.label}
                </label>
                <p className="mb-1.5 mt-0.5 text-xs text-muted">{field.hint}</p>
                <textarea
                  id={`${field.name}-${reflection.id}`}
                  name={field.name}
                  rows={3}
                  maxLength={4000}
                  defaultValue={reflection[field.name]}
                  className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm leading-relaxed text-ink"
                />
              </div>
            ))}

            <div className="rounded-lg bg-paper p-4">
              <label
                htmlFor={`further-${reflection.id}`}
                className="text-sm font-bold text-ink"
              >
                Ask a further question
              </label>
              <p className="mb-1.5 mt-0.5 text-xs text-muted">
                What does this cycle make you want to find out next?
              </p>
              <input
                id={`further-${reflection.id}`}
                name="furtherQuestion"
                maxLength={1000}
                defaultValue={reflection.furtherQuestion}
                className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
              />
            </div>

            <div className="flex items-center gap-3">
              <button type="submit" disabled={pending} className={buttonClass("primary")}>
                {pending ? "Saving…" : "Save cycle"}
              </button>
              <span className="text-xs text-muted">
                Last saved {reflection.updatedAt.toLocaleString("en-GB")}
              </span>
            </div>
          </form>
        ))}
    </section>
  );
}
