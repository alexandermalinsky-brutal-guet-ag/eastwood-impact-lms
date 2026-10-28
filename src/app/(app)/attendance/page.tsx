import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { NewSessionForm } from "@/components/Attendance";
import { Empty, SectionHeading } from "@/components/ui";
import { formatDueDate } from "@/lib/dates";
import { attendanceSessionList } from "@/lib/queries";

export const metadata: Metadata = { title: "Attendance" };
export const dynamic = "force-dynamic";

/**
 * Registers for the weekly structured work sessions. One row per session,
 * showing how much of it is actually filled in — an empty register is the
 * thing a coach most needs to notice.
 */
export default async function AttendancePage() {
  const session = await auth();
  if (session!.user.role === "student") redirect("/dashboard");

  const sessions = await attendanceSessionList();

  return (
    <>
      <SectionHeading
        eyebrow="Attendance"
        title="Registers"
        description="One register per structured work session. Mark present, late, excused or absent — students see their own record on their dashboard."
      />

      <NewSessionForm />

      <div className="mt-8 space-y-2">
        {sessions.length === 0 ? (
          <Empty title="No registers yet">
            Open one for today&rsquo;s session above. The register lists every active
            student, and nobody is marked until you say so.
          </Empty>
        ) : (
          sessions.map((s) => (
            <Link
              key={s.id}
              href={`/attendance/${s.id}`}
              className="card flex flex-wrap items-center justify-between gap-3 p-4 transition-shadow hover:shadow-md"
            >
              <div className="min-w-0">
                <p className="font-bold text-ink">
                  {formatDueDate(s.date, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                </p>
                <p className="mt-0.5 text-sm text-muted">
                  {s.title || "Structured work session"}
                  {s.createdByName ? ` · opened by ${s.createdByName}` : ""}
                </p>
              </div>

              {s.tally.marked === 0 ? (
                <span className="rounded-full bg-mustard/15 px-3 py-1 text-xs font-bold text-mustard">
                  Not marked yet
                </span>
              ) : (
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs tabular-nums text-muted">
                  <span><b className="text-forest-green">{s.tally.present}</b> present</span>
                  <span><b className="text-mustard">{s.tally.late}</b> late</span>
                  <span><b className="text-ink">{s.tally.excused}</b> excused</span>
                  <span><b className="text-red-700">{s.tally.absent}</b> absent</span>
                </div>
              )}
            </Link>
          ))
        )}
      </div>
    </>
  );
}
