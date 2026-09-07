import { and, asc, desc, eq, sql } from "drizzle-orm";

import { db, isDatabaseConfigured } from "@/db";
import { criteria, enrolments, reflections, tasks, users } from "@/db/schema";

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
    }),
    {
      tasks: [] as (typeof tasks.$inferSelect)[],
      criteria: [] as (typeof criteria.$inferSelect)[],
      reflections: [] as (typeof reflections.$inferSelect)[],
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
          active: sql<number>`cast(count(*) filter (where ${enrolments.status} = 'active') as int)`,
          complete: sql<number>`cast(count(*) filter (where ${enrolments.status} = 'complete') as int)`,
        })
        .from(users)
        .leftJoin(enrolments, eq(users.id, enrolments.userId))
        .groupBy(users.id, users.name, users.email, users.role)
        .orderBy(asc(users.name)),
    [] as {
      id: string;
      name: string | null;
      email: string;
      role: "student" | "coach" | "admin";
      active: number;
      complete: number;
    }[],
  );
}
