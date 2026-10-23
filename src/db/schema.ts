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

  /**
   * Year group — informational only. The handbook is explicit that progression
   * is by demonstrated readiness, not chronological age, so nothing in the app
   * gates on this; it is here so a coach can see who they are talking to.
   */
  grade: text("grade"),

  /**
   * Where the student actually is in the programme. This is the field that
   * carries meaning: a coach moves someone to the next phase when they have
   * shown they are ready, which may not line up with their grade at all.
   */
  phase: text("phase")
    .$type<"exploration" | "execution" | "legacy">()
    .notNull()
    .default("exploration"),

  /** e.g. "2026/27". Lets a cohort be rolled over without deleting history. */
  academicYear: text("academicYear"),

  /** Soft-archive, so a leaver's record survives without them signing in. */
  active: boolean("active").notNull().default(true),

  /**
   * Secret in the calendar feed URL. Google's servers fetch the .ics without
   * a session, so the token is what authenticates the request — it is the
   * only thing standing between a guessed URL and someone's deadlines.
   */
  calendarToken: text("calendarToken").$defaultFn(() => crypto.randomUUID()),

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

    /** Which of the four phases of work the project is in. */
    phase: text("phase")
      .$type<"create" | "plan" | "execute" | "report">()
      .notNull()
      .default("create"),

    /** Highest level reached on the level map. A level is unlocked by validated evidence. */
    level: integer("level").notNull().default(1),

    /** The handbook expects projects to span several strands, chosen at proposal. */
    targetStrands: text("targetStrands").array().notNull().default([]),

    /**
     * The Impact Proposal. "Who benefits, what will be different, and how we
     * will know" is the organising question of the platform — it replaced the
     * strands, which are now an optional tag.
     */
    problem: text("problem").notNull().default(""),
    whoAffected: text("whoAffected").notNull().default(""),
    whatChanges: text("whatChanges").notNull().default(""),
    deliverable: text("deliverable").notNull().default(""),
    skills: text("skills").notNull().default(""),
    needs: text("needs").notNull().default(""),
    risk: text("risk").notNull().default(""),

    /** One indicator, measured against a baseline and a target. */
    indicatorName: text("indicatorName").notNull().default(""),
    indicatorBaseline: text("indicatorBaseline").notNull().default(""),
    indicatorTarget: text("indicatorTarget").notNull().default(""),
    indicatorCurrent: text("indicatorCurrent").notNull().default(""),

    /** Set when the student started from a catalogue entry rather than their own idea. */
    fromCatalogue: boolean("fromCatalogue").notNull().default(true),
    ownTitle: text("ownTitle").notNull().default(""),
    projectType: text("projectType")
      .$type<"internal" | "external" | "internal-to-external">()
      .notNull()
      .default("internal"),
    proposalSubmittedAt: timestamp("proposalSubmittedAt", { mode: "date" }),

    // --- Stage 2: approval, coaching and the Commitment Charter ---
    approvedAt: timestamp("approvedAt", { mode: "date" }),
    approvedBy: text("approvedBy").references(() => users.id, { onDelete: "set null" }),
    /** Denormalised so the record survives the coach's account being removed. */
    approvedByName: text("approvedByName").notNull().default(""),
    planValidatedAt: timestamp("planValidatedAt", { mode: "date" }),
    planValidatedByName: text("planValidatedByName").notNull().default(""),
    charterSignedByName: text("charterSignedByName").notNull().default(""),
    /** A returned proposal comes back with a reason, not a rejection. */
    returnedComment: text("returnedComment").notNull().default(""),
    returnedAt: timestamp("returnedAt", { mode: "date" }),
    leadCoachId: text("leadCoachId").references(() => users.id, { onDelete: "set null" }),
    /**
     * Signing the Commitment Charter is the student formally agreeing to see the
     * project through unless a coach-led review determines a pivot is necessary.
     */
    charterSignedAt: timestamp("charterSignedAt", { mode: "date" }),

    joinedAt: timestamp("joinedAt", { mode: "date" }).notNull().defaultNow(),
    completedAt: timestamp("completedAt", { mode: "date" }),

    /**
     * Withdrawing is not deleting. The charter binds a student to finish
     * unless a coach-led review decides otherwise, so once it is signed the
     * project leaves their dashboard but the record — and the reason — stays
     * for the coach and the student's own profile.
     */
    withdrawnAt: timestamp("withdrawnAt", { mode: "date" }),
    withdrawnReason: text("withdrawnReason").notNull().default(""),
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
 * Dated milestones — three to six per project, shown on a timeline. These and
 * the definition of done (the `criteria` table) replace the old SMART goals.
 */
export const milestones = pgTable(
  "milestone",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    enrolmentId: text("enrolmentId")
      .notNull()
      .references(() => enrolments.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    dueDate: text("dueDate").notNull().default(""),
    /** Which level on the map this milestone carries, where it maps to one. */
    level: integer("level"),
    done: boolean("done").notNull().default(false),
    position: integer("position").notNull().default(0),
  },
  (t) => [index("milestone_enrolment_idx").on(t.enrolmentId)],
);

/**
 * Evidence submitted to unlock a level. A coach validates it or returns it
 * with feedback — a return is not a failure, the student revises and resubmits.
 */
export const evidence = pgTable(
  "evidence",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    enrolmentId: text("enrolmentId")
      .notNull()
      .references(() => enrolments.id, { onDelete: "cascade" }),
    level: integer("level").notNull(),
    milestoneId: text("milestoneId").references(() => milestones.id, { onDelete: "set null" }),
    note: text("note").notNull().default(""),
    /** A link, or a number for an indicator update. File upload comes in Release 2. */
    url: text("url").notNull().default(""),
    value: text("value").notNull().default(""),
    status: text("status")
      .$type<"submitted" | "validated" | "returned">()
      .notNull()
      .default("submitted"),
    submittedAt: timestamp("submittedAt", { mode: "date" }).notNull().defaultNow(),
    reviewedAt: timestamp("reviewedAt", { mode: "date" }),
    reviewedByName: text("reviewedByName").notNull().default(""),
    reviewComment: text("reviewComment").notNull().default(""),
  },
  (t) => [
    index("evidence_enrolment_idx").on(t.enrolmentId),
    index("evidence_status_idx").on(t.status),
  ],
);

/** A student's request for help, which lands in their coach's queue. */
export const helpRequests = pgTable(
  "helpRequest",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    enrolmentId: text("enrolmentId")
      .notNull()
      .references(() => enrolments.id, { onDelete: "cascade" }),
    question: text("question").notNull(),
    answer: text("answer").notNull().default(""),
    answeredByName: text("answeredByName").notNull().default(""),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    answeredAt: timestamp("answeredAt", { mode: "date" }),
  },
  (t) => [index("help_enrolment_idx").on(t.enrolmentId)],
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
