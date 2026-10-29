import resourcesJson from "@/data/resources.json";

/**
 * The curriculum itself is versioned in git rather than stored in Postgres:
 * it changes a few times a term, by pull request, and every change should be
 * reviewable. Regenerate with `npm run data:extract`.
 */

export type Resource = {
  slug: string;
  title: string;
  sourceTitle: string;
  category: string;
  strand: string | null;
  focus: string;
  leads: string[];
  /** Flagged priority 1 in the workbook — the practices being rolled out first. */
  corePractice: boolean;
  notes: string;
  url: string;
  alsoListedAs: string[];
  /** Which phase of work this practice helps with, where it maps to one. */
  phase: string;
  /** False when the page has nothing on it yet — those stay hidden. */
  written: boolean;
  /** Whether this came from the planning workbook or a published document. */
  origin: "workbook" | "handbook";
  author: string;
  year: string;
  /** Formal citation, for entries in the evidence base. */
  citation: string;
  /** Internal route, where the document has a page on this platform. */
  href: string;
  sourceRow: number;
};

const allResources = resourcesJson as Resource[];

export const resources = allResources.filter((r) => r.written);

/** Named but not yet written — surfaced to staff so the gap is visible. */
export const unwrittenResources = allResources.filter((r) => !r.written);

const resourceBySlug = new Map(allResources.map((r) => [r.slug, r]));

export function getResource(slug: string): Resource | undefined {
  return resourceBySlug.get(slug);
}

export const corePractices = resources.filter(
  (r) => r.corePractice && r.category !== "Documentation",
);

/** The documents the programme runs on, and the research behind it. */
export const documents = resources.filter((r) => r.category === "Documentation");
export const evidenceBase = resources.filter((r) => r.category === "Evidence base");

export const resourceCategories = [
  "Documentation",
  "Project method",
  "Thinking & inquiry",
  "Assessment & feedback",
  "Character & culture",
  "Studio & making",
  "Logistics & rhythm",
  "Reading & references",
  "Evidence base",
] as const;

export function resourcesByCategory(): { category: string; items: Resource[] }[] {
  return resourceCategories
    .map((category) => ({
      category,
      items: resources.filter((r) => r.category === category),
    }))
    .filter((group) => group.items.length > 0);
}

export function practicesByPhase(phase: string): Resource[] {
  return resources.filter((r) => r.phase === phase);
}
