import projectsJson from "@/data/projects.json";
import resourcesJson from "@/data/resources.json";
import peopleJson from "@/data/people.json";
import { STRANDS, strandOf, type Strand } from "@/lib/brand";

/**
 * The curriculum itself is versioned in git rather than stored in Postgres:
 * it changes a few times a term, by pull request, and every change should be
 * reviewable. Regenerate with `npm run data:extract`.
 */

export type Project = {
  slug: string;
  title: string;
  /** Exact wording from the planning workbook, before normalisation. */
  sourceTitle: string;
  strand: string | null;
  leads: string[];
  description: string;
  notes: string;
  sourceRow: number;
};

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
  sourceRow: number;
};

export type Person = {
  name: string;
  slug: string;
  projects: string[];
  resources: string[];
};

export const projects = projectsJson as Project[];
export const resources = resourcesJson as Resource[];
export const people = peopleJson as Person[];

const projectBySlug = new Map(projects.map((p) => [p.slug, p]));
const resourceBySlug = new Map(resources.map((r) => [r.slug, r]));

export function getProject(slug: string): Project | undefined {
  return projectBySlug.get(slug);
}

export function getResource(slug: string): Resource | undefined {
  return resourceBySlug.get(slug);
}

export function projectsInStrand(strand: Strand): Project[] {
  return projects.filter((p) => p.strand === strand.name);
}

export const unassignedProjects = projects.filter((p) => !p.strand);

export function strandFor(project: Project): Strand | null {
  return strandOf(project.strand);
}

export const corePractices = resources.filter((r) => r.corePractice);

export const resourceCategories = [
  "Project method",
  "Thinking & inquiry",
  "Assessment & feedback",
  "Character & culture",
  "Studio & making",
  "Logistics & rhythm",
  "Reading & references",
] as const;

export function resourcesByCategory(): { category: string; items: Resource[] }[] {
  return resourceCategories
    .map((category) => ({
      category,
      items: resources.filter((r) => r.category === category),
    }))
    .filter((group) => group.items.length > 0);
}

export const strandCounts = STRANDS.map((strand) => ({
  strand,
  count: projectsInStrand(strand).length,
}));

/**
 * Default success criteria offered when someone joins a project — the school's
 * "definition of done" practice, pre-filled so a student starts from a shape
 * rather than a blank page. They are editable per enrolment.
 */
export const DEFAULT_CRITERIA = [
  "The outcome exists and someone outside the project has seen it",
  "I can explain the problem I framed and why it mattered",
  "I completed at least two Plan – Act – Reflect cycles",
  "I acted on feedback from a coach or peer at least once",
];

export const DEFAULT_TASKS = [
  { title: "Frame the problem in one sentence", status: "backlog" as const },
  { title: "Agree success criteria with a coach", status: "backlog" as const },
  { title: "Book the first work session", status: "backlog" as const },
];
