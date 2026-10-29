import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";

import { db, isDatabaseConfigured } from "@/db";
import {
  attendance,
  attendanceSessions,
  enrolments,
  projectIdeas,
  users,
  type AttendanceStatus,
} from "@/db/schema";

export type EnrolmentRow = typeof enrolments.$inferSelect;

/**
 * Every query here is wrapped so the app degrades to an empty state — with a
 * visible warning — rather than crashing when Postgres is not yet attached.
 */
async function safe<T>(run: () => Promise<T>, fallback: T): Promise<T> {
  if (!isDatabaseConfigured()) return fallback;
  try {
    return await run();
  } catch (error) {
    console.error("[db]", error);
    return fallback;
  }
}

export async function myEnrolments(userId: string) {
  return safe(
    () =>
      db()
        .select()
        .from(enrolments)
        .where(eq(enrolments.userId, userId))
        .orderBy(desc(enrolments.joinedAt)),
    [] as EnrolmentRow[],
  );
}

export async function myEnrolmentFor(userId: string, projectSlug: string) {
  return safe(async () => {
    const [row] = await db()
      .select()
      .from(enrolments)
      .where(
        and(
          eq(enrolments.userId, userId),
          eq(enrolments.projectSlug, projectSlug),
        ),
      )
      .limit(1);
    return row ?? null;
  }, null as EnrolmentRow | null);
}

/** How many people are signed up to each project, for the browse pages. */
export async function enrolmentCounts() {
  const rows = await safe(
    () =>
      db()
        .select({
          projectSlug: enrolments.projectSlug,
          count: sql<number>`cast(count(*) as int)`,
        })
        .from(enrolments)
        .groupBy(enrolments.projectSlug),
    [] as { projectSlug: string; count: number }[],
  );
  return new Map(rows.map((r) => [r.projectSlug, r.count]));
}

export async function projectRoster(projectSlug: string) {
  return safe(
    () =>
      db()
        .select({
          id: enrolments.id,
          role: enrolments.role,
          status: enrolments.status,
          joinedAt: enrolments.joinedAt,
          name: users.name,
          email: users.email,
        })
        .from(enrolments)
        .innerJoin(users, eq(enrolments.userId, users.id))
        .where(eq(enrolments.projectSlug, projectSlug))
        .orderBy(asc(enrolments.joinedAt)),
    [] as {
      id: string;
      role: "member" | "lead";
      status: "active" | "complete" | "withdrawn";
      joinedAt: Date;
      name: string | null;
      email: string;
    }[],
  );
}

/** Staff overview: everyone on the platform and how much they are carrying. */
export async function staffOverview() {
  return safe(
    () =>
      db()
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          grade: users.grade,
          phase: users.phase,
          enabled: users.active,
          active: sql<number>`cast(count(*) filter (where ${enrolments.status} = 'active') as int)`,
          withdrawn: sql<number>`cast(count(*) filter (where ${enrolments.status} = 'withdrawn') as int)`,
        })
        .from(users)
        .leftJoin(enrolments, eq(users.id, enrolments.userId))
        .groupBy(users.id, users.name, users.email, users.role, users.grade, users.phase, users.active)
        .orderBy(asc(users.name)),
    [] as {
      id: string;
      name: string | null;
      email: string;
      role: "student" | "coach" | "admin";
      grade: string | null;
      phase: "exploration" | "execution" | "legacy";
      enabled: boolean;
      active: number;
      withdrawn: number;
    }[],
  );
}


