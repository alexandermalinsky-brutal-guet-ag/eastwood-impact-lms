"use server";

import { and, asc, eq, max, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { hash } from "bcryptjs";

import { auth } from "@/auth";
import { canManageUsers } from "@/lib/access";
import { generatePassword, passwordProblem } from "@/lib/passwords";
import { db } from "@/db";
import {
  attendance,
  attendanceSessions,
  criteria,
  enrolments,
  evidence,
  helpRequests,
  milestones,
  reflections,
  scorecards,
  tasks,
  users,
  type AttendanceStatus,
} from "@/db/schema";
import { DEFAULT_CRITERIA, DEFAULT_TASKS, getProject } from "@/lib/curriculum";
import { STRANDS } from "@/lib/brand";
import { LEVEL_BY_N, MAX_LEVEL, PHASE_ORDER, type PhaseKey } from "@/lib/handbook";

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

/**
 * Leaving a project.
 *
 * Before the charter is signed there is nothing to keep — it is an abandoned
 * draft, so it goes. After it is signed the handbook is explicit that
 * withdrawals are discouraged and that a coach-led review decides, so the
 * project leaves the dashboard but the record and the reason survive.
 */
export async function leaveProject(enrolmentId: string, formData?: FormData) {
  const row = await ownedEnrolment(enrolmentId);

  if (!row.charterSignedAt) {
    await db().delete(enrolments).where(eq(enrolments.id, row.id));
  } else {
    const reason = z
      .string()
      .trim()
      .min(10, "Say what happened — your coach sees this.")
      .max(2000)
      .parse(formData?.get("reason"));

    await db()
      .update(enrolments)
      .set({ status: "withdrawn", withdrawnAt: new Date(), withdrawnReason: reason })
      .where(eq(enrolments.id, row.id));
  }

  revalidatePath(`/projects/${row.projectSlug}`);
  revalidatePath("/dashboard");
  revalidatePath("/profile");
  revalidatePath("/coach");
  redirect("/dashboard");
}

/** Brings a withdrawn project back, after a coach-led review. */
export async function rejoinProject(enrolmentId: string) {
  const row = await ownedEnrolment(enrolmentId);
  await db()
    .update(enrolments)
    .set({ status: "active", withdrawnAt: null, withdrawnReason: "" })
    .where(eq(enrolments.id, row.id));
  revalidatePath(`/projects/${row.projectSlug}`);
  revalidatePath("/dashboard");
  revalidatePath("/profile");
  revalidatePath("/coach");
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
  /** Index within the destination column; appended when omitted. */
  index?: number,
) {
  const user = await requireUser();
  const [row] = await db()
    .select({
      enrolmentId: tasks.enrolmentId,
      projectSlug: enrolments.projectSlug,
      userId: enrolments.userId,
    })
    .from(tasks)
    .innerJoin(enrolments, eq(tasks.enrolmentId, enrolments.id))
    .where(eq(tasks.id, taskId))
    .limit(1);
  if (!row) throw new Error("Task not found.");
  if (row.userId !== user.id && user.role === "student") throw new Error("Not your project.");

  // Read the destination column, drop the card in at `index`, and renumber.
  // Renumbering the whole column keeps positions dense, so repeated drags
  // cannot drift into collisions.
  const column = await db()
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.enrolmentId, row.enrolmentId), eq(tasks.status, status)))
    .orderBy(asc(tasks.position));

  const without = column.map((t) => t.id).filter((id) => id !== taskId);
  const at = index === undefined ? without.length : Math.max(0, Math.min(index, without.length));
  const ordered = [...without.slice(0, at), taskId, ...without.slice(at)];

  await Promise.all(
    ordered.map((id, i) =>
      db()
        .update(tasks)
        .set(id === taskId ? { status, position: i } : { position: i })
        .where(eq(tasks.id, id)),
    ),
  );

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


// --- Student profiles ------------------------------------------------------

