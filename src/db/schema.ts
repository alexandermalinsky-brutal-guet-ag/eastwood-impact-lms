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
 * Success criteria — the team's "definition of done" practice, made concrete
 * per enrolment so a project can be marked complete against agreed evidence.
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
