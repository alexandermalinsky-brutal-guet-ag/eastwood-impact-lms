/**
 * The IMPACT Handbook, Vol. 1 (v8) — the programme's own definitions.
 *
 * Everything in this file is taken from the handbook rather than inferred.
 * Where the planning workbook and the handbook disagree, the handbook wins:
 * it is the published description of the programme.
 */

/** The four stages every project moves through, at every grade. */
export type StageKey = "ideation" | "commitment" | "execution" | "presentation";

export type Stage = {
  key: StageKey;
  number: number;
  name: string;
  shortName: string;
  summary: string;
  /** What the student actually does in this stage. */
  activities: string[];
  /** What has to exist before the stage is complete. */
  deliverable: string;
};

export const STAGES: Stage[] = [
  {
    key: "ideation",
    number: 1,
    name: "Ideation & Feedback",
    shortName: "Ideation",
    summary:
      "Turns curiosity into a reviewable proposal through guided exploration. Deliberately exploratory, but not unstructured.",
    activities: [
      "Explore personal interests, strengths and real-world challenges",
      "Work through design thinking, systems mapping and problem framing",
      "Gather feedback from stakeholders before committing",
      "Form a team on complementary skills and shared motivation, not age",
    ],
    deliverable:
      "A Project Proposal: the core idea, intended internal and external impact, targeted IMPACT strands, and initial feasibility.",
  },
  {
    key: "commitment",
    number: 2,
    name: "Goals & Commitments",
    shortName: "Goals",
    summary:
      "The transition from exploration to commitment. The proposal is approved, coaches are assigned, and ambition becomes measurable.",
    activities: [
      "Receive formal approval for the proposal",
      "Have a Lead Strand Coach assigned, plus any Co-Strand Coaches",
      "Agree three to five SMART goals with your coaches",
      "Sign the Commitment Charter",
    ],
    deliverable:
      "An approved project with 3–5 agreed SMART goals and a signed Commitment Charter.",
  },
  {
    key: "execution",
    number: 3,
    name: "Development, Coaching & Execution",
    shortName: "Execution",
    summary:
      "The longest and most demanding phase, where ideas are tested against reality. The execution engine of IMPACT.",
    activities: [
      "Weekly structured work sessions",
      "Regular coach feedback and guidance",
      "Bi-monthly reflection logs documenting effort, learning and setbacks",
      "Mini-showcases presenting intermediate outcomes for feedback",
    ],
    deliverable:
      "A working body of evidence: reflection logs, mini-showcase feedback, and progress against goals.",
  },
  {
    key: "presentation",
    number: 4,
    name: "Presentation, Reflection & Evaluation",
    shortName: "Presentation",
    summary:
      "Consolidation, articulation and evaluation. Projects that miss their external outcomes are not failures when the reflection is honest.",
    activities: [
      "Produce the final product or demonstrable outcome",
      "Assemble a reflective portfolio across the IMPACT strands",
      "Present formally to an IMPACT Panel of coaches, peers and invited guests",
      "Receive evaluation from goals, scorecards, reflections and audience feedback",
    ],
    deliverable:
      "A final outcome, a reflective portfolio, and a panel presentation — all feeding the student's Impact Profile.",
  },
];

export const STAGE_BY_KEY = new Map(STAGES.map((s) => [s.key, s]));
export const STAGE_ORDER: StageKey[] = STAGES.map((s) => s.key);

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

export type PhaseKey = (typeof PHASES)[number]["key"];

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
