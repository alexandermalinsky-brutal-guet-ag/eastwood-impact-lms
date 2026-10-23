"use client";

import {
  DndContext, DragOverlay, KeyboardSensor, PointerSensor, TouchSensor,
  closestCorners, useDroppable, useSensor, useSensors,
  type DragEndEvent, type DragOverEvent, type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useRef, useState, useTransition } from "react";

import { addTask, deleteTask, moveTask } from "@/lib/actions";
import { buttonClass } from "@/components/ui";
import type { tasks as tasksTable } from "@/db/schema";

type Task = typeof tasksTable.$inferSelect;
type Status = Task["status"];

const COLUMNS: { key: Status; label: string; accent: string; empty: string }[] = [
  { key: "backlog", label: "Backlog", accent: "var(--color-line)",
    empty: "Milestones you add on the Plan tab land here automatically." },
  { key: "doing", label: "Doing", accent: "var(--color-blue-purple)",
    empty: "Drag work here when you start it — one or two at a time." },
  { key: "review", label: "Review", accent: "var(--color-mustard)",
    empty: "Things finished but not yet checked by anyone." },
  { key: "done", label: "Done", accent: "var(--color-forest-green)",
    empty: "Finished and checked." },
];
const ORDER: Status[] = COLUMNS.map((c) => c.key);

type CardProps = {
  task: Task; pending: boolean;
  onMove: (dir: -1 | 1) => void; onDelete: () => void; overlay?: boolean;
};

/** Card chrome, shared by the static and draggable versions. */
function CardBody({
  task, pending, onMove, onDelete, overlay = false, handle, dragging,
}: CardProps & { handle?: React.HTMLAttributes<HTMLElement>; dragging?: boolean }) {
  const index = ORDER.indexOf(task.status);

  return (
    <>
      {/* The whole card is the grab handle, so a thumb has a big target —
          the buttons below stay clickable because dnd-kit ignores them. */}
      <p
        {...handle}
        className={handle ? "cursor-grab touch-none text-sm leading-snug text-ink active:cursor-grabbing" : "text-sm leading-snug text-ink"}
      >
        {task.title}
      </p>

      {overlay ? null : (
        <div className="mt-2.5 flex items-center gap-1">
          <button
            type="button" disabled={pending || index === 0} onClick={() => onMove(-1)}
            aria-label={`Move "${task.title}" to ${COLUMNS[index - 1]?.label ?? "previous"}`}
            className="rounded px-1.5 py-0.5 text-xs font-bold text-muted hover:bg-paper disabled:opacity-30"
          >
            ←
          </button>
          <button
            type="button" disabled={pending || index === ORDER.length - 1} onClick={() => onMove(1)}
            aria-label={`Move "${task.title}" to ${COLUMNS[index + 1]?.label ?? "next"}`}
            className="rounded px-1.5 py-0.5 text-xs font-bold text-muted hover:bg-paper disabled:opacity-30"
          >
            →
          </button>
          <button
            type="button" disabled={pending} onClick={onDelete}
            aria-label={`Delete "${task.title}"`}
            className="ml-auto rounded px-1.5 py-0.5 text-xs font-semibold text-muted hover:bg-paper hover:text-red-700"
          >
            Delete
          </button>
        </div>
      )}
    </>
  );
}

/** What the server sends: identical chrome, no drag wiring. */
function StaticCard(props: CardProps) {
  return <li className="card p-3"><CardBody {...props} /></li>;
}

function SortableCard(props: CardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: props.task.id, data: { status: props.task.status } });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`card p-3 ${isDragging ? "opacity-40" : ""}`}
    >
      <CardBody {...props} handle={{ ...attributes, ...listeners }} dragging={isDragging} />
    </li>
  );
}

/** Column chrome without the droppable hook, for the server pass. */
function StaticColumn({
  column, tasks, children,
}: {
  column: (typeof COLUMNS)[number]; tasks: Task[]; children: React.ReactNode;
}) {
  return (
    <div className="rounded-[14px] bg-white/60 p-1">
      <div
        className="mb-2 flex items-center justify-between rounded-lg px-3 py-2"
        style={{ borderTop: `3px solid ${column.accent}`, background: "#fff" }}
      >
        <h3 className="text-sm font-bold text-ink">{column.label}</h3>
        <span className="text-xs font-semibold tabular-nums text-muted">{tasks.length}</span>
      </div>
      <ul className="min-h-[5.5rem] space-y-2 px-1 pb-1">
        {children}
        {tasks.length === 0 ? (
          <li className="rounded-lg border border-dashed border-line px-3 py-5 text-center text-xs leading-relaxed text-muted">
            {column.empty}
          </li>
        ) : null}
      </ul>
    </div>
  );
}

function Column({
  column, tasks, children,
}: {
  column: (typeof COLUMNS)[number]; tasks: Task[]; children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.key });

  return (
    <div className={`rounded-[14px] p-1 transition-colors ${isOver ? "bg-royal-purple/10" : "bg-white/60"}`}>
      <div
        className="mb-2 flex items-center justify-between rounded-lg px-3 py-2"
        style={{ borderTop: `3px solid ${column.accent}`, background: "#fff" }}
      >
        <h3 className="text-sm font-bold text-ink">{column.label}</h3>
        <span className="text-xs font-semibold tabular-nums text-muted">{tasks.length}</span>
      </div>

      <ul ref={setNodeRef} className="min-h-[5.5rem] space-y-2 px-1 pb-1">
        {children}
        {tasks.length === 0 ? (
          <li className={`rounded-lg border border-dashed px-3 py-5 text-center text-xs leading-relaxed transition-colors ${
            isOver ? "border-royal-purple text-royal-purple" : "border-line text-muted"
          }`}>
            {isOver ? "Drop it here" : column.empty}
          </li>
        ) : null}
      </ul>
    </div>
  );
}

