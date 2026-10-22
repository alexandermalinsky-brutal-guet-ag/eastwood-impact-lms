/**
 * The IMPACT Handbook, Vol. 1 (v8) — the programme's own definitions.
 *
 * Everything in this file is taken from the handbook rather than inferred.
 * Where the planning workbook and the handbook disagree, the handbook wins:
 * it is the published description of the programme.
 */

/**
 * The four phases a project moves through, from the Improvement Brief
 * (15 Oct 2026). Renamed from Ideation / Goals / Execution / Presentation:
 * these say what the student does rather than what the programme calls it.
 *
 * A coach gates every move between phases. Between gates the student owns
 * the work.
 */
export type PhaseKey = "create" | "plan" | "execute" | "report";

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
  {
    key: "report",
    number: 4,
    name: "Report",
    verb: "Prove what changed",
    summary:
      "Target against result, the best evidence, what you leave behind, and an honest reflection on what did not work.",
    gate: "The Impact Report has been presented and signed off.",
  },
];

export const PHASE_BY_KEY = new Map(PHASES_OF_WORK.map((p) => [p.key, p]));
export const PHASE_ORDER: PhaseKey[] = PHASES_OF_WORK.map((p) => p.key);

/**
 * The level map. A level unlocks only when the student submits evidence and a
 * coach validates it — evidence unlocks, not activity. Levels 1-3 and 7 are
 * the same for every project; 4-6 are adapted within the frame.
 */
export type Level = {
  n: number;
  phase: PhaseKey;
  milestone: string;
  evidence: string;
  /** Null where the level is adapted per project rather than fixed. */
  fixed: boolean;
};

export const LEVELS: Level[] = [
  { n: 1, phase: "create", milestone: "Problem framed", fixed: true,
    evidence: "A one-sentence problem, plus proof you talked to three people affected by it." },
  { n: 2, phase: "create", milestone: "Proposal approved", fixed: true,
    evidence: "An Impact Proposal with a baseline and a target, approved by a coach." },
  { n: 3, phase: "plan", milestone: "Plan locked", fixed: true,
    evidence: "Dated milestones and a definition of done, with the charter signed." },
  { n: 4, phase: "execute", milestone: "First real test", fixed: false,
    evidence: "A photo, prototype or first event — and what you learned from it." },
  { n: 5, phase: "execute", milestone: "Mid-showcase", fixed: false,
    evidence: "A short presentation to peers, and the feedback you got back." },
  { n: 6, phase: "execute", milestone: "Impact measured", fixed: false,
    evidence: "The indicator updated against its target, with the source of the number." },
  { n: 7, phase: "report", milestone: "Final showcase", fixed: true,
    evidence: "The Impact Report, presented to the panel." },
];

export const LEVEL_BY_N = new Map(LEVELS.map((l) => [l.n, l]));
export const MAX_LEVEL = LEVELS.length;

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

export type ProposalFieldKey = (typeof PROPOSAL_FIELDS)[number]["key"];

/** The indicator is the heart of "impact first": one number, measured twice. */
export const INDICATOR_FIELDS = {
  name: { label: "The one thing we will measure", good: "New Year 7s who can name a buddy", weak: "Happiness" },
  baseline: { label: "Where it is today", good: "0 of 60", weak: "Low" },
  target: { label: "Where we want it", good: "50 of 60 by October half-term", weak: "Higher" },
} as const;
/**
 * Goal types. The handbook is explicit that a project's 3–5 goals should
 * combine all three, and that the qualitative ones are deliberate: judgment,
 * perseverance and ethical awareness cannot be reduced to numerical targets.
 */
export type GoalKind = "deliverable" | "milestone" | "qualitative";

export const GOAL_KINDS: {
  key: GoalKind;
  label: string;
  hint: string;
  colour: string;
}[] = [
  {
    key: "deliverable",
    label: "Tangible deliverable",
    hint: "A prototype, publication, event or campaign — something that exists at the end.",
    colour: "var(--color-blue-purple)",
  },
  {
    key: "milestone",
    label: "Process milestone",
    hint: "A stage in the project lifecycle: a testing phase, an iteration, an engagement cycle.",
    colour: "var(--color-mustard)",
  },
  {
    key: "qualitative",
    label: "Qualitative growth",
    hint: "Leadership, collaboration quality, resilience. Observed and discussed, not counted.",
    colour: "var(--color-forest-green)",
  },
];

