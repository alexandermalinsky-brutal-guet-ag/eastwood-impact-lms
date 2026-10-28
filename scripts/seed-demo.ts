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
import { attendance, attendanceSessions, criteria, enrolments, evidence, helpRequests, milestones, reflections, scorecards, tasks, users } from "../src/db/schema";

const DEMO_DOMAIN = "demo.eastwoodmontreux.ch"; // legacy cohort, cleared on reseed

/**
 * Accounts from earlier batches that kept showing up on the Programme roster
 * and contradicting "three accounts". None of them owned a project.
 */
const RETIRED_EMAILS = ["alexandermalinsky@icloud.com", "melissa@eastwoodmontreux.ch"];
const PASSWORD = process.env.DEMO_PASSWORD ?? "impact-demo-2026";
const YEAR = "2026/27";
const flag = (n: string) => process.argv.includes(`--${n}`);

type Phase = "exploration" | "execution" | "legacy";


/**
 * The platform's own project, owned by the person building it.
 *
 * Everything here is true: the dates come from the git history, the evidence
 * from what actually shipped, and the indicator counts the demo cohort rather
 * than pretending real students are already using it.
 */
const OWNER = {
  email: "alexander.malinsky@eastwood.global",
  name: "Alexander Malinsky",
  role: "admin" as const,
  slug: "own-impact-lms",
  title: "The IMPACT LMS",
};

