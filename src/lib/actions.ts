"use server";

import { and, asc, eq, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/db";
import { criteria, enrolments, reflections, tasks } from "@/db/schema";
import { DEFAULT_CRITERIA, DEFAULT_TASKS, getProject } from "@/lib/curriculum";

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in.");
  return session.user;
}

/**
 * Confirms the signed-in user owns this enrolment before any write. Every
 * mutation below funnels through here so a guessed id cannot touch someone
 * else's board.
 */
async function ownedEnrolment(enrolmentId: string) {
  const user = await requireUser();
  const [row] = await db()
    .select()
    .from(enrolments)
    .where(and(eq(enrolments.id, enrolmentId), eq(enrolments.userId, user.id)))
    .limit(1);
  if (!row) throw new Error("Enrolment not found.");
  return row;
}

const slugSchema = z.string().min(1).max(120);

export async function joinProject(projectSlug: string) {
  const user = await requireUser();
  const slug = slugSchema.parse(projectSlug);
  if (!getProject(slug)) throw new Error("Unknown project.");

  const existing = await db()
    .select({ id: enrolments.id })
    .from(enrolments)
    .where(
      and(eq(enrolments.userId, user.id), eq(enrolments.projectSlug, slug)),
    )
    .limit(1);

  if (existing.length === 0) {
    const [created] = await db()
      .insert(enrolments)
      .values({
        userId: user.id,
        projectSlug: slug,
        role: user.role === "student" ? "member" : "lead",
      })
      .returning({ id: enrolments.id });

    // Start the student off with the school's definition-of-done shape and a
    // first reflection cycle rather than an empty screen.
    await db()
      .insert(criteria)
      .values(
        DEFAULT_CRITERIA.map((label, position) => ({
          enrolmentId: created.id,
          label,
          position,
        })),
      );
    await db()
      .insert(tasks)
      .values(
        DEFAULT_TASKS.map((task, position) => ({
          enrolmentId: created.id,
          title: task.title,
          status: task.status,
          position,
        })),
      );
    await db().insert(reflections).values({ enrolmentId: created.id, cycle: 1 });
  }

  revalidatePath(`/projects/${slug}`);
  revalidatePath("/dashboard");
}

export async function leaveProject(enrolmentId: string) {
  const row = await ownedEnrolment(enrolmentId);
  await db().delete(enrolments).where(eq(enrolments.id, row.id));
  revalidatePath(`/projects/${row.projectSlug}`);
  revalidatePath("/dashboard");
}

export async function setEnrolmentStatus(
  enrolmentId: string,
  status: "active" | "complete" | "withdrawn",
) {
  const row = await ownedEnrolment(enrolmentId);
  await db()
    .update(enrolments)
    .set({ status, completedAt: status === "complete" ? new Date() : null })
    .where(eq(enrolments.id, row.id));
  revalidatePath(`/projects/${row.projectSlug}`);
  revalidatePath("/dashboard");
}

export async function addTask(enrolmentId: string, formData: FormData) {
  const row = await ownedEnrolment(enrolmentId);
  const title = z
    .string()
    .trim()
    .min(1)
    .max(200)
    .parse(formData.get("title"));

  const [{ value }] = await db()
    .select({ value: max(tasks.position) })
    .from(tasks)
    .where(eq(tasks.enrolmentId, row.id));

  await db()
    .insert(tasks)
    .values({ enrolmentId: row.id, title, position: (value ?? 0) + 1 });
  revalidatePath(`/projects/${row.projectSlug}`);
}

export async function moveTask(
  taskId: string,
  status: "backlog" | "doing" | "review" | "done",
) {
  const user = await requireUser();
  const [row] = await db()
    .select({ enrolmentId: tasks.enrolmentId, projectSlug: enrolments.projectSlug })
    .from(tasks)
    .innerJoin(enrolments, eq(tasks.enrolmentId, enrolments.id))
    .where(and(eq(tasks.id, taskId), eq(enrolments.userId, user.id)))
    .limit(1);
  if (!row) throw new Error("Task not found.");

  await db().update(tasks).set({ status }).where(eq(tasks.id, taskId));
  revalidatePath(`/projects/${row.projectSlug}`);
}

export async function deleteTask(taskId: string) {
  const user = await requireUser();
  const [row] = await db()
    .select({ projectSlug: enrolments.projectSlug })
    .from(tasks)
    .innerJoin(enrolments, eq(tasks.enrolmentId, enrolments.id))
    .where(and(eq(tasks.id, taskId), eq(enrolments.userId, user.id)))
    .limit(1);
  if (!row) throw new Error("Task not found.");

  await db().delete(tasks).where(eq(tasks.id, taskId));
  revalidatePath(`/projects/${row.projectSlug}`);
}

export async function toggleCriterion(criterionId: string, met: boolean) {
  const user = await requireUser();
  const [row] = await db()
    .select({ projectSlug: enrolments.projectSlug })
    .from(criteria)
    .innerJoin(enrolments, eq(criteria.enrolmentId, enrolments.id))
    .where(and(eq(criteria.id, criterionId), eq(enrolments.userId, user.id)))
    .limit(1);
  if (!row) throw new Error("Criterion not found.");

  await db().update(criteria).set({ met }).where(eq(criteria.id, criterionId));
  revalidatePath(`/projects/${row.projectSlug}`);
}

export async function addCriterion(enrolmentId: string, formData: FormData) {
  const row = await ownedEnrolment(enrolmentId);
  const label = z.string().trim().min(1).max(240).parse(formData.get("label"));

  const [{ value }] = await db()
    .select({ value: max(criteria.position) })
    .from(criteria)
    .where(eq(criteria.enrolmentId, row.id));

  await db()
    .insert(criteria)
    .values({ enrolmentId: row.id, label, position: (value ?? 0) + 1 });
  revalidatePath(`/projects/${row.projectSlug}`);
}

const reflectionSchema = z.object({
  plan: z.string().max(4000),
  act: z.string().max(4000),
  reflect: z.string().max(4000),
  furtherQuestion: z.string().max(1000),
});

export async function saveReflection(reflectionId: string, formData: FormData) {
  const user = await requireUser();
  const [row] = await db()
    .select({ projectSlug: enrolments.projectSlug })
    .from(reflections)
    .innerJoin(enrolments, eq(reflections.enrolmentId, enrolments.id))
    .where(and(eq(reflections.id, reflectionId), eq(enrolments.userId, user.id)))
    .limit(1);
  if (!row) throw new Error("Reflection not found.");

  const values = reflectionSchema.parse({
    plan: String(formData.get("plan") ?? ""),
    act: String(formData.get("act") ?? ""),
    reflect: String(formData.get("reflect") ?? ""),
    furtherQuestion: String(formData.get("furtherQuestion") ?? ""),
  });

  await db()
    .update(reflections)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(reflections.id, reflectionId));
  revalidatePath(`/projects/${row.projectSlug}`);
}

/** Opens the next Plan – Act – Reflect cycle on an enrolment. */
export async function startNextCycle(enrolmentId: string) {
  const row = await ownedEnrolment(enrolmentId);
  const existing = await db()
    .select({ cycle: reflections.cycle })
    .from(reflections)
    .where(eq(reflections.enrolmentId, row.id))
    .orderBy(asc(reflections.cycle));

  const next = existing.length ? Math.max(...existing.map((r) => r.cycle)) + 1 : 1;
  await db().insert(reflections).values({ enrolmentId: row.id, cycle: next });
  revalidatePath(`/projects/${row.projectSlug}`);
}
