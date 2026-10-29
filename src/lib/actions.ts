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
  enrolments,
  projectIdeas,
  users,
  type AttendanceStatus,
} from "@/db/schema";

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

/**
 * Resolves the coach a student picked. The id comes off a form, so it is
 * checked here rather than trusted: it has to be a real, active coach. The
 * name is stored alongside it so the record still reads properly if the
 * account is later archived or removed.
 */
async function assignedCoach(coachId: unknown) {
  const id = z.string().trim().max(60).parse(coachId ?? "");
  if (!id) return { coachId: null, coachName: "" };

  const [coach] = await db()
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(and(eq(users.id, id), eq(users.role, "coach"), eq(users.active, true)))
    .limit(1);
  if (!coach) throw new Error("Pick a coach from the list.");

  return { coachId: coach.id, coachName: coach.name ?? coach.email };
}

/**
 * Leaving a project.
 *
 * An unapproved proposal is an abandoned draft, so it goes. Once a coach has
 * approved it, somebody else has spent time on it: the project leaves the
 * dashboard but the record, and the reason, survive.
 */
export async function leaveProject(enrolmentId: string, formData?: FormData) {
  const row = await ownedEnrolment(enrolmentId);

  if (!row.approvedAt) {
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
  // The owner holds a student account but still runs the Accounts page.
  if (actor.role === "student" && !canManageUsers(actor)) {
    throw new Error("Only a coach can change a student's phase.");
  }

  await db().update(users).set({ phase }).where(eq(users.id, userId));
  revalidatePath("/admin/users");
  revalidatePath("/profile");
}

/** Archives a leaver without deleting their record, or brings one back. */
export async function setActive(userId: string, active: boolean) {
  const actor = await requireAccountManager();
  // Archiving yourself locks you out of the page that could undo it.
  if (userId === actor.id) throw new Error("You cannot archive your own account.");

  await db().update(users).set({ active }).where(eq(users.id, userId));
  revalidatePath("/admin/users");
}

// --- Create: the Impact Proposal and its approval gate --------------------

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
  // Optional: a working title alone is enough to get started.
  const summary = z.string().trim().max(300).parse(formData.get("summary") ?? "");
  const coach = await assignedCoach(formData.get("coachId"));

  // Own-idea projects get a slug that cannot collide with a catalogue entry.
  const slug = `own-${user.id.slice(0, 8)}-${Date.now().toString(36)}`;
  await db().insert(enrolments).values({
    userId: user.id, projectSlug: slug, ownTitle: title, ownSummary: summary,
    role: user.role === "student" ? "member" : "lead",
    ...coach,
  });

  revalidatePath("/dashboard");
  revalidatePath("/coach");
  return slug;
}

/**
 * Puts an idea on the noticeboard instead of starting it. No coach, because
 * nobody has taken it on — it is a suggestion, not a commitment.
 */
export async function addProjectIdea(formData: FormData) {
  const user = await requireUser();
  const title = z.string().trim().min(3, "Give the idea a title.").max(120).parse(formData.get("title"));
  const summary = z.string().trim().max(2000).parse(formData.get("summary") ?? "");

  await db().insert(projectIdeas).values({
    title, summary,
    suggestedById: user.id,
    suggestedByName: user.name ?? user.email ?? "Someone",
  });

  revalidatePath("/projects");
}

/** Taking an idea down. Yours, or anyone's if you are staff. */
export async function removeProjectIdea(ideaId: string) {
  const user = await requireUser();
  const id = z.string().trim().max(60).parse(ideaId);

  const [idea] = await db()
    .select({ suggestedById: projectIdeas.suggestedById })
    .from(projectIdeas)
    .where(eq(projectIdeas.id, id))
    .limit(1);
  if (!idea) throw new Error("That idea is already gone.");

  if (idea.suggestedById !== user.id && user.role === "student") {
    throw new Error("That is not your idea to remove.");
  }

  await db().delete(projectIdeas).where(eq(projectIdeas.id, id));
  revalidatePath("/projects");
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
  await db().update(enrolments)
    .set({ ...values, returnedComment: "", returnedAt: null })
    .where(eq(enrolments.id, row.id));
  revalidatePath(`/projects/${row.projectSlug}`);
}

/** Sends the proposal to a coach, who approves it or sends it back. */
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
  return { email: input.email, password, generated: !chosen };
}

/** Changes what someone can do. Not to yourself — that is how you get locked out. */
export async function setRole(userId: string, role: (typeof ROLES)[number]) {
  const actor = await requireAccountManager();
  if (userId === actor.id) throw new Error("You cannot change your own role.");

  await db().update(users).set({ role: z.enum(ROLES).parse(role) }).where(eq(users.id, userId));
  revalidatePath("/admin/users");
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