/**
 * Moves a student to a different phase of the programme. This is a coach's
 * judgement about demonstrated readiness, not an automatic consequence of the
 * student's year group — so it is deliberately a manual action, and students
 * cannot do it to themselves.
 */
export async function setPhase(
  userId: string,
  phase: "exploration" | "execution" | "legacy",
) {
  const actor = await requireUser();
  if (actor.role === "student") {
    throw new Error("Only a coach can change a student's phase.");
  }

  await db().update(users).set({ phase }).where(eq(users.id, userId));
  revalidatePath("/staff");
  revalidatePath("/profile");
}

/** Archives a leaver without deleting their record, or brings one back. */
export async function setActive(userId: string, active: boolean) {
  const actor = await requireAccountManager();
  // Archiving yourself locks you out of the page that could undo it.
  if (userId === actor.id) throw new Error("You cannot archive your own account.");

  await db().update(users).set({ active }).where(eq(users.id, userId));
  revalidatePath("/staff");
  revalidatePath("/admin/users");
}

// --- Release 1: Create, Plan, and the level map ----------------------------

/** A coach or admin acting on a student's project. */
/** Lets a coach act on an enrolment they do not own. */
async function ownedOrCoached(enrolmentId: string) {
  const user = await requireUser();
  const [row] = await db()
    .select()
    .from(enrolments)
    .where(eq(enrolments.id, enrolmentId))
    .limit(1);
  if (!row) throw new Error("Enrolment not found.");
  if (row.userId !== user.id && user.role === "student") throw new Error("Not your project.");
  return row;
}

async function asCoach() {
  const user = await requireUser();
  if (user.role === "student") throw new Error("Only a coach can do that.");
  return user;
}

const coachName = (u: { name?: string | null; email?: string | null }) =>
  u.name ?? u.email ?? "A coach";

/** Starts a project from the student's own idea rather than the catalogue. */
export async function startOwnProject(formData: FormData) {
  const user = await requireUser();
  const title = z.string().trim().min(3).max(120).parse(formData.get("title"));

  // Own-idea projects get a slug that cannot collide with a catalogue entry.
  const slug = `own-${user.id.slice(0, 8)}-${Date.now().toString(36)}`;
  const [created] = await db()
    .insert(enrolments)
    .values({
      userId: user.id, projectSlug: slug, ownTitle: title, fromCatalogue: false,
      role: user.role === "student" ? "member" : "lead",
    })
    .returning({ id: enrolments.id });

  await db().insert(criteria).values(
    DEFAULT_CRITERIA.map((label, position) => ({ enrolmentId: created.id, label, position })),
  );
  revalidatePath("/dashboard");
  return slug;
}

const proposalSchema = z.object({
  problem: z.string().max(400), whoAffected: z.string().max(400),
  whatChanges: z.string().max(400), deliverable: z.string().max(400),
  skills: z.string().max(400), needs: z.string().max(400), risk: z.string().max(400),
  indicatorName: z.string().max(200), indicatorBaseline: z.string().max(100),
  indicatorTarget: z.string().max(100),
});

export async function saveImpactProposal(enrolmentId: string, formData: FormData) {
  const row = await ownedEnrolment(enrolmentId);
  const values = proposalSchema.parse(
    Object.fromEntries(
      Object.keys(proposalSchema.shape).map((k) => [k, String(formData.get(k) ?? "")]),
    ),
  );
  const strands = formData.getAll("targetStrands").map(String);

  await db().update(enrolments)
    .set({ ...values, targetStrands: strands, returnedComment: "", returnedAt: null })
    .where(eq(enrolments.id, row.id));
  revalidatePath(`/projects/${row.projectSlug}`);
}

/** Sends the proposal to a coach. Level 2 cannot unlock without this. */
export async function submitProposal(enrolmentId: string) {
  const row = await ownedEnrolment(enrolmentId);
  if (!row.problem.trim() || !row.indicatorTarget.trim()) {
    throw new Error("A proposal needs at least the problem and a target before it can be submitted.");
  }
  await db().update(enrolments)
    .set({ proposalSubmittedAt: new Date(), returnedComment: "", returnedAt: null })
    .where(eq(enrolments.id, row.id));
  revalidatePath(`/projects/${row.projectSlug}`);
  revalidatePath("/coach");
}

