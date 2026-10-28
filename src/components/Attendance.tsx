"use client";

import { useState, useTransition } from "react";

import {
  createAttendanceSession,
  markAttendance,
  markRestPresent,
} from "@/lib/actions";
import { Button, buttonClass } from "@/components/ui";
import type { AttendanceStatus } from "@/db/schema";

/** The four marks, in the order a register is usually read. */
const STATUSES: { key: AttendanceStatus; label: string; on: string }[] = [
  { key: "present", label: "Present", on: "bg-forest-green text-white border-forest-green" },
  { key: "late", label: "Late", on: "bg-mustard text-white border-mustard" },
  { key: "excused", label: "Excused", on: "bg-deep-blue text-white border-deep-blue" },
  { key: "absent", label: "Absent", on: "bg-red-700 text-white border-red-700" },
];

export function NewSessionForm() {
  const [pending, start] = useTransition();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form
      action={(formData) => start(() => void createAttendanceSession(formData))}
      className="card flex flex-wrap items-end gap-3 p-4"
    >
      <div>
        <label htmlFor="date" className="block text-xs font-bold uppercase tracking-wider text-muted">
          Date
        </label>
        <input
          id="date" name="date" type="date" required defaultValue={today}
          className="mt-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
        />
      </div>
      <div className="min-w-[14rem] flex-1">
        <label htmlFor="title" className="block text-xs font-bold uppercase tracking-wider text-muted">
          What is it? <span className="font-medium normal-case tracking-normal">(optional)</span>
        </label>
        <input
          id="title" name="title" maxLength={120} placeholder="Structured work session"
          className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Opening…" : "Open register"}
      </Button>
    </form>
  );
}

type Row = {
  userId: string; name: string | null; email: string; grade: string | null;
  status: AttendanceStatus | null; note: string | null; markedByName: string | null;
};

export function Register({
  sessionId,
  roster,
}: {
  sessionId: string;
  roster: Row[];
}) {
  const [pending, start] = useTransition();
  // Mirrors the server so a mark lands instantly; the action revalidates after.
  const [marks, setMarks] = useState<Record<string, AttendanceStatus | null>>(
    () => Object.fromEntries(roster.map((r) => [r.userId, r.status])),
  );
  const [notes, setNotes] = useState<Record<string, string>>(
    () => Object.fromEntries(roster.map((r) => [r.userId, r.note ?? ""])),
  );

  function mark(userId: string, status: AttendanceStatus) {
    setMarks((m) => ({ ...m, [userId]: status }));
    start(() => void markAttendance(sessionId, userId, status, notes[userId] ?? ""));
  }

  function saveNote(userId: string) {
    const status = marks[userId];
    if (!status) return;
    start(() => void markAttendance(sessionId, userId, status, notes[userId] ?? ""));
  }

  const unmarked = roster.filter((r) => !marks[r.userId]).length;

  if (roster.length === 0) {
    return (
      <div className="card border-dashed p-8 text-center">
        <p className="font-semibold text-ink">No active students</p>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-muted">
          A register lists every active student. Add students on the Programme page first.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {unmarked === 0
            ? "Everyone is marked."
            : `${unmarked} of ${roster.length} still unmarked.`}
        </p>
        {unmarked > 0 ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setMarks((m) => {
                const next = { ...m };
                for (const r of roster) if (!next[r.userId]) next[r.userId] = "present";
                return next;
              });
              start(() => void markRestPresent(sessionId));
            }}
            className={buttonClass("secondary")}
          >
            Mark the remaining {unmarked} present
          </button>
        ) : null}
      </div>

      <div className="space-y-2">
        {roster.map((r) => {
          const status = marks[r.userId];
          return (
            <div key={r.userId} className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{r.name ?? r.email}</p>
                  <p className="text-xs text-muted">
                    {r.grade ? `Grade ${r.grade} · ` : ""}{r.email}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5" role="group" aria-label={`Mark ${r.name ?? r.email}`}>
                  {STATUSES.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      disabled={pending}
                      aria-pressed={status === s.key}
                      onClick={() => mark(r.userId, s.key)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
                        status === s.key
                          ? s.on
                          : "border-line bg-surface text-muted hover:border-light-purple hover:text-royal-purple"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* A reason only means something for the marks that need one. */}
              {status && status !== "present" ? (
                <input
                  value={notes[r.userId] ?? ""}
                  onChange={(e) => setNotes((n) => ({ ...n, [r.userId]: e.target.value }))}
                  onBlur={() => saveNote(r.userId)}
                  maxLength={500}
                  placeholder={status === "excused" ? "Why it is excused — the student sees this" : "Note (optional)"}
                  className="mt-3 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </>
  );
}
