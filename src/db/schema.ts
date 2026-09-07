import {
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

/** student = takes projects · coach = staff lead · admin = curriculum team */
export type Role = "student" | "coach" | "admin";

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  /** Null for accounts that sign in with Google only. */
  passwordHash: text("passwordHash"),
  role: text("role").$type<Role>().notNull().default("student"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ],
);

/**
 * A student (or coach) signed up to a project. `role` distinguishes the person
 * running the project from the people taking part in it.
 */
export const enrolments = pgTable(
  "enrolment",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Slug from src/data/projects.json — curriculum lives in code, not the DB. */
    projectSlug: text("projectSlug").notNull(),
    role: text("role").$type<"member" | "lead">().notNull().default("member"),
    status: text("status")
      .$type<"active" | "complete" | "withdrawn">()
      .notNull()
      .default("active"),

    /** Where this project sits in the four-stage IMPACT Journey. */
    stage: text("stage")
      .$type<"ideation" | "commitment" | "execution" | "presentation">()
      .notNull()
      .default("ideation"),

    /** The handbook expects projects to span several strands, chosen at proposal. */
    targetStrands: text("targetStrands").array().notNull().default([]),

    // --- Stage 1: the Project Proposal ---
    proposalIdea: text("proposalIdea").notNull().default(""),
    proposalInternalImpact: text("proposalInternalImpact").notNull().default(""),
    proposalExternalImpact: text("proposalExternalImpact").notNull().default(""),
    proposalFeasibility: text("proposalFeasibility").notNull().default(""),
    projectType: text("projectType")
      .$type<"internal" | "external" | "internal-to-external">()
      .notNull()
      .default("internal"),
    proposalSubmittedAt: timestamp("proposalSubmittedAt", { mode: "date" }),

    // --- Stage 2: approval, coaching and the Commitment Charter ---
    approvedAt: timestamp("approvedAt", { mode: "date" }),
    approvedBy: text("approvedBy").references(() => users.id, { onDelete: "set null" }),
    leadCoachId: text("leadCoachId").references(() => users.id, { onDelete: "set null" }),
    /**
     * Signing the Commitment Charter is the student formally agreeing to see the
     * project through unless a coach-led review determines a pivot is necessary.
     */
    charterSignedAt: timestamp("charterSignedAt", { mode: "date" }),

    joinedAt: timestamp("joinedAt", { mode: "date" }).notNull().defaultNow(),
    completedAt: timestamp("completedAt", { mode: "date" }),
  },
  (t) => [
    uniqueIndex("enrolment_user_project_idx").on(t.userId, t.projectSlug),
    index("enrolment_project_idx").on(t.projectSlug),
  ],
);

/**
 * Kanban card. The board columns come straight from the team's own "kanban"
 * core practice.
 */
export const tasks = pgTable(
  "task",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    enrolmentId: text("enrolmentId")
      .notNull()
      .references(() => enrolments.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    status: text("status")
      .$type<"backlog" | "doing" | "review" | "done">()
      .notNull()
      .default("backlog"),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [index("task_enrolment_idx").on(t.enrolmentId)],
);

/**
 * One pass of the school's Plan – Act – Reflect cycle (a core practice owned by
 * Rémy). A project accumulates a series of these as its learning record.
 */
export const reflections = pgTable(
  "reflection",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    enrolmentId: text("enrolmentId")
      .notNull()
      .references(() => enrolments.id, { onDelete: "cascade" }),
    cycle: integer("cycle").notNull().default(1),
    plan: text("plan").notNull().default(""),
    act: text("act").notNull().default(""),
    reflect: text("reflect").notNull().default(""),
    /** Paul's "ask a further question" practice, captured per cycle. */
    furtherQuestion: text("furtherQuestion").notNull().default(""),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [index("reflection_enrolment_idx").on(t.enrolmentId)],
);

/**
 * SMART goals — three to five per project, agreed with a coach at Stage 2.
 * The handbook requires the set to combine tangible deliverables, process
 * milestones and qualitative growth, so `kind` is not decorative: the UI uses
 * it to check the balance of a goal set before a project is approved.
 */
export const goals = pgTable(
  "goal",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    enrolmentId: text("enrolmentId")
      .notNull()
      .references(() => enrolments.id, { onDelete: "cascade" }),
    kind: text("kind")
      .$type<"deliverable" | "milestone" | "qualitative">()
      .notNull()
      .default("deliverable"),
    statement: text("statement").notNull(),
    /** How this goal will be judged met — the "measurable" in SMART. */
    measure: text("measure").notNull().default(""),
    dueBy: text("dueBy").notNull().default(""),
    /**
     * Goals are recalibrated when circumstances change, so that ambition is
     * preserved rather than penalised. Recording it keeps the history honest.
     */
    progress: integer("progress").notNull().default(0),
    achieved: boolean("achieved").notNull().default(false),
    recalibratedAt: timestamp("recalibratedAt", { mode: "date" }),
    recalibrationNote: text("recalibrationNote").notNull().default(""),
    position: integer("position").notNull().default(0),
  },
  (t) => [index("goal_enrolment_idx").on(t.enrolmentId)],
);

/**
 * Scorecards. Student scorecards are reflective tools reviewed by a coach —
 * explicitly not self-grading. Coach scorecards are completed twice monthly and
 * calibrated in the Coach Council. Both are stored here, distinguished by
 * `kind`, because they share a shape and are always read together.
 */
export const scorecards = pgTable(
  "scorecard",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    enrolmentId: text("enrolmentId")
      .notNull()
      .references(() => enrolments.id, { onDelete: "cascade" }),
    kind: text("kind").$type<"student" | "coach">().notNull(),
    /** Null for a student scorecard; the coach who completed it otherwise. */
    authorId: text("authorId").references(() => users.id, { onDelete: "set null" }),
    /** Dimension key → 1-5 rating, keyed by STUDENT_SCORECARD / COACH_SCORECARD. */
    ratings: text("ratings").notNull().default("{}"),
    /** Dimension key → written reflection. The part that actually matters. */
    notes: text("notes").notNull().default("{}"),
    /** Coach's summary comment, or the student's overall reflection. */
    comment: text("comment").notNull().default(""),
    periodLabel: text("periodLabel").notNull().default(""),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    index("scorecard_enrolment_idx").on(t.enrolmentId),
    index("scorecard_kind_idx").on(t.kind),
  ],
);

/**
 * Success criteria — the team's own "definition of done" practice from the
 * planning workbook. Lighter than a SMART goal, and used for the working
 * checklist rather than formal evaluation.
 */
export const criteria = pgTable(
  "criterion",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    enrolmentId: text("enrolmentId")
      .notNull()
      .references(() => enrolments.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    met: boolean("met").notNull().default(false),
    position: integer("position").notNull().default(0),
  },
  (t) => [index("criterion_enrolment_idx").on(t.enrolmentId)],
);
