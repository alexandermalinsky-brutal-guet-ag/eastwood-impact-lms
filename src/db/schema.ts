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

/*
 * Every timestamp is `timestamptz`. A bare `timestamp` stores wall-clock time
 * with no zone: Postgres writes it in the server's timezone and Drizzle reads
 * it back as UTC, so the value shifts by whatever the server's offset is —
 * an hour out locally, correct on a UTC host, and wrong twice a year on both.
 */
export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date", withTimezone: true }),
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

  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).notNull().defaultNow(),
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
      .$type<"active" | "withdrawn">()
      .notNull()
      .default("active"),

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

    ownTitle: text("ownTitle").notNull().default(""),
    /**
     * The student's own one-line description, given when they start the
     * project. Deliberately not the proposal's `problem` — that is a worked
     * statement a coach approves, this is just "what is it" on day one.
     */
    ownSummary: text("ownSummary").notNull().default(""),
    proposalSubmittedAt: timestamp("proposalSubmittedAt", { mode: "date", withTimezone: true }),

    /**
     * The coach the student is assigned to, chosen when the project starts.
     * Set null rather than cascading if the account goes, because the name
     * below is the part that has to survive — a record of who approved what
     * is no use once the only reference to them is an orphaned id.
     */
    coachId: text("coachId").references(() => users.id, { onDelete: "set null" }),
    coachName: text("coachName").notNull().default(""),

    // --- The approval gate ---
    approvedAt: timestamp("approvedAt", { mode: "date", withTimezone: true }),
    approvedBy: text("approvedBy").references(() => users.id, { onDelete: "set null" }),
    /** Denormalised so the record survives the coach's account being removed. */
    approvedByName: text("approvedByName").notNull().default(""),
    /** A returned proposal comes back with a reason, not a rejection. */
    returnedComment: text("returnedComment").notNull().default(""),
    returnedAt: timestamp("returnedAt", { mode: "date", withTimezone: true }),
    joinedAt: timestamp("joinedAt", { mode: "date", withTimezone: true }).notNull().defaultNow(),

    /**
     * Withdrawing is not deleting. The project leaves the student's dashboard
     * but the record — and the reason — stays, for the coach and for the
     * student's own profile.
     */
    withdrawnAt: timestamp("withdrawnAt", { mode: "date", withTimezone: true }),
    withdrawnReason: text("withdrawnReason").notNull().default(""),
  },
  (t) => [
    uniqueIndex("enrolment_user_project_idx").on(t.userId, t.projectSlug),
    index("enrolment_project_idx").on(t.projectSlug),
  ],
);

/**
 * The ideas noticeboard. Somewhere to put a project worth doing that you are
 * not going to run yourself — the catalogue is written by staff, this is what
 * students put up for each other.
 */
export const projectIdeas = pgTable(
  "projectIdea",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: text("title").notNull(),
    summary: text("summary").notNull().default(""),
    /** Null once the account goes; the name below is what has to survive. */
    suggestedById: text("suggestedById").references(() => users.id, { onDelete: "set null" }),
    suggestedByName: text("suggestedByName").notNull().default(""),
    createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("project_idea_created_idx").on(t.createdAt)],
);

/**
 * Attendance at the weekly structured work session the handbook fixes as the
 * programme's rhythm. There are no classes or groups in the system — one
 * session, one register, the whole active student roster.
 */
export type AttendanceStatus = "present" | "late" | "excused" | "absent";

export const attendanceSessions = pgTable(
  "attendanceSession",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    /** Calendar day, "2026-10-28". No time of day: a register is for a date. */
    date: text("date").notNull(),
    /** What it was, if the coach wants to say. "Week 4 workshop". */
    title: text("title").notNull().default(""),
    createdByName: text("createdByName").notNull().default(""),
    createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("attendance_session_date_idx").on(t.date)],
);

export const attendance = pgTable(
  "attendance",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    sessionId: text("sessionId")
      .notNull()
      .references(() => attendanceSessions.id, { onDelete: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status").$type<AttendanceStatus>().notNull(),
    /** Why — the thing that makes "excused" mean anything to the student. */
    note: text("note").notNull().default(""),
    /**
     * Who marked it. The beta flagged an approval that showed a date and no
     * name; an attendance mark a student may want to dispute needs both.
     */
    markedByName: text("markedByName").notNull().default(""),
    markedAt: timestamp("markedAt", { mode: "date", withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // One mark per student per session — re-marking updates, never duplicates.
    uniqueIndex("attendance_session_user_idx").on(t.sessionId, t.userId),
    index("attendance_user_idx").on(t.userId),
  ],
);
