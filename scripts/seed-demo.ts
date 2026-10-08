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
import { criteria, enrolments, goals, reflections, scorecards, tasks, users } from "../src/db/schema";

const DEMO_DOMAIN = "demo.eastwoodmontreux.ch";
const PASSWORD = process.env.DEMO_PASSWORD ?? "impact-demo-2026";
const YEAR = "2026/27";
const flag = (n: string) => process.argv.includes(`--${n}`);

type Phase = "exploration" | "execution" | "legacy";

const PEOPLE: {
  key: string; name: string; role: "student" | "coach" | "admin"; grade?: string; phase?: Phase;
}[] = [
  { key: "demo", name: "Demo Account", role: "admin" },
  { key: "r.chevalley", name: "Rémy Chevalley", role: "coach" },
  { key: "m.okonkwo", name: "Melissa Okonkwo", role: "coach" },
  { key: "s.ferrand", name: "Sofia Ferrand", role: "student", grade: "12", phase: "legacy" },
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
  stage: "ideation" | "commitment" | "execution" | "presentation";
  strands: string[];
  type: "internal" | "external" | "internal-to-external";
  proposal?: { idea: string; internal: string; external: string; feasibility: string };
  approved?: boolean;
  charter?: boolean;
  goals?: { kind: "deliverable" | "milestone" | "qualitative"; statement: string; measure: string; dueBy: string; progress: number }[];
  tasks?: { title: string; status: "backlog" | "doing" | "review" | "done" }[];
  criteria?: { label: string; met: boolean }[];
  cycles?: { plan: string; act: string; reflect: string; q: string }[];
  selfCard?: { ratings: Record<string, number>; notes: Record<string, string>; comment: string; period: string };
  coachCard?: { by: string; ratings: Record<string, number>; comment: string; period: string };
};

