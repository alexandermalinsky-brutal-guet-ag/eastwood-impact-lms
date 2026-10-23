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
import { eq, inArray, like } from "drizzle-orm";
import { hash } from "bcryptjs";

import { db, isDatabaseConfigured } from "../src/db";
import { criteria, enrolments, evidence, helpRequests, milestones, reflections, scorecards, tasks, users } from "../src/db/schema";

const DEMO_DOMAIN = "demo.eastwoodmontreux.ch";
const PASSWORD = process.env.DEMO_PASSWORD ?? "impact-demo-2026";
const YEAR = "2026/27";
const flag = (n: string) => process.argv.includes(`--${n}`);

type Phase = "exploration" | "execution" | "legacy";

const PEOPLE: {
  key: string; name: string; role: "student" | "coach" | "admin"; grade?: string; phase?: Phase;
}[] = [
  { key: "admin", name: "Demo Admin", role: "admin" },
  { key: "coach", name: "Rémy Chevalley", role: "coach" },
  { key: "m.okonkwo", name: "Melissa Okonkwo", role: "coach" },
  { key: "student", name: "Sofia Ferrand", role: "student", grade: "12", phase: "legacy" },
  { key: "l.brunner", name: "Luca Brunner", role: "student", grade: "11", phase: "execution" },
  { key: "a.haddad", name: "Amira Haddad", role: "student", grade: "11", phase: "execution" },
  { key: "t.nakamura", name: "Tomás Nakamura", role: "student", grade: "10", phase: "execution" },
  { key: "e.lindqvist", name: "Elsa Lindqvist", role: "student", grade: "9", phase: "exploration" },
  { key: "j.moreau", name: "Jonas Moreau", role: "student", grade: "9", phase: "exploration" },
];
const email = (k: string) => `${k}@${DEMO_DOMAIN}`;

type Seed = {
  who: string;
  project: string;
  phase: "create" | "plan" | "execute" | "report";
  level: number;
  strands: string[];
  type: "internal" | "external" | "internal-to-external";
  proposal?: {
    problem: string; whoAffected: string; whatChanges: string; deliverable: string;
    skills: string; needs: string; risk: string;
    indicator: string; baseline: string; target: string; current?: string;
  };
  submitted?: boolean;
  planValidated?: boolean;
  milestones?: { title: string; dueDate: string; done: boolean }[];
  evidenceLog?: { level: number; note: string; url?: string; value?: string; status: "submitted" | "validated" | "returned"; comment?: string }[];
  help?: { question: string; answer?: string }[];
  approved?: boolean;
  charter?: boolean;
  tasks?: { title: string; status: "backlog" | "doing" | "review" | "done" }[];
  criteria?: { label: string; met: boolean }[];
  cycles?: { plan: string; act: string; reflect: string; q: string }[];
  selfCard?: { ratings: Record<string, number>; notes: Record<string, string>; comment: string; period: string };
  coachCard?: { by: string; ratings: Record<string, number>; comment: string; period: string };
};