export function Kanban({ enrolmentId, tasks }: { enrolmentId: string; tasks: Task[] }) {
  const [pending, start] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  // Cards move the instant you drop them; the server call follows. Without
  // this the card snaps back to its old column until the round trip lands.
  const [items, setItems] = useState(tasks);
  const [dragging, setDragging] = useState<Task | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setItems(tasks), [tasks]);
  useEffect(() => setMounted(true), []);

  const sensors = useSensors(
    // A small distance before a drag starts, so a tap on the card is still a tap.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    // Touch needs a short hold, or scrolling the page would drag cards.
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const byStatus = (s: Status) => items.filter((t) => t.status === s);
  const find = (id: string) => items.find((t) => t.id === id);

  /** Where did this drop land — on a column, or on another card? */
  function statusOf(id: string): Status | null {
    if (ORDER.includes(id as Status)) return id as Status;
    return find(id)?.status ?? null;
  }

  function onDragStart(event: DragStartEvent) {
    setDragging(find(String(event.active.id)) ?? null);
  }

  /** Moves the card between columns while still held, so the drop is predictable. */
  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeTask = find(String(active.id));
    const overStatus = statusOf(String(over.id));
    if (!activeTask || !overStatus || activeTask.status === overStatus) return;

    setItems((prev) =>
      prev.map((t) => (t.id === activeTask.id ? { ...t, status: overStatus } : t)),
    );
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setDragging(null);
    if (!over) return;

    const task = find(String(active.id));
    const status = statusOf(String(over.id));
    if (!task || !status) return;

    const column = byStatus(status).filter((t) => t.id !== task.id);
    const overIndex = column.findIndex((t) => t.id === String(over.id));
    const index = overIndex === -1 ? column.length : overIndex;

    setItems((prev) => {
      const rest = prev.filter((t) => t.id !== task.id);
      const moved = { ...task, status };
      const before = rest.filter((t) => t.status !== status);
      const col = rest.filter((t) => t.status === status);
      col.splice(index, 0, moved);
      return [...before, ...col];
    });

    setAnnouncement(`${task.title} moved to ${COLUMNS.find((c) => c.key === status)!.label}`);
    start(() => void moveTask(task.id, status, index));
  }

  /** The arrow buttons stay: on a phone, inside a scrolling page, a tap is
      more reliable than a drag, and they are what keyboard users reach for. */
  function step(task: Task, dir: -1 | 1) {
    const next = ORDER[ORDER.indexOf(task.status) + dir];
    if (!next) return;
    setItems((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: next } : t)));
    setAnnouncement(`${task.title} moved to ${COLUMNS.find((c) => c.key === next)!.label}`);
    start(() => void moveTask(task.id, next));
  }

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-royal-purple">
            Kanban
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">The board</h2>
          <p className="mt-1 text-xs text-muted">
            Drag a card between columns, or use the arrows.
          </p>
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
          <label htmlFor="new-task" className="sr-only">New task</label>
          <input
            id="new-task" name="title" required maxLength={200} placeholder="Add a task…"
            className="w-56 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted/60"
          />
          <button type="submit" disabled={pending} className={buttonClass("secondary")}>Add</button>
        </form>
      </div>

      {!mounted ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((column) => (
            <StaticColumn key={column.key} column={column} tasks={byStatus(column.key)}>
              {byStatus(column.key).map((task) => (
                <StaticCard
                  key={task.id}
                  task={task}
                  pending={pending}
                  onMove={(dir) => step(task, dir)}
                  onDelete={() => {
                    setItems((prev) => prev.filter((t) => t.id !== task.id));
                    start(() => void deleteTask(task.id));
                  }}
                />
              ))}
            </StaticColumn>
          ))}
        </div>
      ) : (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={() => setDragging(null)}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((column) => {
            const columnTasks = byStatus(column.key);
            return (
              <Column key={column.key} column={column} tasks={columnTasks}>
                <SortableContext
                  items={columnTasks.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {columnTasks.map((task) => (
                    <SortableCard
                      key={task.id}
                      task={task}
                      pending={pending}
                      onMove={(dir) => step(task, dir)}
                      onDelete={() => {
                        setItems((prev) => prev.filter((t) => t.id !== task.id));
                        start(() => void deleteTask(task.id));
                      }}
                    />
                  ))}
                </SortableContext>
              </Column>
            );
          })}
        </div>

        <DragOverlay>
          {dragging ? (
            <ul className="w-full">
              <li className="card rotate-2 p-3 shadow-lg">
                <CardBody task={dragging} pending={false} onMove={() => {}} onDelete={() => {}} overlay />
              </li>
            </ul>
          ) : null}
        </DragOverlay>
      </DndContext>
      )}

      {/* Screen readers get told what happened; the drag itself is silent. */}
      <p aria-live="polite" className="sr-only">{announcement}</p>
    </section>
  );
}
