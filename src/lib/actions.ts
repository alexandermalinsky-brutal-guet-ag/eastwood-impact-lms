"use server";

import { and, asc, eq, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/db";
import {
  criteria,
  enrolments,
  goals,
  reflections,
  scorecards,
  tasks,
} from "@/db/schema";
import { DEFAULT_CRITERIA, DEFAULT_TASKS, getProject } from "@/lib/curriculum";
import { STRANDS } from "@/lib/brand";
import { STAGE_ORDER, type StageKey } from "@/lib/handbook";

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


// --- The IMPACT Journey ----------------------------------------------------

const STRAND_NAMES = STRANDS.map((s) => s.name);

/**
 * A coach or admin may move a project to any stage; a student may only move
 * forward, and only out of stages whose deliverable actually exists. Stage 2 is
 * the approval gate, so a student can never move themselves into it.
 */
export async function setStage(enrolmentId: string, stage: StageKey) {
  const user = await requireUser();
  const row = await ownedOrCoached(enrolmentId);

  if (user.role === "student") {
    const from = STAGE_ORDER.indexOf(row.stage);
    const to = STAGE_ORDER.indexOf(stage);
    if (to !== from + 1) {
      throw new Error("You can only move to the next stage.");
    }
    if (stage === "execution" && !row.approvedAt) {
      throw new Error("A coach has to approve the proposal first.");
    }
    if (stage === "execution" && !row.charterSignedAt) {
      throw new Error("Sign the Commitment Charter before starting execution.");
    }
  }

  await db().update(enrolments).set({ stage }).where(eq(enrolments.id, row.id));
  revalidatePath(`/projects/${row.projectSlug}`);
  revalidatePath("/dashboard");
}

/** Lets a coach act on an enrolment they do not own. */
async function ownedOrCoached(enrolmentId: string) {
  const user = await requireUser();
  const [row] = await db()
    .select()
    .from(enrolments)
    .where(eq(enrolments.id, enrolmentId))
    .limit(1);

  if (!row) throw new Error("Enrolment not found.");
  if (row.userId !== user.id && user.role === "student") {
    throw new Error("Not your project.");
  }
  return row;
}

const proposalSchema = z.object({
  proposalIdea: z.string().max(4000),
  proposalInternalImpact: z.string().max(4000),
  proposalExternalImpact: z.string().max(4000),
  proposalFeasibility: z.string().max(4000),
  projectType: z.enum(["internal", "external", "internal-to-external"]),
});

export async function saveProposal(enrolmentId: string, formData: FormData) {
  const row = await ownedEnrolment(enrolmentId);

  const values = proposalSchema.parse({
    proposalIdea: String(formData.get("proposalIdea") ?? ""),
    proposalInternalImpact: String(formData.get("proposalInternalImpact") ?? ""),
    proposalExternalImpact: String(formData.get("proposalExternalImpact") ?? ""),
    proposalFeasibility: String(formData.get("proposalFeasibility") ?? ""),
    projectType: String(formData.get("projectType") ?? "internal"),
  });

  // The handbook expects a project to target several strands, chosen here
  // rather than inherited from whatever the planning workbook happened to say.
  const targetStrands = formData
    .getAll("targetStrands")
    .map(String)
    .filter((name) => STRAND_NAMES.includes(name as (typeof STRAND_NAMES)[number]));

  await db()
    .update(enrolments)
    .set({ ...values, targetStrands, proposalSubmittedAt: new Date() })
    .where(eq(enrolments.id, row.id));

  revalidatePath(`/projects/${row.projectSlug}`);
}

/** Stage 2 approval. Coaches and admins only — this is the gate. */
export async function approveProposal(enrolmentId: string) {
  const user = await requireUser();
  if (user.role === "student") throw new Error("Only a coach can approve a proposal.");

  const [row] = await db()
    .select({ id: enrolments.id, projectSlug: enrolments.projectSlug })
    .from(enrolments)
    .where(eq(enrolments.id, enrolmentId))
    .limit(1);
  if (!row) throw new Error("Enrolment not found.");

  await db()
    .update(enrolments)
    .set({
      approvedAt: new Date(),
      approvedBy: user.id,
      leadCoachId: user.id,
      stage: "commitment",
    })
    .where(eq(enrolments.id, row.id));

  revalidatePath(`/projects/${row.projectSlug}`);
  revalidatePath("/staff");
}

/**
 * Signing the Commitment Charter — formally agreeing to see the project through
 * unless a coach-led review determines a pivot is necessary.
 */
export async function signCharter(enrolmentId: string) {
  const row = await ownedEnrolment(enrolmentId);
  if (!row.approvedAt) throw new Error("The proposal has not been approved yet.");

  await db()
    .update(enrolments)
    .set({ charterSignedAt: new Date() })
    .where(eq(enrolments.id, row.id));
  revalidatePath(`/projects/${row.projectSlug}`);
}

// --- SMART goals -----------------------------------------------------------

const goalSchema = z.object({
  kind: z.enum(["deliverable", "milestone", "qualitative"]),
  statement: z.string().trim().min(1).max(300),
  measure: z.string().max(300),
  dueBy: z.string().max(100),
});

export async function addGoal(enrolmentId: string, formData: FormData) {
  const row = await ownedOrCoached(enrolmentId);
  const values = goalSchema.parse({
    kind: String(formData.get("kind") ?? "deliverable"),
    statement: String(formData.get("statement") ?? ""),
    measure: String(formData.get("measure") ?? ""),
    dueBy: String(formData.get("dueBy") ?? ""),
  });

  const [{ value }] = await db()
    .select({ value: max(goals.position) })
    .from(goals)
    .where(eq(goals.enrolmentId, row.id));

  await db()
    .insert(goals)
    .values({ ...values, enrolmentId: row.id, position: (value ?? 0) + 1 });
  revalidatePath(`/projects/${row.projectSlug}`);
}

export async function setGoalProgress(goalId: string, progress: number) {
  const user = await requireUser();
  const [row] = await db()
    .select({ projectSlug: enrolments.projectSlug, userId: enrolments.userId })
    .from(goals)
    .innerJoin(enrolments, eq(goals.enrolmentId, enrolments.id))
    .where(eq(goals.id, goalId))
    .limit(1);
  if (!row) throw new Error("Goal not found.");
  if (row.userId !== user.id && user.role === "student") {
    throw new Error("Not your project.");
  }

  const clamped = Math.min(100, Math.max(0, Math.round(progress)));
  await db()
    .update(goals)
    .set({ progress: clamped, achieved: clamped >= 100 })
    .where(eq(goals.id, goalId));
  revalidatePath(`/projects/${row.projectSlug}`);
}

export async function deleteGoal(goalId: string) {
  const user = await requireUser();
  const [row] = await db()
    .select({ projectSlug: enrolments.projectSlug, userId: enrolments.userId })
    .from(goals)
    .innerJoin(enrolments, eq(goals.enrolmentId, enrolments.id))
    .where(eq(goals.id, goalId))
    .limit(1);
  if (!row) throw new Error("Goal not found.");
  if (row.userId !== user.id && user.role === "student") {
    throw new Error("Not your project.");
  }

  await db().delete(goals).where(eq(goals.id, goalId));
  revalidatePath(`/projects/${row.projectSlug}`);
}

// --- Scorecards ------------------------------------------------------------

/**
 * Collects `rating.<key>` and `note.<key>` fields into two JSON maps. A student
 * may only write a student scorecard; only a coach may write a coach one.
 */
export async function saveScorecard(
  enrolmentId: string,
  kind: "student" | "coach",
  formData: FormData,
) {
  const user = await requireUser();
  const row = await ownedOrCoached(enrolmentId);

  if (kind === "coach" && user.role === "student") {
    throw new Error("Only a coach can complete a Coach Scorecard.");
  }
  if (kind === "student" && row.userId !== user.id) {
    throw new Error("A student scorecard is written by the student.");
  }

  const ratings: Record<string, number> = {};
  const notes: Record<string, string> = {};

  for (const [field, value] of formData.entries()) {
    if (field.startsWith("rating.")) {
      const score = Number(value);
      if (Number.isFinite(score) && score >= 1 && score <= 5) {
        ratings[field.slice(7)] = score;
      }
    } else if (field.startsWith("note.")) {
      notes[field.slice(5)] = String(value).slice(0, 2000);
    }
  }

  await db().insert(scorecards).values({
    enrolmentId: row.id,
    kind,
    authorId: user.id,
    ratings: JSON.stringify(ratings),
    notes: JSON.stringify(notes),
    comment: String(formData.get("comment") ?? "").slice(0, 4000),
    periodLabel: String(formData.get("periodLabel") ?? "").slice(0, 60),
  });

  revalidatePath(`/projects/${row.projectSlug}`);
  revalidatePath("/profile");
}
