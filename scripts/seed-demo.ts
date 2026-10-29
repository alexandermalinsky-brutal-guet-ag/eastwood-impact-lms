/**
 * Populates the platform with an illustrative cohort so every screen shows a
 * working system rather than an empty state.
 *
 *   npm run demo              # local
 *   npm run demo:prod         # production
 *   npm run demo -- --clear   # remove the demo cohort again
 *
 * THE PEOPLE AND PROJECTS HERE ARE FICTIONAL. Every demo account sits on the
 * @demo.eastwoodmontreux.ch domain so it can be told apart from a real roster
 * at a glance, and removed in one command.
 */
import { eq, inArray, like, or, sql } from "drizzle-orm";
import { hash } from "bcryptjs";

import { db, isDatabaseConfigured } from "../src/db";
import { attendance, attendanceSessions, enrolments, users } from "../src/db/schema";

const DEMO_DOMAIN = "demo.eastwoodmontreux.ch"; // legacy cohort, cleared on reseed

/**
 * Accounts from earlier batches that kept showing up on the Accounts roster
 * and contradicting "three accounts". None of them owned a project.
 */
const RETIRED_EMAILS = ["alexandermalinsky@icloud.com", "melissa@eastwoodmontreux.ch"];
const PASSWORD = process.env.DEMO_PASSWORD ?? "impact-demo-2026";
const YEAR = "2026/27";
const flag = (n: string) => process.argv.includes(`--${n}`);

type Phase = "exploration" | "execution" | "legacy";


/**
 * The platform's own project, owned by the person building it. Everything
 * here is true — only the Impact Proposal survives, because that is the only
 * phase the platform has built.
 */
const OWNER = {
  email: "alexander.malinsky@eastwood.global",
  name: "Alexander Malinsky",
  role: "admin" as const,
  slug: "own-impact-lms",
  title: "The IMPACT LMS",
};

const OWNER_PROJECT = {
  problem:
    "The IMPACT programme is fully designed in a 99-page handbook and run on a spreadsheet. Proposals, goals, reflections and coach assessments live in four places, owned by nobody, and are lost at the end of the year.",
  whoAffected:
    "Every student on an IMPACT project — around 180 across Grades 9 to 12 — and the 11 coaches who have no way to see who is stuck without asking each one.",
  whatChanges:
    "A student opens one page and knows what to do today. A coach opens one page and knows in a minute who needs them. The record of a project survives the year it was done in.",
  deliverable:
    "A live platform a student and a coach can both use: the student writes an Impact Proposal, the coach approves it or sends it back, and the record survives the year it was done in.",
  skills:
    "Shipping something real to a deadline, taking a critical brief without defending the first version, and cutting features that describe the programme instead of helping anyone run a project.",
  needs:
    "A Google Workspace admin for twenty minutes to create the OAuth client, a pilot cohort and a lead coach, and a decision on which AI tool the school approves for 13-18s.",
  risk:
    "It gets demoed, admired and never used, because nobody owns the content. Plan B: run the pilot with one class and the 16 practices already written, rather than waiting for all 70.",
  indicatorName: "Student projects tracked end to end in the platform",
  indicatorBaseline: "0 of 92",
  indicatorTarget: "25 — one cohort, by the end of the pilot term",
};

/**
 * Three accounts, one project.};

/**
 * Three accounts, one project. The cohort of invented students was removed —
 * one true project demos better than five fictional ones, and nothing here
 * can be contradicted.
 */
const PEOPLE: { key: string; email: string; name: string; role: "student" | "coach" | "admin"; grade?: string; phase?: Phase }[] = [
  { key: "alex", email: "alexander.malinsky@eastwood.global", name: "Alexander Malinsky", role: "student", grade: "12", phase: "legacy" },
  { key: "matthias", email: "matthias@eastwood.global", name: "Matthias", role: "coach" },
  { key: "admin", email: "admin@eastwood.global", name: "IMPACT Admin", role: "admin" },
];

const COACH_NAME = "Matthias";