const SEEDS: Seed[] = [
  // The walkthrough project: level 6, everything populated, one piece of
  // evidence sitting in the coach's queue so the demo has something to act on.
  {
    who: "student",
    project: "kickoff-voices-of-tomorrow",
    phase: "execute",
    level: 6,
    strands: ["Imagination", "Action"],
    type: "external",
    submitted: true,
    planValidated: true,
    proposal: {
      problem: "Students here think changemaking is something adults do somewhere else.",
      whoAffected: "The 180 students in Grades 9-11, and the dozen local founders nobody has thought to ask.",
      whatChanges: "Students can name three people under 25 in this region who started something, and say how they did it.",
      deliverable: "Six published podcast episodes with local young founders, plus a handover guide so it runs next year without me.",
      skills: "Interviewing without a script, audio editing, and asking strangers for things.",
      needs: "The music room on Thursdays, a borrowed recorder, and introductions to three founders.",
      risk: "Guests cancel and the schedule collapses. Plan B: keep one episode recorded in reserve at all times.",
      indicator: "Students who can name 3 young changemakers (surveyed)",
      baseline: "11 of 180",
      target: "90 of 180",
      current: "74 of 180",
    },
    milestones: [
      { title: "Interview 3 students about what they think a changemaker is", dueDate: "2026-08-21", done: true },
      { title: "Record and publish the pilot episode", dueDate: "2026-09-04", done: true },
      { title: "Publish episodes 2-4", dueDate: "2026-10-16", done: true },
      { title: "Re-run the survey at the halfway point", dueDate: "2026-10-30", done: true },
      { title: "Publish episodes 5-6", dueDate: "2026-11-13", done: false },
      { title: "Hand production to a Grade 10 and write the guide", dueDate: "2026-11-20", done: false },
    ],
    criteria: [
      { label: "Six episodes are public and someone outside school has listened", met: true },
      { label: "The survey number moved toward the target", met: true },
      { label: "A younger student has produced an episode without me", met: false },
      { label: "The handover guide exists and someone has read it", met: false },
    ],
    evidenceLog: [
      { level: 1, status: "validated", note: "Asked 3 students what a changemaker is. All three named someone famous and nobody local — that is the problem in one line.", comment: "This is exactly the kind of small proof that makes a problem real." },
      { level: 2, status: "validated", note: "Impact Proposal with the survey baseline: 11 of 180 could name three. Target 90.", comment: "Baseline is specific and you can measure it again. Approved." },
      { level: 3, status: "validated", note: "Six dated milestones through to the December showcase, charter signed.", comment: "Realistic. The reserve-episode plan B is a good instinct." },
      { level: 4, status: "validated", note: "Pilot recorded with Nadia from the climate group. Published to 5 listeners first.", url: "https://example.org/voices/pilot", comment: "Testing on five people before publishing was the right call." },
      { level: 5, status: "validated", note: "Played episode 3 to the Grade 10 assembly and collected feedback on cards. The complaint was that intros are too long.", value: "41 responses" },
      { level: 6, status: "submitted", note: "Re-ran the survey at the halfway point: 74 of 180 can now name three young changemakers, up from 11. Same question, same form.", value: "74 of 180" },
    ],
    cycles: [
      {
        plan: "Record a pilot with one guest, publish it to five people only, and ask what made them stop listening.",
        act: "Recorded with Nadia. The audio was fine but the first six minutes were me explaining the project rather than asking her anything. Three of five said they nearly switched off.",
        reflect: "The intro was for me, not the listener. Cut it to twenty seconds and open on the guest's own words. I assumed the problem would be technical and it was editorial.",
        q: "What makes someone keep listening past the first minute of something they did not choose?",
      },
      {
        plan: "Run episodes two to four on the new structure and see whether the survey number moves.",
        act: "Published three episodes in six weeks. The halfway survey went from 11 to 74. Episode four ran long because I did not cut a tangent I liked.",
        reflect: "I can edit other people's words but not my own. Asked Luca to do a final pass on five, which was shorter and better. Being precious about material is the thing to watch.",
        q: "Who should have the final cut on something that carries my name?",
      },
    ],
    help: [
      { question: "Two founders have stopped replying to emails. Is it reasonable to turn up at their office, or is that overstepping?",
        answer: "Email once more with a specific 20-minute ask and a date. If nothing, ask me and I will introduce you — turning up unannounced is a lot to put on someone." },
    ],
    selfCard: {
      ratings: { progress: 4, effort: 4, challenges: 3, collaborate: 4, adjustments: 5 },
      notes: {
        progress: "Four of six milestones done and the indicator is most of the way to target.",
        effort: "About four hours a week, more around a release.",
        challenges: "Guest cancellations twice. Solved by keeping one episode in reserve.",
        collaborate: "Working with Luca on edits changed the project. Should have asked earlier.",
        adjustments: "Cut the intro, shortened episodes, handed final cut to someone else.",
      },
      comment: "The hardest part is giving it away. Teaching someone else to produce is slower than doing it and I keep wanting to take the mouse back.",
      period: "November",
    },
    coachCard: {
      by: "coach",
      ratings: { initiative: 5, leadership: 4, creativity: 5, resilience: 5, ethics: 5 },
      comment: "Sofia has run this with almost no intervention since September. The pilot-then-change loop was hers. The handover is the right thing to be struggling with and she raised it before I did.",
      period: "November",
    },
  },

  // Mid-execution, one piece of evidence returned — shows the revise loop.
  {
    who: "l.brunner",
    project: "kickoff-sustainable-materials",
    phase: "execute",
    level: 4,
    strands: ["Planet", "Technologies"],
    type: "internal-to-external",
    submitted: true,
    planValidated: true,
    proposal: {
      problem: "The school kitchen throws out roughly two cubic metres of polystyrene packaging a month.",
      whoAffected: "The kitchen team of six, and everyone downstream of a landfill that does not break it down.",
      whatChanges: "Deliveries arrive in packaging that composts instead of lasting 500 years.",
      deliverable: "Five tested mycelium packaging samples with measured compressive strength, and a recommendation the kitchen can act on.",
      skills: "Running a controlled experiment, sterile technique, and presenting results that disprove my own hypothesis.",
      needs: "The old darkroom as a grow space, substrate from the farm in Villeneuve, and 20 minutes of the kitchen manager's time.",
      risk: "Samples keep contaminating and I run out of term. Plan B: report the method honestly as a negative result.",
      indicator: "Compressive strength of best sample (kg before deforming)",
      baseline: "0 kg",
      target: "12 kg",
      current: "7 kg",
    },
    milestones: [
      { title: "Source substrate and set up the darkroom", dueDate: "2026-08-28", done: true },
      { title: "Grow batches 1-3", dueDate: "2026-09-18", done: true },
      { title: "Compressive strength testing", dueDate: "2026-10-09", done: true },
      { title: "Batch 4 at a higher substrate ratio", dueDate: "2026-10-30", done: false },
      { title: "Present to the kitchen manager", dueDate: "2026-11-13", done: false },
    ],
    criteria: [
      { label: "Five samples grown and measured with the same method", met: false },
      { label: "The best sample holds at least 12 kg", met: false },
      { label: "The kitchen manager has seen the results", met: false },
      { label: "The method is written up so someone could repeat it", met: true },
    ],
    evidenceLog: [
      { level: 1, status: "validated", note: "Counted the kitchen's polystyrene over two weeks: 11 large boxes, about 2 cubic metres a month.", comment: "Counting it yourself rather than estimating is what makes this solid." },
      { level: 2, status: "validated", note: "Proposal with compressive strength as the indicator, 0 kg baseline, 12 kg target.", comment: "Good — a number you can actually test." },
      { level: 3, status: "validated", note: "Five milestones to the December presentation. Charter signed." },
      { level: 4, status: "returned", note: "Batch 3 held 7 kg.", comment: "The number is good but I cannot see how you got it. Add how you applied the load and what failed first — a photo of the rig would do it." },
    ],
    cycles: [
      {
        plan: "Grow three batches at the ratios the paper recommends and see if any hold weight.",
        act: "Two contaminated in the first week. The third held 7 kg before deforming — the target is 12.",
        reflect: "Sterilisation was the problem, not the ratio. I was treating a biology experiment like a materials one. Changed the process before changing the recipe.",
        q: "How much of what I am measuring is the material, and how much is my technique?",
      },
    ],
    selfCard: {
      ratings: { progress: 3, effort: 4, challenges: 4, collaborate: 3, adjustments: 4 },
      notes: {
        progress: "Behind on samples because two batches failed, but the process is reliable now.",
        challenges: "Contamination. Fixed by pressure-sterilising the substrate.",
        adjustments: "Changed the method before the formula — that was the right order.",
      },
      comment: "Losing two batches felt like losing three weeks. It was not: it taught me the thing the paper did not mention.",
      period: "November",
    },
  },

  // Sitting in the approval queue — the coach demo acts on this.
  {
    who: "a.haddad",
    project: "action-tedx",
    phase: "create",
    level: 2,
    strands: ["Action"],
    type: "external",
    submitted: true,
    proposal: {
      problem: "Students who are not already confident speakers never get a stage, so the same six people speak at everything.",
      whoAffected: "Roughly 40 students in Grades 10-12 who have something to say and no route to saying it.",
      whatChanges: "Eight students who have never presented publicly have done so, to an audience that is not their class.",
      deliverable: "A TEDx-format evening with eight speakers, half of them first-timers, filmed and published.",
      skills: "Running an event to a deadline, coaching nervous speakers, and negotiating with people who outrank me.",
      needs: "The hall in May, a TEDx licence, and a teacher willing to co-sign the application.",
      risk: "The licence takes eight weeks and might not come. Plan B: run it unbranded as an Eastwood Talks evening.",
      indicator: "First-time speakers who present",
      baseline: "0",
      target: "4 of 8 speakers",
    },
    milestones: [],
    criteria: [
      { label: "The event happened with an audience of 100+", met: false },
      { label: "At least four speakers had never presented publicly before", met: false },
      { label: "Talks are published and watchable", met: false },
    ],
    evidenceLog: [
      { level: 1, status: "validated", note: "Asked 12 students why they have never spoken at assembly. Nine said nobody asked them; three said they were never told how.", comment: "Nine of twelve saying 'nobody asked' is a finding. That is your project." },
    ],
  },

  // Brand new, nothing written — shows the empty state honestly.
  {
    who: "t.nakamura",
    project: "technologies-3d-printing-for-noisy-chairs",
    phase: "create",
    level: 1,
    strands: ["Technologies"],
    type: "internal",
    proposal: {
      problem: "Chairs scraping in B-block make it hard to hear in the back rows.",
      whoAffected: "",
      whatChanges: "",
      deliverable: "",
      skills: "",
      needs: "",
      risk: "",
      indicator: "",
      baseline: "",
      target: "",
    },
    milestones: [],
    criteria: [
      { label: "Measured noise before and after", met: false },
      { label: "Feet fitted to at least one full classroom", met: false },
    ],
    help: [
      { question: "How do I measure classroom noise in a way that counts as evidence? I only have my phone." },
    ],
  },

  // Exploration-phase student, own idea rather than catalogue.
  {
    who: "e.lindqvist",
    project: "imagination-book-club",
    phase: "plan",
    level: 3,
    strands: ["Imagination"],
    type: "internal",
    submitted: true,
    proposal: {
      problem: "There is nowhere to talk about a book unless it is set for English.",
      whoAffected: "The 20-odd students in Grades 9-10 who read for pleasure and have nobody to discuss it with.",
      whatChanges: "A group that meets every Friday without me having to chase anyone.",
      deliverable: "A book club with six meetings, a rotation system for the library's four copies, and a co-lead from Grade 11.",
      skills: "Running a discussion without doing most of the talking, and handing something over.",
      needs: "The library room on Fridays, and the librarian's help with the copy rotation.",
      risk: "Attendance drops after the novelty. Plan B: switch to short stories so nobody has to catch up.",
      indicator: "Students at each meeting",
      baseline: "0",
      target: "8 per meeting by December",
      current: "6 per meeting",
    },
    milestones: [
      { title: "Book the library room and run the first vote", dueDate: "2026-09-12", done: true },
      { title: "Meetings 1-3", dueDate: "2026-10-17", done: true },
      { title: "Sort out the copy rotation with the librarian", dueDate: "2026-10-31", done: false },
      { title: "Bring in a Grade 11 co-lead", dueDate: "2026-11-14", done: false },
    ],
    criteria: [
      { label: "Six meetings happened", met: false },
      { label: "At least eight people at a meeting", met: false },
      { label: "Someone else has run a meeting", met: false },
    ],
    evidenceLog: [
      { level: 1, status: "validated", note: "Asked around: 14 people said they read outside class and 11 said they had never talked to anyone at school about a book.", comment: "Clear problem, and you have the number." },
      { level: 2, status: "validated", note: "Proposal with attendance as the indicator, target 8 a meeting." },
      { level: 3, status: "submitted", note: "Four dated milestones through to December, criteria agreed, charter signed." },
    ],
    cycles: [
      {
        plan: "Let the group pick the first book by vote rather than choosing it myself.",
        act: "They picked something I had not read. Nine came to the first meeting, four to the second.",
        reflect: "The drop was not the book. I ran the second like a lesson with questions I had prepared. The first worked because nobody was in charge.",
        q: "What is the least structure a conversation needs before it stops being a conversation?",
      },
    ],
  },
];