/**
 * The Student IMPACT Scorecard — a reflective tool reviewed by a coach, not a
 * self-grading exercise. Completed bi-monthly.
 */
export const STUDENT_SCORECARD = [
  { key: "progress", label: "Assess progress", hint: "How far have you actually advanced toward your goals?" },
  { key: "effort", label: "Manage effort", hint: "What commitment and time have you put in?" },
  { key: "challenges", label: "Identify challenges", hint: "What obstacles and difficulties have surfaced?" },
  { key: "collaborate", label: "Collaborate", hint: "How well is the team working and communicating?" },
  { key: "adjustments", label: "Make adjustments", hint: "What are you changing as a result of this reflection?" },
] as const;

/**
 * The Coach Scorecard — completed twice per month and calibrated in the Coach
 * Council to reduce individual bias.
 */
export const COACH_SCORECARD = [
  { key: "initiative", label: "Initiative and ownership" },
  { key: "leadership", label: "Leadership and collaboration" },
  { key: "creativity", label: "Creativity and problem-solving" },
  { key: "resilience", label: "Resilience and adaptability" },
  { key: "ethics", label: "Ethical behaviour and responsibility" },
] as const;

export type ScorecardKey =
  | (typeof STUDENT_SCORECARD)[number]["key"]
  | (typeof COACH_SCORECARD)[number]["key"];

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

/** The student's own progression, distinct from a project's phase of work. */
export type ProgressionPhaseKey = (typeof PHASES)[number]["key"];

/** How a project engages the world beyond the project team. */
export const PROJECT_TYPES = [
  { key: "internal", label: "Internal", hint: "Impact within the school community." },
  { key: "external", label: "External", hint: "Engages audiences, partners or stakeholders outside the school." },
  {
    key: "internal-to-external",
    label: "Internal → External",
    hint: "Starts inside the school and is taken outward as it matures.",
  },
] as const;

export type ProjectType = (typeof PROJECT_TYPES)[number]["key"];

/** The handbook's categories of external impact. No category is privileged. */
export const EXTERNAL_CATEGORIES = [
  {
    key: "community",
    name: "Community and social impact",
    description:
      "Needs within local or global communities — wellbeing initiatives, educational outreach, awareness campaigns, social innovation. Develops empathy and ethical judgment.",
  },
  {
    key: "cultural",
    name: "Cultural and creative contribution",
    description:
      "Storytelling, performance, media and artistic production shared publicly. Emphasises communication, creativity and audience engagement.",
  },
  {
    key: "environmental",
    name: "Environmental and sustainability",
    description:
      "Stewardship, conservation and regenerative practice. Students confront real trade-offs between ambition, feasibility and impact.",
  },
  {
    key: "technological",
    name: "Technological and entrepreneurial",
    description:
      "Designing, prototyping or testing tools, platforms and services with real users. Develops iteration and ethical awareness around technology.",
  },
  {
    key: "research",
    name: "Research, advocacy and knowledge sharing",
    description:
      "Investigation, analysis and public dissemination — data collection, policy research, or content aimed at changing understanding or behaviour.",
  },
] as const;

/**
 * Coaching roles. Every project has a Lead Strand Coach; Co-Strand Coaches and
 * External Mentors are added where the project needs them.
 */
export const COACH_ROLES = [
  {
    key: "lead",
    name: "Lead Strand Coach",
    responsibility: "Overall direction and coherence, progress against goals, and learning outcomes.",
  },
  {
    key: "co",
    name: "Co-Strand Coach",
    responsibility: "Targeted expertise and domain-specific feedback on one dimension of the project.",
  },
  {
    key: "external",
    name: "External Mentor",
    responsibility: "Industry or community perspective, increasing authenticity and relevance.",
  },
] as const;

/** Cadences the handbook fixes explicitly. */
export const RHYTHMS = [
  { what: "Structured work sessions", cadence: "Weekly" },
  { what: "Coach Scorecards", cadence: "Twice monthly" },
  { what: "Coach Council", cadence: "Twice monthly" },
  { what: "Student reflection logs", cadence: "Bi-monthly" },
  { what: "Mini-showcases", cadence: "At regular intervals" },
] as const;