/** Approving records the coach's name, not just a date (brief, section 8). */
export async function approveProposal(enrolmentId: string) {
  const coach = await asCoach();
  const [row] = await db().select().from(enrolments).where(eq(enrolments.id, enrolmentId)).limit(1);
  if (!row) throw new Error("Project not found.");

  await db().update(enrolments).set({
    approvedAt: new Date(), approvedBy: coach.id, approvedByName: coachName(coach),
    leadCoachId: row.leadCoachId ?? coach.id,
    phase: "plan", level: Math.max(row.level, 3),
    returnedComment: "", returnedAt: null,
  }).where(eq(enrolments.id, enrolmentId));

  revalidatePath(`/projects/${row.projectSlug}`);
  revalidatePath("/coach");
}

/** Returning is not a rejection — the student revises and resubmits. */
export async function returnProposal(enrolmentId: string, formData: FormData) {
  const coach = await asCoach();
  const comment = z.string().trim().min(1).max(2000).parse(formData.get("comment"));
  const [row] = await db().select({ projectSlug: enrolments.projectSlug })
    .from(enrolments).where(eq(enrolments.id, enrolmentId)).limit(1);
  if (!row) throw new Error("Project not found.");

  await db().update(enrolments).set({
    proposalSubmittedAt: null, returnedComment: `${coachName(coach)}: ${comment}`, returnedAt: new Date(),
  }).where(eq(enrolments.id, enrolmentId));
  revalidatePath(`/projects/${row.projectSlug}`);
  revalidatePath("/coach");
}

export async function validatePlan(enrolmentId: string) {
  const coach = await asCoach();
  const [row] = await db().select().from(enrolments).where(eq(enrolments.id, enrolmentId)).limit(1);
  if (!row) throw new Error("Project not found.");

  const ms = await db().select({ id: milestones.id }).from(milestones).where(eq(milestones.enrolmentId, enrolmentId));
  if (ms.length < 3) throw new Error("A plan needs at least three dated milestones before it can be validated.");

  await db().update(enrolments).set({
    planValidatedAt: new Date(), planValidatedByName: coachName(coach),
    phase: "execute", level: Math.max(row.level, 4),
  }).where(eq(enrolments.id, enrolmentId));
  revalidatePath(`/projects/${row.projectSlug}`);
  revalidatePath("/coach");
}

export async function signCharterNamed(enrolmentId: string) {
  const user = await requireUser();
  const row = await ownedEnrolment(enrolmentId);
  if (!row.approvedAt) throw new Error("The proposal has not been approved yet.");
  await db().update(enrolments)
    .set({ charterSignedAt: new Date(), charterSignedByName: coachName(user) })
    .where(eq(enrolments.id, row.id));
  revalidatePath(`/projects/${row.projectSlug}`);
}

// --- Milestones ------------------------------------------------------------

export async function addMilestone(enrolmentId: string, formData: FormData) {
  const row = await ownedEnrolment(enrolmentId);
  const title = z.string().trim().min(1).max(200).parse(formData.get("title"));
  const dueDate = z.string().max(40).parse(formData.get("dueDate") ?? "");

  const [{ value }] = await db().select({ value: max(milestones.position) })
    .from(milestones).where(eq(milestones.enrolmentId, row.id));
  await db().insert(milestones).values({
    enrolmentId: row.id, title, dueDate, position: (value ?? 0) + 1,
  });
  // The board is pre-filled from the milestones, so nobody starts on an empty Kanban.
  await db().insert(tasks).values({
    enrolmentId: row.id, title, status: "backlog", position: (value ?? 0) + 1,
  });
  revalidatePath(`/projects/${row.projectSlug}`);
}

