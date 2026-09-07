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
  | "Technology";

export type Strand = {
  name: StrandName;
  letter: string;
  slug: string;
  colour: string;
  /** Ink colour that meets contrast on `colour`. */
  ink: string;
  tagline: string;
  description: string;
};

/**
 * The six strands spell IMPACT. Each is assigned one colour from the secondary
 * palette; the primary palette is reserved for chrome so strands stay legible
 * against it.
 */
export const STRANDS: Strand[] = [
  {
    name: "Imagination",
    letter: "I",
    slug: "imagination",
    colour: brand.secondary.bluePurple,
    ink: "#ffffff",
    tagline: "Make something that did not exist",
    description:
      "Writing, film, music, art and performance. Projects in this strand end in a made thing an audience can experience.",
  },
  {
    name: "Movement",
    letter: "M",
    slug: "movement",
    colour: brand.secondary.appleGreen,
    ink: "#12130a",
    tagline: "Train the body, read the data",
    description:
      "Sport, dance, the outdoors and the science underneath them — coaching, conditioning, choreography and performance analysis.",
  },
  {
    name: "Planet",
    letter: "P",
    slug: "planet",
    colour: brand.secondary.forestGreen,
    ink: "#ffffff",
    tagline: "Leave the place measurably better",
    description:
      "Sustainability work with a measurable footprint — waste, energy, materials and the systems that connect them.",
  },
  {
    name: "Action",
    letter: "A",
    slug: "action",
    colour: brand.secondary.mustard,
    ink: "#1a1300",
    tagline: "Put it in front of real people",
    description:
      "Events, enterprise, competition and service. The test of an Action project is that someone outside the school turns up.",
  },
  {
    name: "Character",
    letter: "C",
    slug: "character",
    colour: brand.secondary.moonrock,
    ink: "#0a1518",
    tagline: "Become someone others can rely on",
    description:
      "Mentoring, service, leadership and expedition — the strand where the learning is who you are when the project gets hard.",
  },
  {
    name: "Technology",
    letter: "T",
    slug: "technology",
    colour: brand.secondary.turquoise,
    ink: "#00171a",
    tagline: "Build the tool, not just the deck",
    description:
      "Software, hardware, fabrication and media production — shipping something that runs after you walk away from it.",
  },
];

export const STRAND_BY_NAME = new Map(STRANDS.map((s) => [s.name, s]));
export const STRAND_BY_SLUG = new Map(STRANDS.map((s) => [s.slug, s]));

export function strandOf(name: string | null | undefined): Strand | null {
  if (!name) return null;
  return STRAND_BY_NAME.get(name as StrandName) ?? null;
}

/** Fallback treatment for projects that have not been given a strand yet. */
export const UNASSIGNED = {
  name: "Needs a strand",
  slug: "unassigned",
  colour: "#8b8b9a",
  ink: "#ffffff",
} as const;
