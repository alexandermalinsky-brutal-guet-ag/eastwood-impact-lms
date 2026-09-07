"use client";

import { useRef, useTransition } from "react";

import { addTask, deleteTask, moveTask } from "@/lib/actions";
import { buttonClass } from "@/components/ui";
import type { tasks as tasksTable } from "@/db/schema";

type Task = typeof tasksTable.$inferSelect;
type Status = Task["status"];

/** Columns come from the team's own kanban practice. */
const COLUMNS: { key: Status; label: string; accent: string }[] = [
  { key: "backlog", label: "Backlog", accent: "var(--color-line)" },
  { key: "doing", label: "Doing", accent: "var(--color-blue-purple)" },
  { key: "review", label: "Review", accent: "var(--color-mustard)" },
  { key: "done", label: "Done", accent: "var(--color-forest-green)" },
];

const ORDER: Status[] = ["backlog", "doing", "review", "done"];

export function Kanban({
  enrolmentId,
  tasks,
}: {
  enrolmentId: string;
  tasks: Task[];
}) {
  const [pending, start] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-royal-purple">
            Kanban
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">
            The board
          </h2>
        </div>

        <form
          ref={formRef}
          action={(formData) => {
            start(async () => {
              await addTask(enrolmentId, formData);
              formRef.current?.reset();
            });
          }}
          className="flex gap-2"
        >
          <label htmlFor="new-task" className="sr-only">
            New task
          </label>
          <input
            id="new-task"
            name="title"
            required
            maxLength={200}
            placeholder="Add a task…"
            className="w-56 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted/60"
          />
          <button type="submit" disabled={pending} className={buttonClass("secondary")}>
            Add
          </button>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((column) => {
          const items = tasks.filter((task) => task.status === column.key);
          return (
            <div key={column.key} className="rounded-[14px] bg-white/60 p-1">
              <div
                className="mb-2 flex items-center justify-between rounded-lg px-3 py-2"
                style={{ borderTop: `3px solid ${column.accent}`, background: "#fff" }}
              >
                <h3 className="text-sm font-bold text-ink">{column.label}</h3>
                <span className="text-xs font-semibold tabular-nums text-muted">
                  {items.length}
                </span>
              </div>

              <ul className="space-y-2">
                {items.map((task) => {
                  const index = ORDER.indexOf(task.status);
                  return (
                    <li key={task.id} className="card p-3">
                      <p className="text-sm leading-snug text-ink">{task.title}</p>
                      <div className="mt-2.5 flex items-center gap-1">
                        <button
                          type="button"
                          disabled={pending || index === 0}
                          onClick={() =>
                            start(() => void moveTask(task.id, ORDER[index - 1]))
                          }
                          aria-label={`Move "${task.title}" left`}
                          className="rounded px-1.5 py-0.5 text-xs font-bold text-muted hover:bg-paper disabled:opacity-30"
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          disabled={pending || index === ORDER.length - 1}
                          onClick={() =>
                            start(() => void moveTask(task.id, ORDER[index + 1]))
                          }
                          aria-label={`Move "${task.title}" right`}
                          className="rounded px-1.5 py-0.5 text-xs font-bold text-muted hover:bg-paper disabled:opacity-30"
                        >
                          →
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => start(() => void deleteTask(task.id))}
                          aria-label={`Delete "${task.title}"`}
                          className="ml-auto rounded px-1.5 py-0.5 text-xs font-semibold text-muted hover:bg-paper hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  );
                })}

                {items.length === 0 ? (
                  <li className="px-3 py-6 text-center text-xs text-muted">
                    Nothing here
                  </li>
                ) : null}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