const SEEDS: Seed[] = [
  // The walkthrough project: furthest along, every feature populated.
  {
    who: "s.ferrand",
    project: "kickoff-voices-of-tomorrow",
    stage: "presentation",
    strands: ["Imagination", "Action", "Character", "Technologies"],
    type: "external",
    proposal: {
      idea: "A fortnightly podcast interviewing young people across the Riviera who have started something — a business, a campaign, a charity. Researched, recorded, edited and published entirely by students.",
      internal: "Students across year groups get a reason to practise interviewing, and a platform that is theirs rather than the school's. Three Grade 9s have already asked to produce an episode.",
      external: "Published publicly on the major podcast platforms. Guests reach an audience beyond their own network, and the school is visible in the region as somewhere students make things.",
      feasibility: "Recording space is the constraint — the music room is free on Thursdays. Equipment is borrowed from the media department. The real risk is guest scheduling, which is why episodes are fortnightly rather than weekly.",
    },
    approved: true,
    charter: true,
    goals: [
      { kind: "deliverable", statement: "Publish six episodes on a public feed", measure: "Six episodes live with named guests and show notes", dueBy: "End of Term 3", progress: 100 },
      { kind: "milestone", statement: "Run a pilot episode and act on the feedback before episode two", measure: "Pilot recorded, five listeners interviewed, changes written down", dueBy: "End of Term 1", progress: 100 },
      { kind: "qualitative", statement: "Hand the production process to a younger student who can run it without me", measure: "A Grade 10 produces an episode start to finish while I only observe", dueBy: "End of Term 3", progress: 70 },
    ],
    tasks: [
      { title: "Frame the problem in one sentence", status: "done" },
      { title: "Agree success criteria with Rémy", status: "done" },
      { title: "Book the music room for Thursdays", status: "done" },
      { title: "Record and publish episodes 1–6", status: "done" },
      { title: "Write the handover guide for next year's producer", status: "review" },
      { title: "Prepare the panel presentation", status: "doing" },
    ],
    criteria: [
      { label: "The outcome exists and someone outside the project has seen it", met: true },
      { label: "I can explain the problem I framed and why it mattered", met: true },
      { label: "I completed at least two Plan – Act – Reflect cycles", met: true },
      { label: "I acted on feedback from a coach or peer at least once", met: true },
    ],
    cycles: [
      {
        plan: "Record a pilot with one guest, publish it to five people only, and ask them what made them stop listening.",
        act: "Recorded with Nadia from the climate group. The audio was usable but the first six minutes were me explaining the project rather than asking her anything. Three of the five listeners said they nearly switched off.",
        reflect: "The intro was for me, not the listener. Cut it to twenty seconds and open on the guest's own words. I had assumed the problem would be technical and it was editorial.",
        q: "What makes someone keep listening past the first minute of something they did not choose?",
      },
      {
        plan: "Run episodes two to four on the new structure and see whether completion rates improve.",
        act: "Published three episodes in six weeks. Completion went from roughly 40% to over 70%. Episode four ran long because I did not cut a tangent I liked.",
        reflect: "I can edit other people's words but not my own. Asked Luca to do a final pass on episode five, which was shorter and better. Being precious about material is the thing to watch.",
        q: "Who should have the final cut on something that carries my name?",
      },
    ],
    selfCard: {
      ratings: { progress: 5, effort: 4, challenges: 3, collaborate: 4, adjustments: 5 },
      notes: {
        progress: "Six episodes out, which was the headline goal. The handover is the part still open.",
        effort: "Roughly four hours a week, more in the fortnight around a release.",
        challenges: "Guest cancellations twice. Solved by keeping one recorded episode in reserve.",
        collaborate: "Working with Luca on edits changed the project. I should have asked earlier.",
        adjustments: "Cut the intro, shortened episodes, handed the final cut to someone else.",
      },
      comment: "The thing I did not expect was that the hardest part would be giving it away. Teaching someone else to produce it is slower than doing it myself and I keep wanting to take the mouse back.",
      period: "Term 3, second half",
    },
    coachCard: {
      by: "r.chevalley",
      ratings: { initiative: 5, leadership: 4, creativity: 5, resilience: 5, ethics: 5 },
      comment: "Sofia has run this with almost no intervention from me since October. The pilot-then-change loop was hers, not something I suggested. The handover goal is the right one to be struggling with, and she is struggling with it honestly — she raised it before I did.",
      period: "Term 3, second half",
    },
  },
  // Mid-execution: a board in motion, goals partly met.
  {
    who: "l.brunner",
    project: "kickoff-sustainable-materials",
    stage: "execution",
    strands: ["Planet", "Technologies", "Action"],
    type: "internal-to-external",
    proposal: {
      idea: "Test whether mycelium packaging grown from local agricultural waste can replace the polystyrene the school kitchen receives deliveries in.",
      internal: "The kitchen throws out roughly two cubic metres of polystyrene a month. If this works it stops.",
      external: "Present findings at the cantonal sustainability forum in June, with samples.",
      feasibility: "Growing takes three weeks per batch and needs a warm dark space — the old darkroom works. Substrate from a farm in Villeneuve, free. The unknown is compressive strength.",
    },
    approved: true,
    charter: true,
    goals: [
      { kind: "deliverable", statement: "Produce five test samples at different substrate ratios", measure: "Five samples, documented, with compressive strength measured", dueBy: "End of Term 2", progress: 80 },
      { kind: "milestone", statement: "Complete one full grow-test-document cycle before scaling up", measure: "Cycle finished and written up", dueBy: "February", progress: 100 },
      { kind: "qualitative", statement: "Get comfortable presenting results that disprove my own hypothesis", measure: "Present a failed batch to the group without defending it", dueBy: "Ongoing", progress: 40 },
    ],
    tasks: [
      { title: "Source substrate from the farm", status: "done" },
      { title: "Set up the darkroom as a grow space", status: "done" },
      { title: "Grow batches 1–3", status: "done" },
      { title: "Compressive strength testing", status: "doing" },
      { title: "Batch 4 at a higher substrate ratio", status: "doing" },
      { title: "Write up for the sustainability forum", status: "backlog" },
      { title: "Ask the kitchen for delivery volume data", status: "backlog" },
    ],
    criteria: [
      { label: "The outcome exists and someone outside the project has seen it", met: false },
      { label: "I can explain the problem I framed and why it mattered", met: true },
      { label: "I completed at least two Plan – Act – Reflect cycles", met: true },
      { label: "I acted on feedback from a coach or peer at least once", met: true },
    ],
    cycles: [
      {
        plan: "Grow three batches at the ratios the paper recommends and see if any hold weight.",
        act: "Two contaminated in the first week. The third held 4kg before deforming — the target is 12kg.",
        reflect: "Sterilisation was the problem, not the ratio. I was treating a biology experiment like a materials one. Changed the process before changing the recipe.",
        q: "How much of what I am measuring is the material, and how much is my technique?",
      },
    ],
    selfCard: {
      ratings: { progress: 3, effort: 4, challenges: 4, collaborate: 3, adjustments: 4 },
      notes: {
        progress: "Behind on samples because two batches failed, but the process is now reliable.",
        challenges: "Contamination. Fixed by pressure-sterilising the substrate.",
        adjustments: "Changed the method before changing the formula — that was the right order.",
      },
      comment: "Losing two batches felt like losing three weeks. It was not: it taught me the thing the paper did not mention.",
      period: "Term 2",
    },
  },
  // Just approved: goals being set, board nearly empty — shows Stage 2.
  {
    who: "a.haddad",
    project: "action-tedx",
    stage: "commitment",
    strands: ["Action", "Imagination", "Character"],
    type: "external",
    proposal: {
      idea: "A student-run TEDx-format event with eight speakers, half from outside the school, on one theme chosen by the audience in advance.",
      internal: "Gives students who will never join debate club a reason to learn to hold a room.",
      external: "Open to parents and the town. Talks published afterwards.",
      feasibility: "Licence takes eight weeks. The hall is free in May. Biggest unknown is whether external speakers will come for a school event.",
    },
    approved: true,
    charter: false,
    goals: [
      { kind: "deliverable", statement: "Run the event with eight speakers and an audience of 100+", measure: "Event happens, attendance counted", dueBy: "May", progress: 10 },
      { kind: "milestone", statement: "Secure the TEDx licence", measure: "Licence granted in writing", dueBy: "February", progress: 50 },
    ],
    tasks: [
      { title: "Frame the problem in one sentence", status: "done" },
      { title: "Agree success criteria with a coach", status: "doing" },
      { title: "Submit the TEDx licence application", status: "doing" },
      { title: "Draft the speaker shortlist", status: "backlog" },
    ],
    criteria: [
      { label: "The outcome exists and someone outside the project has seen it", met: false },
      { label: "I can explain the problem I framed and why it mattered", met: true },
      { label: "I completed at least two Plan – Act – Reflect cycles", met: false },
      { label: "I acted on feedback from a coach or peer at least once", met: true },
    ],
  },
  // Stage 1, awaiting approval — shows the coach's queue.
  {
    who: "t.nakamura",
    project: "technologies-3d-printing-for-noisy-chairs",
    stage: "ideation",
    strands: ["Technologies", "Planet"],
    type: "internal",
    proposal: {
      idea: "Design and print replacement feet for the 200 classroom chairs that scrape. Measure the noise before and after.",
      internal: "Three teachers have complained about not being heard over chair noise in B-block.",
      external: "Publish the model file so other schools can print it.",
      feasibility: "Printer time is the constraint — roughly 20 minutes a foot, 800 feet. Needs a redesign for batch printing, or it takes a year.",
    },
    approved: false,
    charter: false,
    tasks: [
      { title: "Frame the problem in one sentence", status: "done" },
      { title: "Measure baseline noise in B-block", status: "doing" },
      { title: "Agree success criteria with a coach", status: "backlog" },
    ],
    criteria: [
      { label: "The outcome exists and someone outside the project has seen it", met: false },
      { label: "I can explain the problem I framed and why it mattered", met: true },
      { label: "I completed at least two Plan – Act – Reflect cycles", met: false },
      { label: "I acted on feedback from a coach or peer at least once", met: false },
    ],
  },
  // Exploration-phase students on smaller things.
  {
    who: "e.lindqvist",
    project: "imagination-book-club",
    stage: "execution",
    strands: ["Imagination", "Character"],
    type: "internal",
    proposal: {
      idea: "A book club for Grades 9 and 10 that reads one book a month chosen by vote, meeting Fridays.",
      internal: "Somewhere to talk about books that is not an English lesson.",
      external: "",
      feasibility: "Library room on Fridays. Copies are the issue — the library has four of most titles, so we read in rotation.",
    },
    approved: true,
    charter: true,
    goals: [
      { kind: "milestone", statement: "Hold six meetings with at least six people at each", measure: "Attendance recorded", dueBy: "End of Term 2", progress: 60 },
      { kind: "qualitative", statement: "Learn to run a discussion without doing most of the talking", measure: "A meeting where I speak less than a third of the time", dueBy: "Ongoing", progress: 30 },
    ],
    tasks: [
      { title: "Book the library room", status: "done" },
      { title: "Run the first vote on a title", status: "done" },
      { title: "Meetings 1–4", status: "done" },
      { title: "Sort out the copy rotation", status: "doing" },
      { title: "Invite a Grade 11 to co-run it", status: "backlog" },
    ],
    criteria: [
      { label: "The outcome exists and someone outside the project has seen it", met: true },
      { label: "I can explain the problem I framed and why it mattered", met: true },
      { label: "I completed at least two Plan – Act – Reflect cycles", met: false },
      { label: "I acted on feedback from a coach or peer at least once", met: true },
    ],
    cycles: [
      {
        plan: "Let the group pick the first book by vote rather than choosing it myself.",
        act: "They picked something I had not read. Nine people came to the first meeting, four to the second.",
        reflect: "The drop was not the book. I ran the second meeting like a lesson with questions I had prepared. The first one worked because nobody was in charge.",
        q: "What is the least structure a conversation needs before it stops being a conversation?",
      },
    ],
  },
  {
    who: "j.moreau",
    project: "movement-personal-fitness-program",
    stage: "ideation",
    strands: ["Movement"],
    type: "internal",
    proposal: {
      idea: "Build and follow a twelve-week conditioning programme for myself, tracking whether it changes anything measurable.",
      internal: "",
      external: "",
      feasibility: "Gym access at lunch. The hard part is knowing what to measure beyond how I feel.",
    },
    approved: false,
    charter: false,
    tasks: [
      { title: "Frame the problem in one sentence", status: "doing" },
      { title: "Decide what to measure", status: "backlog" },
    ],
  },
  // A second person on the podcast, so one project shows a roster > 1.
  {
    who: "l.brunner",
    project: "kickoff-voices-of-tomorrow",
    stage: "execution",
    strands: ["Imagination", "Technologies"],
    type: "external",
    proposal: {
      idea: "Edit and sound-design the Voices of Tomorrow podcast, and take over production next year.",
      internal: "Frees Sofia to focus on guests and keeps the show running after she leaves.",
      external: "Same audience as the main show.",
      feasibility: "Editing is roughly three hours an episode. Learning curve on the software was the main unknown and is now behind me.",
    },
    approved: true,
    charter: true,
    goals: [
      { kind: "deliverable", statement: "Edit episodes four to six to a standard Sofia does not need to revise", measure: "Three episodes published with no re-edit", dueBy: "End of Term 3", progress: 67 },
    ],
    tasks: [
      { title: "Learn the editing software", status: "done" },
      { title: "Edit episode 4", status: "done" },
      { title: "Edit episode 5", status: "done" },
      { title: "Edit episode 6", status: "doing" },
    ],
    criteria: [
      { label: "The outcome exists and someone outside the project has seen it", met: true },
      { label: "I can explain the problem I framed and why it mattered", met: true },
      { label: "I completed at least two Plan – Act – Reflect cycles", met: false },
      { label: "I acted on feedback from a coach or peer at least once", met: true },
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
    const [e] = await db().insert(enrolments).values({
      userId, projectSlug: s.project, role: "member",
      status: s.stage === "presentation" ? "active" : "active",
      stage: s.stage, targetStrands: s.strands, projectType: s.type,
      proposalIdea: s.proposal?.idea ?? "",
      proposalInternalImpact: s.proposal?.internal ?? "",
      proposalExternalImpact: s.proposal?.external ?? "",
      proposalFeasibility: s.proposal?.feasibility ?? "",
      proposalSubmittedAt: s.proposal ? new Date() : null,
      approvedAt: s.approved ? new Date() : null,
      approvedBy: s.approved ? ids.get("r.chevalley")! : null,
      leadCoachId: s.approved ? ids.get("r.chevalley")! : null,
      charterSignedAt: s.charter ? new Date() : null,
    }).returning({ id: enrolments.id });

    if (s.goals?.length) {
      await db().insert(goals).values(s.goals.map((g, i) => ({
        enrolmentId: e.id, kind: g.kind, statement: g.statement, measure: g.measure,
        dueBy: g.dueBy, progress: g.progress, achieved: g.progress >= 100, position: i,
      })));
    }
    if (s.tasks?.length) {
      await db().insert(tasks).values(s.tasks.map((t, i) => ({
        enrolmentId: e.id, title: t.title, status: t.status, position: i,
      })));
    }
    if (s.criteria?.length) {
      await db().insert(criteria).values(s.criteria.map((c, i) => ({
        enrolmentId: e.id, label: c.label, met: c.met, position: i,
      })));
    }
    if (s.cycles?.length) {
      await db().insert(reflections).values(s.cycles.map((c, i) => ({
        enrolmentId: e.id, cycle: i + 1, plan: c.plan, act: c.act, reflect: c.reflect, furtherQuestion: c.q,
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
  console.log(`\n  Sign in:  ${email("demo")}`);
  console.log(`  Password: ${PASSWORD}`);
  console.log(`\n  Student view:  ${email("s.ferrand")}  (same password)`);
  console.log(`  Coach view:    ${email("r.chevalley")}`);
  console.log(`\nAll demo accounts are on @${DEMO_DOMAIN}. Remove with: --clear\n`);
}

main().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