export async function toggleMilestone(milestoneId: string, done: boolean) {
  const user = await requireUser();
  const [row] = await db()
    .select({ projectSlug: enrolments.projectSlug, userId: enrolments.userId })
    .from(milestones).innerJoin(enrolments, eq(milestones.enrolmentId, enrolments.id))
    .where(eq(milestones.id, milestoneId)).limit(1);
  if (!row) throw new Error("Milestone not found.");
  if (row.userId !== user.id && user.role === "student") throw new Error("Not your project.");

  await db().update(milestones).set({ done }).where(eq(milestones.id, milestoneId));
  revalidatePath(`/projects/${row.projectSlug}`);
}

export async function deleteMilestone(milestoneId: string) {
  const user = await requireUser();
  const [row] = await db()
    .select({ projectSlug: enrolments.projectSlug, userId: enrolments.userId })
    .from(milestones).innerJoin(enrolments, eq(milestones.enrolmentId, enrolments.id))
    .where(eq(milestones.id, milestoneId)).limit(1);
  if (!row) throw new Error("Milestone not found.");
  if (row.userId !== user.id && user.role === "student") throw new Error("Not your project.");

  await db().delete(milestones).where(eq(milestones.id, milestoneId));
  revalidatePath(`/projects/${row.projectSlug}`);
}

// --- Evidence and the level map -------------------------------------------

/** Evidence unlocks levels — not activity, and never points for logging in. */
export async function submitEvidence(enrolmentId: string, formData: FormData) {
  const row = await ownedEnrolment(enrolmentId);
  const level = z.coerce.number().int().min(1).max(MAX_LEVEL).parse(formData.get("level"));
  const note = z.string().trim().min(1).max(2000).parse(formData.get("note"));

  await db().insert(evidence).values({
    enrolmentId: row.id, level, note,
    url: String(formData.get("url") ?? "").slice(0, 500),
    value: String(formData.get("value") ?? "").slice(0, 100),
  });
  revalidatePath(`/projects/${row.projectSlug}`);
  revalidatePath("/coach");
}

/** Validating evidence is what moves a student up the map. */
export async function reviewEvidence(
  evidenceId: string,
  decision: "validated" | "returned",
  formData?: FormData,
) {
  const coach = await asCoach();
  const [row] = await db()
    .select({
      id: evidence.id, level: evidence.level, enrolmentId: evidence.enrolmentId,
      projectSlug: enrolments.projectSlug, currentLevel: enrolments.level,
    })
    .from(evidence).innerJoin(enrolments, eq(evidence.enrolmentId, enrolments.id))
    .where(eq(evidence.id, evidenceId)).limit(1);
  if (!row) throw new Error("Evidence not found.");

  await db().update(evidence).set({
    status: decision, reviewedAt: new Date(), reviewedByName: coachName(coach),
    reviewComment: String(formData?.get("comment") ?? "").slice(0, 2000),
  }).where(eq(evidence.id, evidenceId));

  if (decision === "validated" && row.level >= row.currentLevel) {
    const next = Math.min(row.level + 1, MAX_LEVEL);
    const level = LEVEL_BY_N.get(next);
    await db().update(enrolments)
      .set({ level: next, ...(level ? { phase: level.phase } : {}) })
      .where(eq(enrolments.id, row.enrolmentId));
  }
  revalidatePath(`/projects/${row.projectSlug}`);
  revalidatePath("/coach");
}

export async function updateIndicator(enrolmentId: string, formData: FormData) {
  const row = await ownedEnrolment(enrolmentId);
  const current = z.string().trim().max(100).parse(formData.get("indicatorCurrent"));
  await db().update(enrolments).set({ indicatorCurrent: current }).where(eq(enrolments.id, row.id));
  revalidatePath(`/projects/${row.projectSlug}`);
}

// --- Asking a coach --------------------------------------------------------