const OWNER_PROJECT = {
  phase: "execute" as const,
  level: 6,
  strands: ["Technologies", "Action"],
  type: "internal-to-external" as const,
  problem:
    "The IMPACT programme is fully designed in a 99-page handbook and run on a spreadsheet. Proposals, goals, reflections and coach assessments live in four places, owned by nobody, and are lost at the end of the year.",
  whoAffected:
    "Every student on an IMPACT project — around 180 across Grades 9 to 12 — and the 11 coaches who have no way to see who is stuck without asking each one.",
  whatChanges:
    "A student opens one page and knows what to do today. A coach opens one page and knows in a minute who needs them. The record of a project survives the year it was done in.",
  deliverable:
    "A live platform running the four-phase journey end to end: Impact Proposal, coach approval, dated plan, a level map that unlocks on validated evidence, and a report assembled from the project itself.",
  skills:
    "Shipping something real to a deadline, taking a critical brief without defending the first version, and cutting features that describe the programme instead of helping anyone run a project.",
  needs:
    "A Google Workspace admin for twenty minutes to create the OAuth client, a pilot cohort and a lead coach, and a decision on which AI tool the school approves for 13-18s.",
  risk:
    "It gets demoed, admired and never used, because nobody owns the content. Plan B: run the pilot with one class and the 16 practices already written, rather than waiting for all 70.",
  indicatorName: "Student projects tracked end to end in the platform",
  indicatorBaseline: "0 of 92",
  indicatorTarget: "25 — one cohort, by the end of the pilot term",
  indicatorCurrent: "5 (demo projects, not yet real students)",
  milestones: [
    { title: "First build live on Vercel with the curriculum imported", dueDate: "2026-09-08", done: true },
    { title: "Align the platform with the IMPACT Handbook", dueDate: "2026-09-14", done: true },
    { title: "Production database, accounts, and sign-in working", dueDate: "2026-10-08", done: true },
    { title: "Release 1 of the Improvement Brief", dueDate: "2026-10-22", done: true },
    { title: "Demo to the IMPACT team and settle the six open questions", dueDate: "2026-10-30", done: false },
    { title: "Release 2: weekly check-ins, file evidence, AI kits", dueDate: "2026-12-12", done: false },
    { title: "Pilot with one cohort and measure the indicator", dueDate: "2027-02-27", done: false },
  ],
  criteria: [
    { label: "A student can create, submit and plan a project without anyone explaining where things are", met: true },
    { label: "A coach can see in under a minute which students are stalled", met: true },
    { label: "Every issue listed in the Improvement Brief is closed", met: true },
    { label: "One real cohort has run a project in it start to finish", met: false },
    { label: "A finished project produces a report without retyping anything", met: false },
  ],
  evidence: [
    { level: 1, status: "validated" as "validated" | "submitted" | "returned",
      note: "Read the 99-page handbook against the planning workbook. The handbook specifies proposals, approval, SMART goals, a charter, two scorecards and an Impact Profile. None of it had anywhere to live — the workbook held 87 project ideas, 61 with no point person and 6 with no strand.",
      comment: "Counting the gaps rather than asserting them is what makes this a problem statement and not an opinion." },
    { level: 2, status: "validated" as const,
      note: "Proposal with the indicator set at 0 of 92 projects tracked, target one cohort.",
      comment: "The target is a cohort rather than 'everyone', which is the right size for a first pilot." },
    { level: 3, status: "validated" as const,
      note: "Seven dated milestones from first build through to the pilot measurement, with the release plan from the brief as the spine.",
      comment: "Dates are realistic and the last one is the only one that actually tests the idea." },
    { level: 4, status: "validated" as const,
      note: "First real test: live in production on 8 October, one month after the first commit. Sixteen reviewed commits, migrations applied to a clean database, every write ownership-checked.",
      url: "https://eastwood-impact-lms.vercel.app",
      comment: "Live is live. The month from nothing to production is the part to lead with." },
    { level: 5, status: "validated" as const,
      note: "Mid-showcase: Release 1 presented to the IMPACT team on 22 October. The brief asked for impact to replace strands as the organising idea, five trackers merged into one path, a coach view, and nine beta issues closed. All delivered.",
      value: "9 of 9 issues closed",
      comment: "Taking the brief at face value rather than arguing with it is why this moved as fast as it did." },
    { level: 6, status: "submitted" as const,
      note: "Five projects now run end to end in the platform — proposal, approved plan, dated milestones, validated evidence. But they are demo projects I created, not real students, so I am not sure this counts as the indicator moving. Submitting it to ask rather than to claim it.",
      value: "5 of 92",
      url: "" },
  ],
  cycles: [
    {
      plan: "Build the platform from the handbook and the planning workbook, generating the curriculum from the spreadsheet rather than retyping it.",
      act: "Shipped in a month. The extractor logged 87 normalisations and refused to guess a strand for the six projects that arrived without one, which surfaced gaps nobody had counted.",
      reflect: "The refusal to guess turned out to be the most useful decision. Showing 61 projects with no lead made a management fact visible that a tidier import would have hidden.",
      q: "What else is the spreadsheet hiding that nobody has thought to count?",
    },
    {
      plan: "Take the Improvement Brief and build Release 1 without arguing with any of it.",
      act: "Rebuilt the organising idea around impact, merged five trackers into one path, added the level map and the coach queue, and closed all nine beta issues. Then spent a second pass deleting: 53 blank practice pages hidden, eight handbook sections cut to one, two numbering systems reduced to one.",
      reflect: "The first version was structurally right and unreadable. The deletion pass changed more than the building pass did. I should have cut earlier rather than adding a feature for every line of the handbook.",
      q: "How do I tell the difference between a concept the programme needs and one I added because the document mentioned it?",
    },
  ],
  help: [
    { question: "The 53 unwritten practice pages are the biggest thing blocking Release 3, and they are content work, not code. Who owns writing them, and can we start with the nine core practices rather than all of them?" },
  ],
  selfCard: {
    ratings: { progress: 4, effort: 5, challenges: 4, collaborate: 3, adjustments: 5 },
    notes: {
      progress: "Release 1 shipped and live. The pilot — the only thing that actually tests the idea — has not started.",
      effort: "Most of September and October, alongside the media work.",
      challenges: "Scope. The handbook describes a whole programme and it was tempting to build all of it instead of the part students touch.",
      collaborate: "Matthias's brief was the turning point and I should have asked for it a month earlier.",
      adjustments: "Cut strands from the organising idea, merged the trackers, hid everything unwritten.",
    },
    comment:
      "The hardest part was deleting things I had built. The second pass removed more than the first pass added, and the platform is better for it. The open risk is unchanged: this gets admired in a demo and never used, because the content behind it has no owner.",
    period: "October",
  },
};

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
  const doneCount = P.milestones.filter((m) => m.done).length;

  const [e] = await db().insert(enrolments).values({
    userId: studentId, projectSlug: OWNER.slug, ownTitle: OWNER.title,
    fromCatalogue: false, role: "lead", status: "active",
    phase: P.phase, level: P.level, targetStrands: P.strands, projectType: P.type,
    problem: P.problem, whoAffected: P.whoAffected, whatChanges: P.whatChanges,
    deliverable: P.deliverable, skills: P.skills, needs: P.needs, risk: P.risk,
    indicatorName: P.indicatorName, indicatorBaseline: P.indicatorBaseline,
    indicatorTarget: P.indicatorTarget, indicatorCurrent: P.indicatorCurrent,
    proposalSubmittedAt: new Date(),
    approvedAt: new Date(), approvedBy: coachId, approvedByName: COACH_NAME,
    leadCoachId: coachId,
    charterSignedAt: new Date(), charterSignedByName: OWNER.name,
    planValidatedAt: new Date(), planValidatedByName: COACH_NAME,
  }).returning({ id: enrolments.id });

  for (const [i, m] of P.milestones.entries()) {
    await db().insert(milestones).values({
      enrolmentId: e.id, title: m.title, dueDate: m.dueDate, done: m.done, position: i,
    });
    await db().insert(tasks).values({
      enrolmentId: e.id, title: m.title,
      status: m.done ? "done" : i === doneCount ? "doing" : "backlog",
      position: i,
    });
  }

  await db().insert(criteria).values(P.criteria.map((c, i) => ({
    enrolmentId: e.id, label: c.label, met: c.met, position: i,
  })));

  await db().insert(evidence).values(P.evidence.map((ev) => ({
    enrolmentId: e.id, level: ev.level, note: ev.note,
    url: "url" in ev ? (ev.url as string) : "",
    value: "value" in ev ? (ev.value as string) : "",
    status: ev.status,
    reviewedAt: ev.status === "submitted" ? null : new Date(),
    reviewedByName: ev.status === "submitted" ? "" : COACH_NAME,
    reviewComment: "comment" in ev ? (ev.comment as string) : "",
  })));

  await db().insert(reflections).values(P.cycles.map((c, i) => ({
    enrolmentId: e.id, cycle: i + 1, plan: c.plan, act: c.act, reflect: c.reflect, furtherQuestion: c.q,
  })));

  await db().insert(helpRequests).values(P.help.map((h) => ({
    enrolmentId: e.id, question: h.question,
  })));

  await db().insert(scorecards).values({
    enrolmentId: e.id, kind: "student", authorId: studentId,
    ratings: JSON.stringify(P.selfCard.ratings), notes: JSON.stringify(P.selfCard.notes),
    comment: P.selfCard.comment, periodLabel: P.selfCard.period,
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
  console.log(`\n  ${OWNER.name} owns "${OWNER.title}" at level ${P.level} of 7.`);
  console.log(`  ${COACH_NAME} has evidence waiting and a question to answer.`);
  console.log(`  ${register.length} work sessions marked: late twice, excused once.\n`);
}

main().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
