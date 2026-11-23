/**
 * The IMPACT Handbook, Vol. 1 (v8) — the programme's own definitions.
 *
 * Everything in this file is taken from the handbook rather than inferred.
 * Where the planning workbook and the handbook disagree, the handbook wins:
 * it is the published description of the programme.
 */

/**
 * The phases a project moves through, from the Improvement Brief
 * (15 Oct 2026). Renamed from Ideation / Goals / Execution: these say what
 * the student does rather than what the programme calls it.
 *
 * A coach gates every move between phases. Between gates the student owns
 * the work.
 *
 * A fourth phase, Report, used to close the sequence. The page that carried
 * it is gone, so the phase is gone with it — a stage of the journey nothing
 * in the platform can reach is a promise, not a feature.
 */
export type PhaseKey = "create" | "plan" | "execute";

export type ProjectPhase = {
  key: PhaseKey;
  number: number;
  name: string;
  verb: string;
  summary: string;
  /** What has to exist before a coach can pass the project to the next phase. */
  gate: string;
};

export const PHASES_OF_WORK: ProjectPhase[] = [
  {
    key: "create",
    number: 1,
    name: "Create",
    verb: "From idea to an approved Impact Proposal",
    summary:
      "Work out who is affected, what would be different, and how you would know. The proposal goes to a coach.",
    gate: "A coach has approved the Impact Proposal.",
  },
  {
    key: "plan",
    number: 2,
    name: "Plan",
    verb: "Turn the proposal into a dated plan",
    summary:
      "Three to five measurable success criteria, three to six dated milestones, and the people outside school you depend on.",
    gate: "A coach has validated the plan and the charter is signed.",
  },
  {
    key: "execute",
    number: 3,
    name: "Execute",
    verb: "Weekly rhythm and evidence",
    summary:
      "Do the work. Log evidence against each milestone and keep the indicator moving toward its target.",
    gate: "Every milestone has evidence a coach has validated.",
  },
];

/**
 * The Impact Proposal. Every field carries a strong and a weak example —
 * students write better when they can see what good looks like.
 */
export const PROPOSAL_FIELDS = [
  {
    key: "problem" as const,
    label: "The problem, in one sentence",
    hint: "Something specific that is true today.",
    good: "Year 7s eat lunch alone on their first days because nobody is responsible for introducing them.",
    weak: "People are lonely at school.",
    limit: 200,
  },
  {
    key: "whoAffected" as const,
    label: "Who is affected, and roughly how many",
    hint: "Name the group and put a number on it, even an estimate.",
    good: "About 60 new Year 7s each September, plus the 12 tutors who pick up the fallout.",
    weak: "Lots of students.",
    limit: 200,
  },
  {
    key: "whatChanges" as const,
    label: "What will be different if this works",
    hint: "Describe the situation afterwards, not the activity.",
    good: "Every new Year 7 has someone who knows their name in week one.",
    weak: "We will run a buddy scheme.",
    limit: 240,
  },
  {
    key: "deliverable" as const,
    label: "What I will deliver",
    hint: "The tangible thing that exists at the end.",
    good: "A trained buddy team of 20, a matching system, and a handover guide for next year.",
    weak: "A better experience for new students.",
    limit: 240,
  },
  {
    key: "skills" as const,
    label: "What I want to learn",
    hint: "Two or three skills, named.",
    good: "Running a training session, recruiting volunteers, and handling it when people drop out.",
    weak: "Leadership.",
    limit: 200,
  },
  {
    key: "needs" as const,
    label: "What I need",
    hint: "People, partners, budget, materials.",
    good: "Twenty volunteers, 30 minutes in a tutor meeting, CHF 80 for lanyards.",
    weak: "Some help.",
    limit: 240,
  },
  {
    key: "risk" as const,
    label: "Main risk, and plan B",
    hint: "The thing most likely to stop this, and what you would do instead.",
    good: "Volunteers lose interest by October. Plan B: run it as a four-week commitment, not a year.",
    weak: "It might not work.",
    limit: 240,
  },
] as const;

/** The indicator is the heart of "impact first": one number, measured twice. */
export const INDICATOR_FIELDS = {
  name: { label: "The one thing we will measure", good: "New Year 7s who can name a buddy", weak: "Happiness" },
  baseline: { label: "Where it is today", good: "0 of 60", weak: "Low" },
  target: { label: "Where we want it", good: "50 of 60 by October half-term", weak: "Higher" },
} as const;
/**
 * Progression is by demonstrated readiness, not chronological age — a stated
 * core belief of the school. Grades are the typical rhythm, not a rule.
 */
export const PHASES = [
  {
    key: "exploration",
    name: "Exploration",
    typicalGrade: "Grade 9",
    summary:
      "Discovery. Smaller projects, hands-on mentorship, several strands sampled. The emphasis is curiosity and learning how to learn through doing, not perfection.",
    expectation: "Several smaller projects, often joining initiatives led by more experienced peers.",
  },
  {
    key: "execution",
    name: "Execution & Leadership",
    typicalGrade: "Grades 10–11",
    summary:
      "The shift from participation to delivery. Defined leadership roles, real audiences, greater ambition, and coaches who facilitate rather than direct.",
    expectation: "One or two substantial projects at a time, with goals tied to both output and personal growth.",
  },
  {
    key: "legacy",
    name: "Legacy",
    typicalGrade: "Grade 12",
    summary:
      "One major initiative carried through with depth, maturity and measurable external impact — aligned to the student's academic interests and future pathway.",
    expectation:
      "A single Legacy Project that may outlive graduation: handed to younger students, or grown into an independent venture.",
  },
] as const;
