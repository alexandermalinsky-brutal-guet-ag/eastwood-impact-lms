import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";

import { db, isDatabaseConfigured } from "@/db";
import {
  criteria,
  enrolments,
  evidence,
  helpRequests,
  milestones,
  reflections,
  scorecards,
  tasks,
  users,
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

export async function enrolmentDetail(enrolmentId: string) {
  return safe(
    async () => ({
      tasks: await db()
        .select()
        .from(tasks)
        .where(eq(tasks.enrolmentId, enrolmentId))
        .orderBy(asc(tasks.position)),
      criteria: await db()
        .select()
        .from(criteria)
        .where(eq(criteria.enrolmentId, enrolmentId))
        .orderBy(asc(criteria.position)),
      reflections: await db()
        .select()
        .from(reflections)
        .where(eq(reflections.enrolmentId, enrolmentId))
        .orderBy(asc(reflections.cycle)),
      milestones: await db()
        .select()
        .from(milestones)
        .where(eq(milestones.enrolmentId, enrolmentId))
        .orderBy(asc(milestones.position)),
      evidence: await db()
        .select()
        .from(evidence)
        .where(eq(evidence.enrolmentId, enrolmentId))
        .orderBy(desc(evidence.submittedAt)),
      help: await db()
        .select()
        .from(helpRequests)
        .where(eq(helpRequests.enrolmentId, enrolmentId))
        .orderBy(desc(helpRequests.createdAt)),
      scorecards: await db()
        .select()
        .from(scorecards)
        .where(eq(scorecards.enrolmentId, enrolmentId))
        .orderBy(desc(scorecards.createdAt)),
    }),
    {
      tasks: [] as (typeof tasks.$inferSelect)[],
      criteria: [] as (typeof criteria.$inferSelect)[],
      reflections: [] as (typeof reflections.$inferSelect)[],
      milestones: [] as (typeof milestones.$inferSelect)[],
      evidence: [] as (typeof evidence.$inferSelect)[],
      help: [] as (typeof helpRequests.$inferSelect)[],
      scorecards: [] as (typeof scorecards.$inferSelect)[],
    },
  );
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
          complete: sql<number>`cast(count(*) filter (where ${enrolments.status} = 'complete') as int)`,
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
      complete: number;
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
 * The coach's daily view: one line per student project, with everything needed
 * to decide in a minute who needs attention.
 *
 * Stalled is defined by the brief: no evidence for seven days, or a milestone
 * past its date.
 */
export async function coachBoard() {
  return safe(async () => {
    const rows = await db()
      .select({
        enrolmentId: enrolments.id,
        projectSlug: enrolments.projectSlug,
        ownTitle: enrolments.ownTitle,
        phase: enrolments.phase,
        level: enrolments.level,
        status: enrolments.status,
        submittedAt: enrolments.proposalSubmittedAt,
        approvedAt: enrolments.approvedAt,
        planValidatedAt: enrolments.planValidatedAt,
        charterSignedAt: enrolments.charterSignedAt,
        indicatorName: enrolments.indicatorName,
        indicatorCurrent: enrolments.indicatorCurrent,
        indicatorTarget: enrolments.indicatorTarget,
        studentName: users.name,
        studentEmail: users.email,
        studentPhase: users.phase,
      })
      .from(enrolments)
      .innerJoin(users, eq(enrolments.userId, users.id))
      .where(eq(users.role, "student"))
      .orderBy(asc(users.name));

    const ids = rows.map((r) => r.enrolmentId);
    if (ids.length === 0) return { rows: [], pendingEvidence: [], pendingHelp: [] };

    const lastEvidence = await db()
      .select({
        enrolmentId: evidence.enrolmentId,
        last: sql<string>`max(${evidence.submittedAt})`,
      })
      .from(evidence)
      .where(inArray(evidence.enrolmentId, ids))
      .groupBy(evidence.enrolmentId);
    const lastBy = new Map(lastEvidence.map((e) => [e.enrolmentId, e.last]));

    const openMilestones = await db()
      .select({ enrolmentId: milestones.enrolmentId, title: milestones.title, dueDate: milestones.dueDate })
      .from(milestones)
      .where(and(inArray(milestones.enrolmentId, ids), eq(milestones.done, false)))
      .orderBy(asc(milestones.position));
    const nextBy = new Map<string, { title: string; dueDate: string }>();
    for (const m of openMilestones) if (!nextBy.has(m.enrolmentId)) nextBy.set(m.enrolmentId, m);

    const pendingEvidence = await db()
      .select({
        id: evidence.id, level: evidence.level, note: evidence.note, url: evidence.url,
        value: evidence.value, submittedAt: evidence.submittedAt,
        projectSlug: enrolments.projectSlug, ownTitle: enrolments.ownTitle,
        studentName: users.name,
      })
      .from(evidence)
      .innerJoin(enrolments, eq(evidence.enrolmentId, enrolments.id))
      .innerJoin(users, eq(enrolments.userId, users.id))
      .where(eq(evidence.status, "submitted"))
      .orderBy(asc(evidence.submittedAt));

    const pendingHelp = await db()
      .select({
        id: helpRequests.id, question: helpRequests.question, createdAt: helpRequests.createdAt,
        projectSlug: enrolments.projectSlug, ownTitle: enrolments.ownTitle, studentName: users.name,
      })
      .from(helpRequests)
      .innerJoin(enrolments, eq(helpRequests.enrolmentId, enrolments.id))
      .innerJoin(users, eq(enrolments.userId, users.id))
      .where(sql`${helpRequests.answeredAt} is null`)
      .orderBy(asc(helpRequests.createdAt));

    const now = Date.now();
    const WEEK = 7 * 24 * 60 * 60 * 1000;

    return {
      rows: rows.map((r) => {
        const next = nextBy.get(r.enrolmentId) ?? null;
        const last = lastBy.get(r.enrolmentId);
        const lastDate = last ? new Date(last) : null;
        const quiet = !lastDate || now - lastDate.getTime() > WEEK;
        const overdue = Boolean(next?.dueDate && Date.parse(next.dueDate) < now);
        return {
          ...r,
          next,
          lastEvidenceAt: lastDate,
          light: (overdue || quiet ? (overdue && quiet ? "stalled" : "at-risk") : "on-track") as
            "on-track" | "at-risk" | "stalled",
        };
      }),
      pendingEvidence,
      pendingHelp,
    };
  }, { rows: [], pendingEvidence: [], pendingHelp: [] } as Awaited<ReturnType<typeof coachBoardShape>>);
}

/** Type carrier only — never called. */
declare function coachBoardShape(): Promise<{
  rows: {
    enrolmentId: string; projectSlug: string; ownTitle: string;
    phase: "create" | "plan" | "execute" | "report"; level: number;
    status: "active" | "complete" | "withdrawn";
    submittedAt: Date | null; approvedAt: Date | null; planValidatedAt: Date | null;
    charterSignedAt: Date | null;
    indicatorName: string; indicatorCurrent: string; indicatorTarget: string;
    studentName: string | null; studentEmail: string;
    studentPhase: "exploration" | "execution" | "legacy";
    next: { title: string; dueDate: string } | null;
    lastEvidenceAt: Date | null;
    light: "on-track" | "at-risk" | "stalled";
  }[];
  pendingEvidence: {
    id: string; level: number; note: string; url: string; value: string;
    submittedAt: Date; projectSlug: string; ownTitle: string; studentName: string | null;
  }[];
  pendingHelp: {
    id: string; question: string; createdAt: Date;
    projectSlug: string; ownTitle: string; studentName: string | null;
  }[];
}>;

/** Proposals sitting in the approval queue. */
export async function proposalsAwaitingReview() {
  return safe(() =>
    db()
      .select({
        enrolmentId: enrolments.id, projectSlug: enrolments.projectSlug,
        ownTitle: enrolments.ownTitle, problem: enrolments.problem,
        submittedAt: enrolments.proposalSubmittedAt,
        studentName: users.name,
      })
      .from(enrolments)
      .innerJoin(users, eq(enrolments.userId, users.id))
      .where(and(sql`${enrolments.proposalSubmittedAt} is not null`, sql`${enrolments.approvedAt} is null`))
      .orderBy(asc(enrolments.proposalSubmittedAt)),
    [] as { enrolmentId: string; projectSlug: string; ownTitle: string; problem: string; submittedAt: Date | null; studentName: string | null }[],
  );
}

/** Plans waiting for a coach to validate before Execute can start. */
export async function plansAwaitingReview() {
  return safe(() =>
    db()
      .select({
        enrolmentId: enrolments.id, projectSlug: enrolments.projectSlug,
        ownTitle: enrolments.ownTitle, studentName: users.name,
      })
      .from(enrolments)
      .innerJoin(users, eq(enrolments.userId, users.id))
      .where(and(eq(enrolments.phase, "plan"), sql`${enrolments.planValidatedAt} is null`, sql`${enrolments.approvedAt} is not null`))
      .orderBy(asc(enrolments.approvedAt)),
    [] as { enrolmentId: string; projectSlug: string; ownTitle: string; studentName: string | null }[],
  );
}


/** The secret in the student's calendar feed URL. */
export async function myCalendarToken(userId: string) {
  return safe(async () => {
    const [row] = await db()
      .select({ token: users.calendarToken })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return row?.token ?? null;
  }, null as string | null);
}

/** Every dated milestone across a student's projects, soonest first. */
export async function upcomingDeadlines(userId: string) {
  return safe(
    () =>
      db()
        .select({
          id: milestones.id,
          title: milestones.title,
          dueDate: milestones.dueDate,
          done: milestones.done,
          projectSlug: enrolments.projectSlug,
          ownTitle: enrolments.ownTitle,
        })
        .from(milestones)
        .innerJoin(enrolments, eq(milestones.enrolmentId, enrolments.id))
        .where(and(eq(enrolments.userId, userId), sql`${milestones.dueDate} <> ''`))
        .orderBy(asc(milestones.dueDate)),
    [] as { id: string; title: string; dueDate: string; done: boolean; projectSlug: string; ownTitle: string }[],
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