export async function askCoach(enrolmentId: string, formData: FormData) {
  const row = await ownedEnrolment(enrolmentId);
  const question = z.string().trim().min(3).max(1000).parse(formData.get("question"));
  await db().insert(helpRequests).values({ enrolmentId: row.id, question });
  revalidatePath(`/projects/${row.projectSlug}`);
  revalidatePath("/coach");
}

export async function answerHelpRequest(requestId: string, formData: FormData) {
  const coach = await asCoach();
  const answer = z.string().trim().min(1).max(2000).parse(formData.get("answer"));
  const [row] = await db()
    .select({ projectSlug: enrolments.projectSlug })
    .from(helpRequests).innerJoin(enrolments, eq(helpRequests.enrolmentId, enrolments.id))
    .where(eq(helpRequests.id, requestId)).limit(1);
  if (!row) throw new Error("Request not found.");

  await db().update(helpRequests)
    .set({ answer, answeredByName: coachName(coach), answeredAt: new Date() })
    .where(eq(helpRequests.id, requestId));
  revalidatePath(`/projects/${row.projectSlug}`);
  revalidatePath("/coach");
}

/** Completing is only possible from Report, after the final level is validated. */
export async function markComplete(enrolmentId: string) {
  const row = await ownedEnrolment(enrolmentId);
  if (row.phase !== "report" || row.level < MAX_LEVEL) {
    throw new Error("A project can only be completed from Report, once the final level is validated.");
  }
  await db().update(enrolments)
    .set({ status: "complete", completedAt: new Date() })
    .where(eq(enrolments.id, row.id));
  revalidatePath(`/projects/${row.projectSlug}`);
  revalidatePath("/dashboard");
}


/** Opens the next Plan - Act - Reflect cycle. */
export async function startNextCycle(enrolmentId: string) {
  const row = await ownedEnrolment(enrolmentId);
  const existing = await db()
    .select({ cycle: reflections.cycle })
    .from(reflections)
    .where(eq(reflections.enrolmentId, row.id));
  const next = existing.length ? Math.max(...existing.map((r) => r.cycle)) + 1 : 1;
  await db().insert(reflections).values({ enrolmentId: row.id, cycle: next });
  revalidatePath(`/projects/${row.projectSlug}`);
}

// ── Attendance ──────────────────────────────────────────────────────────────

const ATTENDANCE_STATUSES = ["present", "late", "excused", "absent"] as const;
const statusSchema = z.enum(ATTENDANCE_STATUSES);
/** "2026-10-28" — a register belongs to a day, not a moment. */
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date.");

/** Opens a register for one of the weekly structured work sessions. */
export async function createAttendanceSession(formData: FormData) {
  const coach = await asCoach();
  const date = dateSchema.parse(formData.get("date"));
  const title = z.string().trim().max(120).parse(formData.get("title") ?? "");

  const [created] = await db()
    .insert(attendanceSessions)
    .values({ date, title, createdByName: coachName(coach) })
    .returning({ id: attendanceSessions.id });

  revalidatePath("/attendance");
  redirect(`/attendance/${created.id}`);
}

/** Marks one student, or changes a mark already made. */
export async function markAttendance(
  sessionId: string,
  userId: string,
  status: AttendanceStatus,
  note = "",
) {
  const coach = await asCoach();
  const value = statusSchema.parse(status);
  const comment = z.string().trim().max(500).parse(note);

  await db()
    .insert(attendance)
    .values({
      sessionId, userId, status: value, note: comment,
      markedByName: coachName(coach), markedAt: new Date(),
    })
    // Re-marking is an edit, not a second row: the unique index decides.
    .onConflictDoUpdate({
      target: [attendance.sessionId, attendance.userId],
      set: {
        status: value, note: comment,
        markedByName: coachName(coach), markedAt: new Date(),
      },
    });

  revalidatePath(`/attendance/${sessionId}`);
  revalidatePath("/attendance");
  revalidatePath("/dashboard");
}

/**
 * Fills in everyone still unmarked as present. A register of 25 should not
 * take 25 clicks — but this writes real rows with the coach's name on them,
 * so "present" is always something somebody actually said.
 */
