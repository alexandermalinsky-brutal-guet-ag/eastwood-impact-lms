import { formatDueDate } from "@/lib/dates";
import type { AttendanceTally } from "@/lib/queries";
import type { AttendanceStatus } from "@/db/schema";

const TONE: Record<AttendanceStatus, string> = {
  present: "text-forest-green",
  late: "text-mustard",
  excused: "text-deep-blue",
  absent: "text-red-700",
};

const WORD: Record<AttendanceStatus, string> = {
  present: "Present", late: "Late", excused: "Excused", absent: "Absent",
};

/**
 * The student's own attendance. Lateness is the number they asked to see, so
 * it leads — but the sessions are listed underneath, because a count you
 * cannot check is a count you cannot argue with.
 */
export function AttendanceSummary({
  tally,
  sessions,
}: {
  tally: AttendanceTally;
  sessions: {
    status: AttendanceStatus; note: string; markedByName: string;
    date: string; title: string;
  }[];
}) {
  if (tally.marked === 0) return null;

  const attended = tally.present + tally.late;
  const rate = Math.round((attended / tally.marked) * 100);

  return (
    <section className="mt-10">
      <h2 className="mb-1 text-xl font-bold tracking-tight text-ink">Your attendance</h2>
      <p className="mb-4 text-sm text-muted">
        Across {tally.marked} structured work session{tally.marked === 1 ? "" : "s"}.
        Ask your coach if something here looks wrong.
      </p>

      <div className="grid gap-3 sm:grid-cols-4">
        {(["late", "absent", "excused", "present"] as const).map((key) => (
          <div key={key} className="card p-4">
            <p className={`text-3xl font-bold tabular-nums tracking-tight ${TONE[key]}`}>
              {tally[key]}
            </p>
            <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-muted">
              {WORD[key]}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-3 text-sm text-muted">
        You were there for <b className="text-ink">{attended} of {tally.marked}</b> ({rate}%)
        {tally.late > 0 ? (
          <>
            , and late to{" "}
            <b className="text-mustard">
              {tally.late} {tally.late === 1 ? "session" : "sessions"}
            </b>
          </>
        ) : null}.
      </p>

      <ul className="mt-4 space-y-1.5">
        {sessions.slice(0, 8).map((s, i) => (
          <li
            key={`${s.date}-${i}`}
            className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line pb-1.5 text-sm last:border-0"
          >
            <span className="text-muted">
              {formatDueDate(s.date, { weekday: "short", day: "numeric", month: "short" })}
              {s.title ? ` · ${s.title}` : ""}
            </span>
            <span className={`font-semibold ${TONE[s.status]}`}>
              {WORD[s.status]}
              {s.note ? <span className="font-normal text-muted"> — {s.note}</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