async function clear({ removeAccounts }: { removeAccounts: boolean }) {
  // Accounts from earlier demo batches go entirely; they are not coming back.
  const stale = await db()
    .select({ id: users.id })
    .from(users)
    .where(or(
      like(users.email, `%@${DEMO_DOMAIN}`),
      inArray(users.email, RETIRED_EMAILS),
    ));
  if (stale.length) {
    await db().delete(users).where(inArray(users.id, stale.map((d) => d.id)));
    console.log(`Removed ${stale.length} account(s) from an earlier demo domain.`);
  }

  const current = await db()
    .select({ id: users.id })
    .from(users)
    .where(inArray(users.email, PEOPLE.map((p) => p.email)));
  if (!current.length) return;

  if (removeAccounts) {
    // Enrolments and everything under them cascade from the user row.
    await db().delete(users).where(inArray(users.id, current.map((d) => d.id)));
    console.log(`Removed ${current.length} demo account(s) and all their project data.`);
    return;
  }

  // Attendance hangs off the user, not the enrolment, so it survives the
  // cascade below. Clear the marks, then any register left with nobody on it.
  await db().delete(attendance).where(inArray(attendance.userId, current.map((d) => d.id)));
  await db().delete(attendanceSessions).where(
    sql`not exists (select 1 from attendance a where a."sessionId" = ${attendanceSessions.id})`,
  );

  // Everything under an enrolment cascades from it, so this is the whole project.
  await db().delete(enrolments).where(inArray(enrolments.userId, current.map((d) => d.id)));
  console.log(`Cleared project data for ${current.length} demo account(s); sessions stay valid.`);
}

async function main() {
  if (!isDatabaseConfigured()) { console.error("No DATABASE_URL."); process.exit(1); }
  if (flag("clear")) return clear({ removeAccounts: true });

  await clear({ removeAccounts: false }); // idempotent: always rebuild the project
  const passwordHash = await hash(PASSWORD, 10);
  const ids = new Map<string, string>();

  for (const person of PEOPLE) {
    const fields = {
      name: person.name, role: person.role, passwordHash,
      grade: person.grade ?? null, phase: person.phase ?? "exploration",
      academicYear: YEAR, active: true,
    };
    // Upsert so an account keeps its id, and with it anyone's live session.
    const [row] = await db()
      .insert(users)
      .values({ email: person.email, ...fields })
      .onConflictDoUpdate({ target: users.email, set: fields })
      .returning({ id: users.id });
    ids.set(person.key, row.id);
  }

  const studentId = ids.get("alex")!;
  const coachId = ids.get("matthias")!;
  const P = OWNER_PROJECT;

  await db().insert(enrolments).values({
    userId: studentId, projectSlug: OWNER.slug, ownTitle: OWNER.title,
    fromCatalogue: false, role: "lead", status: "active",
    problem: P.problem, whoAffected: P.whoAffected, whatChanges: P.whatChanges,
    deliverable: P.deliverable, skills: P.skills, needs: P.needs, risk: P.risk,
    indicatorName: P.indicatorName, indicatorBaseline: P.indicatorBaseline,
    indicatorTarget: P.indicatorTarget,
    proposalSubmittedAt: new Date(),
    approvedAt: new Date(), approvedBy: coachId, approvedByName: COACH_NAME,
  });

  // Attendance at the weekly work sessions, ending last week so the register
  // for this week is still the coach's to open during a demo.
  const sessionDays = 7 * 24 * 60 * 60 * 1000;
  const monday = new Date();
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7) - 7);

  const register: { back: number; status: "present" | "late" | "excused" | "absent"; note?: string }[] = [
    { back: 7, status: "present" },
    { back: 6, status: "late", note: "Came from the server migration running long." },
    { back: 5, status: "present" },
    { back: 4, status: "excused", note: "Open day — presenting the platform to parents." },
    { back: 3, status: "present" },
    { back: 2, status: "late", note: "Ten minutes — bus." },
    { back: 1, status: "present" },
    { back: 0, status: "present" },
  ];

  for (const entry of register) {
    const day = new Date(monday.getTime() - entry.back * sessionDays);
    const [row] = await db()
      .insert(attendanceSessions)
      .values({
        date: day.toISOString().slice(0, 10),
        title: "Structured work session",
        createdByName: COACH_NAME,
      })
      .returning({ id: attendanceSessions.id });

    await db().insert(attendance).values({
      sessionId: row.id, userId: studentId, status: entry.status,
      note: entry.note ?? "", markedByName: COACH_NAME,
    });
  }

  console.log(`\nDemo ready: ${PEOPLE.length} accounts, 1 project.\n`);
  for (const person of PEOPLE) {
    console.log(`  ${person.role.padEnd(8)} ${person.email}`);
  }
  console.log(`\n  Password: ${PASSWORD}`);
  console.log(`\n  ${OWNER.name} owns "${OWNER.title}", proposal approved by ${COACH_NAME}.`);
  console.log(`  The coach queue is empty — start a project and submit it to fill it.`);
  console.log(`  ${register.length} work sessions marked: late twice, excused once.\n`);
}

main().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