export async function markRestPresent(sessionId: string) {
  const coach = await asCoach();

  const unmarked = await db()
    .select({ id: users.id })
    .from(users)
    .leftJoin(
      attendance,
      and(eq(attendance.userId, users.id), eq(attendance.sessionId, sessionId)),
    )
    .where(and(
      eq(users.role, "student"),
      eq(users.active, true),
      sql`${attendance.id} is null`,
    ));

  if (unmarked.length > 0) {
    await db().insert(attendance).values(
      unmarked.map((u) => ({
        sessionId, userId: u.id, status: "present" as const,
        markedByName: coachName(coach), markedAt: new Date(),
      })),
    );
  }

  revalidatePath(`/attendance/${sessionId}`);
  revalidatePath("/attendance");
  revalidatePath("/dashboard");
}

/** Removes a register opened by mistake, and every mark on it. */
export async function deleteAttendanceSession(sessionId: string) {
  await asCoach();
  await db().delete(attendanceSessions).where(eq(attendanceSessions.id, sessionId));
  revalidatePath("/attendance");
  revalidatePath("/dashboard");
  redirect("/attendance");
}

// ── Accounts ────────────────────────────────────────────────────────────────

async function requireAccountManager() {
  const user = await requireUser();
  if (!canManageUsers(user)) throw new Error("Not allowed to manage accounts.");
  return user;
}

const ROLES = ["student", "coach", "admin"] as const;
const PHASES = ["exploration", "execution", "legacy"] as const;

const newUserSchema = z.object({
  email: z.string().trim().toLowerCase().email("That is not an email address.").max(200),
  name: z.string().trim().min(1, "Give them a name.").max(120),
  role: z.enum(ROLES),
  grade: z.string().trim().max(10),
  phase: z.enum(PHASES),
  password: z.string().max(200),
});

/**
 * Creates an account and returns its password once, for the admin to hand
 * over. The plaintext is never stored and never logged — the hash goes to the
 * database and the string goes back up the wire to the person who asked for
 * it, and nowhere else.
 */
export async function createUser(formData: FormData) {
  await requireAccountManager();

  const input = newUserSchema.parse({
    email: formData.get("email"),
    name: formData.get("name"),
    role: formData.get("role"),
    grade: formData.get("grade") ?? "",
    phase: formData.get("phase") ?? "exploration",
    password: formData.get("password") ?? "",
  });

  const [existing] = await db()
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);
  if (existing) throw new Error(`${input.email} already has an account.`);

  const chosen = input.password.trim();
  if (chosen) {
    const problem = passwordProblem(chosen);
    if (problem) throw new Error(problem);
  }
  const password = chosen || generatePassword();

  await db().insert(users).values({
    email: input.email,
    name: input.name,
    role: input.role,
    passwordHash: await hash(password, 10),
    grade: input.role === "student" ? input.grade || null : null,
    phase: input.phase,
    academicYear: process.env.ACADEMIC_YEAR ?? "2026/27",
  });

  revalidatePath("/admin/users");
  revalidatePath("/staff");
  return { email: input.email, password, generated: !chosen };
}

/** Changes what someone can do. Not to yourself — that is how you get locked out. */
export async function setRole(userId: string, role: (typeof ROLES)[number]) {
  const actor = await requireAccountManager();
  if (userId === actor.id) throw new Error("You cannot change your own role.");

  await db().update(users).set({ role: z.enum(ROLES).parse(role) }).where(eq(users.id, userId));
  revalidatePath("/admin/users");
  revalidatePath("/staff");
}

/** Issues a new password and hands it back once. Does not email anyone. */
export async function resetPassword(userId: string) {
  await requireAccountManager();
  const password = generatePassword();

  const [row] = await db()
    .update(users)
    .set({ passwordHash: await hash(password, 10) })
    .where(eq(users.id, userId))
    .returning({ email: users.email });
  if (!row) throw new Error("Account not found.");

  return { email: row.email, password, generated: true };
}