/** The signed-in person's own profile fields. */
export async function myProfile(userId: string) {
  return safe(async () => {
    const [row] = await db()
      .select({
        name: users.name,
        email: users.email,
        role: users.role,
        grade: users.grade,
        phase: users.phase,
        academicYear: users.academicYear,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return row ?? null;
  }, null as {
    name: string | null;
    email: string;
    role: "student" | "coach" | "admin";
    grade: string | null;
    phase: "exploration" | "execution" | "legacy";
    academicYear: string | null;
    createdAt: Date;
  } | null);
}


/**
 * The coaches a student can be assigned to. Archived accounts are left out —
 * assigning someone to a coach who cannot sign in is assigning them to nobody.
 */
export async function coachList() {
  return safe(() =>
    db()
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(and(eq(users.role, "coach"), eq(users.active, true)))
      .orderBy(asc(users.name)),
    [] as { id: string; name: string | null; email: string }[],
  );
}

/** The ideas noticeboard, newest first. */
export async function projectIdeaList() {
  return safe(() =>
    db()
      .select()
      .from(projectIdeas)
      .orderBy(desc(projectIdeas.createdAt)),
    [] as (typeof projectIdeas.$inferSelect)[],
  );
}

/** Proposals sitting in the approval queue. */
export async function proposalsAwaitingReview() {
  return safe(() =>
    db()
      .select({
        enrolmentId: enrolments.id, projectSlug: enrolments.projectSlug,
        ownTitle: enrolments.ownTitle, problem: enrolments.problem,
        submittedAt: enrolments.proposalSubmittedAt,
        coachId: enrolments.coachId, coachName: enrolments.coachName,
        studentName: users.name,
      })
      .from(enrolments)
      .innerJoin(users, eq(enrolments.userId, users.id))
      .where(and(
        eq(enrolments.status, "active"),
        sql`${enrolments.proposalSubmittedAt} is not null`,
        sql`${enrolments.approvedAt} is null`,
      ))
      .orderBy(asc(enrolments.proposalSubmittedAt)),
    [] as {
      enrolmentId: string; projectSlug: string; ownTitle: string; problem: string;
      submittedAt: Date | null; coachId: string | null; coachName: string;
      studentName: string | null;
    }[],
  );
}

/**
 * Every student project, for the coach's overview. One row each, with the
 * fields `proposalState` reads — the coach page does not need anything else.
 */
export async function studentProjects() {
  return safe(() =>
    db()
      .select({
        enrolmentId: enrolments.id,
        projectSlug: enrolments.projectSlug,
        ownTitle: enrolments.ownTitle,
        status: enrolments.status,
        problem: enrolments.problem,
        proposalSubmittedAt: enrolments.proposalSubmittedAt,
        approvedAt: enrolments.approvedAt,
        returnedAt: enrolments.returnedAt,
        withdrawnReason: enrolments.withdrawnReason,
        coachName: enrolments.coachName,
        joinedAt: enrolments.joinedAt,
        studentName: users.name,
        studentEmail: users.email,
      })
      .from(enrolments)
      .innerJoin(users, eq(enrolments.userId, users.id))
      .where(eq(users.role, "student"))
      .orderBy(asc(users.name)),
    [] as {
      enrolmentId: string; projectSlug: string; ownTitle: string;
      status: "active" | "withdrawn"; problem: string;
      proposalSubmittedAt: Date | null; approvedAt: Date | null; returnedAt: Date | null;
      withdrawnReason: string; coachName: string; joinedAt: Date;
      studentName: string | null; studentEmail: string;
    }[],
  );
}

/**
 * The enrolment for a project by slug, regardless of who owns it. Staff need
 * this to open an own-idea project from the coach queue — those have no
 * catalogue entry, so without it the link 404s for everyone but the owner.
 */
export async function enrolmentBySlug(projectSlug: string) {
  return safe(async () => {
    const [row] = await db()
      .select()
      .from(enrolments)
      .where(eq(enrolments.projectSlug, projectSlug))
      .limit(1);
    return row ?? null;
  }, null as EnrolmentRow | null);
}

// ── Attendance ──────────────────────────────────────────────────────────────

export type AttendanceTally = {
  present: number; late: number; excused: number; absent: number; marked: number;
};

const EMPTY_TALLY: AttendanceTally = {
  present: 0, late: 0, excused: 0, absent: 0, marked: 0,
};

/**
 * A student's own record. Counts for the dashboard, plus the sessions
 * themselves — a number you cannot see the workings of is a number you
 * cannot dispute with your coach.
 */
export async function myAttendance(userId: string) {
  return safe(async () => {
    const rows = await db()
      .select({
        status: attendance.status,
        note: attendance.note,
        markedByName: attendance.markedByName,
        date: attendanceSessions.date,
        title: attendanceSessions.title,
      })
      .from(attendance)
      .innerJoin(attendanceSessions, eq(attendance.sessionId, attendanceSessions.id))
      .where(eq(attendance.userId, userId))
      .orderBy(desc(attendanceSessions.date));

    const tally = { ...EMPTY_TALLY };
    for (const row of rows) {
      tally[row.status] += 1;
      tally.marked += 1;
    }
    return { tally, sessions: rows };
  }, { tally: { ...EMPTY_TALLY }, sessions: [] as {
    status: AttendanceStatus; note: string; markedByName: string;
    date: string; title: string;
  }[] });
}

/** Every session, newest first, with how much of the register is filled in. */
export async function attendanceSessionList() {
  return safe(async () => {
    const sessions = await db()
      .select()
      .from(attendanceSessions)
      .orderBy(desc(attendanceSessions.date), desc(attendanceSessions.createdAt));
    if (sessions.length === 0) return [];

    const counts = await db()
      .select({
        sessionId: attendance.sessionId,
        status: attendance.status,
        n: sql<number>`cast(count(*) as int)`,
      })
      .from(attendance)
      .where(inArray(attendance.sessionId, sessions.map((s) => s.id)))
      .groupBy(attendance.sessionId, attendance.status);

    const by = new Map<string, AttendanceTally>();
    for (const row of counts) {
      const tally = by.get(row.sessionId) ?? { ...EMPTY_TALLY };
      tally[row.status] += row.n;
      tally.marked += row.n;
      by.set(row.sessionId, tally);
    }
    return sessions.map((s) => ({ ...s, tally: by.get(s.id) ?? { ...EMPTY_TALLY } }));
  }, [] as (typeof attendanceSessions.$inferSelect & { tally: AttendanceTally })[]);
}

/**
 * One session's register: every active student, with their mark if they have
 * one. Unmarked is a real state, not a silent "present" — a coach who opens a
 * register and closes it again has not marked anybody.
 */
export async function attendanceRegister(sessionId: string) {
  return safe(async () => {
    const [session] = await db()
      .select()
      .from(attendanceSessions)
      .where(eq(attendanceSessions.id, sessionId))
      .limit(1);
    if (!session) return null;

    const roster = await db()
      .select({
        userId: users.id,
        name: users.name,
        email: users.email,
        grade: users.grade,
        status: attendance.status,
        note: attendance.note,
        markedByName: attendance.markedByName,
      })
      .from(users)
      .leftJoin(
        attendance,
        and(eq(attendance.userId, users.id), eq(attendance.sessionId, sessionId)),
      )
      .where(and(eq(users.role, "student"), eq(users.active, true)))
      .orderBy(asc(users.name));

    return { session, roster };
  }, null as {
    session: typeof attendanceSessions.$inferSelect;
    roster: {
      userId: string; name: string | null; email: string; grade: string | null;
      status: AttendanceStatus | null; note: string | null; markedByName: string | null;
    }[];
  } | null);
}
