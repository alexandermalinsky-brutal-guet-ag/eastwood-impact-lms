/**
 * Eastwood Montreux brand system.
 *
 * Every value here is taken directly from "Eastwood Montreux — Logo Standards /
 * Artwork Sheet" (Ciara Jenkins, 1 Dec 2025). Do not introduce colours that are
 * not on the sheet; add them to the sheet first.
 */

export const brand = {
  primary: {
    deepBlue: "#000077", // Pantone 2747 C
    royalPurple: "#500591", // Pantone 267 C
    lightPurple: "#b494cb", // Pantone 2100 C
  },
  secondary: {
    appleGreen: "#ced93b", // Pantone 382 C
    bluePurple: "#5254be", // Pantone 2125 C
    turquoise: "#01b6c9", // Pantone 3115 C
    mustard: "#cd9c00", // Pantone 7555 C
    forestGreen: "#006242", // Pantone 348 C
    moonrock: "#65a6ba", // Pantone 2169 C
    black: "#000000", // Pantone Black C
  },
} as const;

export type StrandName =
  | "Imagination"
  | "Movement"
  | "Planet"
  | "Action"
  | "Character"
  | "Technologies";

export type Strand = {
  name: StrandName;
  letter: string;
  slug: string;
  colour: string;
  /** Ink colour that meets contrast on `colour`. */
  ink: string;
  /** The handbook's one-line characterisation of the strand. */
  definition: string;
  /** The handbook's opening statement of what the strand is. */
  summary: string;
  /** What the strand develops, verbatim from the handbook's bullet lists. */
  develops: string[];
  /** What projects in this strand tend to involve. */
  projectsMay: string[];
};

/**
 * The six strands spell IMPACT. Definitions are taken from The IMPACT Handbook
 * Vol. 1, section 3 — not paraphrased. Each is assigned one colour from the
 * secondary palette; the primary palette stays reserved for chrome so strands
 * remain legible against it.
 *
 * Note the handbook names the sixth strand "Technologies", plural. The planning
 * workbook says "Technology"; the extraction script maps the workbook's spelling
 * onto this one.
 */
export const STRANDS: Strand[] = [
  {
    name: "Imagination",
    letter: "I",
    slug: "imagination",
    colour: brand.secondary.bluePurple,
    ink: "#ffffff",
    definition: "Disciplined creativity",
    summary:
      "The capacity to envision alternatives — ideas, narratives, solutions and futures. Within IMPACT, imagination is treated more broadly and more rigorously than artistic expression alone.",
    develops: [
      "Frame problems in original ways",
      "Generate hypotheses and possibilities",
      "See connections others may overlook",
      "Design solutions that do not yet exist",
    ],
    projectsMay: [
      "Concept development and storytelling",
      "Design of new systems, products or experiences",
      "Creative reinterpretation of existing challenges",
    ],
  },
  {
    name: "Movement",
    letter: "M",
    slug: "movement",
    colour: brand.secondary.appleGreen,
    ink: "#12130a",
    definition: "Energy that sustains performance",
    summary:
      "The relationship between physical engagement, mental wellbeing, energy management and sustained performance. Not limited to sport — sustained excellence depends on more than intellectual capacity alone.",
    develops: [
      "Physical engagement and health",
      "Emotional regulation and stress management",
      "Discipline, routine and stamina",
      "Awareness of the body as a contributor to performance",
    ],
    projectsMay: [
      "Wellbeing initiatives",
      "Performance optimisation",
      "Habit formation and resilience",
      "The interaction between physical health and cognitive effectiveness",
    ],
  },
  {
    name: "Planet",
    letter: "P",
    slug: "planet",
    colour: brand.secondary.forestGreen,
    ink: "#ffffff",
    definition: "Ethical reasoning grounded in systems thinking",
    summary:
      "Environmental responsibility and long-term systems thinking. Preparing students for the future requires more than awareness — it requires agency and stewardship.",
    develops: [
      "Understand environmental systems and interdependencies",
      "Consider long-term consequences of human activity",
      "Design solutions oriented toward sustainability and regeneration",
      "Act with responsibility toward future generations",
    ],
    projectsMay: [
      "Moving beyond short-term optimisation to consider broader impact",
      "Work where ambition, feasibility and impact genuinely trade off",
    ],
  },
  {
    name: "Action",
    letter: "A",
    slug: "action",
    colour: brand.secondary.mustard,
    ink: "#1a1300",
    definition: "Disciplined execution",
    summary:
      "The strand that transforms intention into execution. Many environments reward planning and ideation; fewer give students structured practice at delivery. Action addresses that gap directly.",
    develops: [
      "Planning and prioritisation",
      "Execution under constraints",
      "Iteration based on feedback",
      "Time management and follow-through",
      "Accountability for outcomes",
    ],
    projectsMay: [
      "Confronting the realities of implementation — setbacks, trade-offs, imperfect conditions",
    ],
  },
  {
    name: "Character",
    letter: "C",
    slug: "character",
    colour: brand.secondary.moonrock,
    ink: "#0a1518",
    definition: "How you behave when outcomes matter",
    summary:
      "Character is not taught through instruction alone. It is shaped by experience — situations where decisions affect others, commitments must be honoured, feedback must be acted upon, and failure must be acknowledged.",
    develops: [
      "Integrity and ethical judgment",
      "Empathy and respect for others",
      "Responsibility and reliability",
      "Resilience in the face of failure",
      "The ability to collaborate constructively",
    ],
    projectsMay: [
      "Real responsibility, social interaction and consequence",
    ],
  },
  {
    name: "Technologies",
    letter: "T",
    slug: "technologies",
    colour: brand.secondary.turquoise,
    ink: "#00171a",
    definition: "Judgment, responsibility and purpose",
    summary:
      "Students' relationship with digital tools, data and emerging systems. The question is no longer whether students will use digital tools, but how thoughtfully and responsibly they will do so.",
    develops: [
      "Critical understanding of technological systems",
      "Responsible and ethical use of digital tools",
      "Awareness of limitations, biases and unintended consequences",
      "The ability to select technology as an enabler, not a crutch",
    ],
    projectsMay: [
      "Development of digital products or platforms",
      "Data analysis and visualisation",
      "Use of AI-assisted tools",
      "Media production and dissemination",
    ],
  },
];

export const STRAND_BY_NAME = new Map(STRANDS.map((s) => [s.name, s]));
export const STRAND_BY_SLUG = new Map(STRANDS.map((s) => [s.slug, s]));

export function strandOf(name: string | null | undefined): Strand | null {
  if (!name) return null;
  return STRAND_BY_NAME.get(name as StrandName) ?? null;
}

export function strandsOf(names: string[] | null | undefined): Strand[] {
  if (!names) return [];
  return names.map(strandOf).filter((s): s is Strand => s !== null);
}

/**
 * The strands are an integrated system, not discrete tracks: "No strand stands
 * alone; each sharpens and constrains the others." Projects are expected to
 * span several and make the connections explicit.
 */
export const INTEGRATION_NOTE =
  "The strands are not discrete tracks. Complex challenges need imagination to frame possibilities, action to move them forward, character to guide decisions, technologies to extend capability, and planetary awareness to keep it responsible.";

/** Fallback treatment for projects that have not been given a strand yet. */
export const UNASSIGNED = {
  name: "Needs a strand",
  slug: "unassigned",
  colour: "#8b8b9a",
  ink: "#ffffff",
} as const;