async function clear() {
  const demo = await db().select({ id: users.id }).from(users).where(like(users.email, `%@${DEMO_DOMAIN}`));
  if (!demo.length) { console.log("No demo accounts to remove."); return; }
  // Enrolments and everything under them cascade from the user row.
  await db().delete(users).where(inArray(users.id, demo.map((d) => d.id)));
  console.log(`Removed ${demo.length} demo account(s) and all their project data.`);
}

async function main() {
  if (!isDatabaseConfigured()) { console.error("No DATABASE_URL."); process.exit(1); }
  if (flag("clear")) return clear();

  await clear(); // idempotent: always rebuild from scratch
  const passwordHash = await hash(PASSWORD, 10);
  const ids = new Map<string, string>();

  for (const p of PEOPLE) {
    const [row] = await db().insert(users).values({
      email: email(p.key), name: p.name, role: p.role, passwordHash,
      grade: p.grade ?? null, phase: p.phase ?? "exploration", academicYear: YEAR,
    }).returning({ id: users.id });
    ids.set(p.key, row.id);
  }

  let n = 0;
  for (const s of SEEDS) {
    const userId = ids.get(s.who)!;
    const coachId = ids.get("coach")!;
    const approved = s.level >= 3;

    const [e] = await db().insert(enrolments).values({
      userId, projectSlug: s.project, role: "member", status: "active",
      phase: s.phase, level: s.level,
      targetStrands: s.strands, projectType: s.type,
      problem: s.proposal?.problem ?? "",
      whoAffected: s.proposal?.whoAffected ?? "",
      whatChanges: s.proposal?.whatChanges ?? "",
      deliverable: s.proposal?.deliverable ?? "",
      skills: s.proposal?.skills ?? "",
      needs: s.proposal?.needs ?? "",
      risk: s.proposal?.risk ?? "",
      indicatorName: s.proposal?.indicator ?? "",
      indicatorBaseline: s.proposal?.baseline ?? "",
      indicatorTarget: s.proposal?.target ?? "",
      indicatorCurrent: s.proposal?.current ?? "",
      proposalSubmittedAt: s.submitted ? new Date() : null,
      approvedAt: approved ? new Date() : null,
      approvedBy: approved ? coachId : null,
      approvedByName: approved ? "Rémy Chevalley" : "",
      leadCoachId: coachId,
      charterSignedAt: approved ? new Date() : null,
      charterSignedByName: approved ? (PEOPLE.find((p) => p.key === s.who)?.name ?? "") : "",
      planValidatedAt: s.planValidated ? new Date() : null,
      planValidatedByName: s.planValidated ? "Rémy Chevalley" : "",
    }).returning({ id: enrolments.id });

    const msIds: string[] = [];
    if (s.milestones?.length) {
      for (const [i, m] of s.milestones.entries()) {
        const [row] = await db().insert(milestones).values({
          enrolmentId: e.id, title: m.title, dueDate: m.dueDate, done: m.done, position: i,
        }).returning({ id: milestones.id });
        msIds.push(row.id);
        // The board is pre-filled from the milestones.
        await db().insert(tasks).values({
          enrolmentId: e.id, title: m.title,
          status: m.done ? "done" : i === s.milestones!.filter((x) => x.done).length ? "doing" : "backlog",
          position: i,
        });
      }
    }
    if (s.criteria?.length) {
      await db().insert(criteria).values(s.criteria.map((c, i) => ({
        enrolmentId: e.id, label: c.label, met: c.met, position: i,
      })));
    }
    if (s.evidenceLog?.length) {
      for (const [i, ev] of s.evidenceLog.entries()) {
        await db().insert(evidence).values({
          enrolmentId: e.id, level: ev.level, note: ev.note,
          url: ev.url ?? "", value: ev.value ?? "", status: ev.status,
          milestoneId: msIds[i] ?? null,
          reviewedAt: ev.status === "submitted" ? null : new Date(),
          reviewedByName: ev.status === "submitted" ? "" : "Rémy Chevalley",
          reviewComment: ev.comment ?? "",
        });
      }
    }
    if (s.cycles?.length) {
      await db().insert(reflections).values(s.cycles.map((c, i) => ({
        enrolmentId: e.id, cycle: i + 1, plan: c.plan, act: c.act, reflect: c.reflect, furtherQuestion: c.q,
      })));
    }
    if (s.help?.length) {
      await db().insert(helpRequests).values(s.help.map((h) => ({
        enrolmentId: e.id, question: h.question, answer: h.answer ?? "",
        answeredByName: h.answer ? "Rémy Chevalley" : "",
        answeredAt: h.answer ? new Date() : null,
      })));
    }
    if (s.selfCard) {
      await db().insert(scorecards).values({
        enrolmentId: e.id, kind: "student", authorId: userId,
        ratings: JSON.stringify(s.selfCard.ratings), notes: JSON.stringify(s.selfCard.notes),
        comment: s.selfCard.comment, periodLabel: s.selfCard.period,
      });
    }
    if (s.coachCard) {
      await db().insert(scorecards).values({
        enrolmentId: e.id, kind: "coach", authorId: ids.get(s.coachCard.by)!,
        ratings: JSON.stringify(s.coachCard.ratings), notes: JSON.stringify({}),
        comment: s.coachCard.comment, periodLabel: s.coachCard.period,
      });
    }
    n += 1;
  }

  console.log(`\nDemo cohort ready: ${PEOPLE.length} accounts, ${n} projects in flight.`);
  console.log(`\n  Student:  ${email("student")}`);
  console.log(`  Password: ${PASSWORD}`);
  console.log(`  Coach:    ${email("coach")}`);
  console.log(`  Admin:    ${email("admin")}`);
  console.log(`\nAll demo accounts are on @${DEMO_DOMAIN}. Remove with: --clear\n`);
}

main().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
