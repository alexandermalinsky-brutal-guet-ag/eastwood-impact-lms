import type { Metadata } from "next";

import { auth } from "@/auth";
import { PostIdea } from "@/components/PostIdea";
import { ProjectIdeas } from "@/components/ProjectIdeas";
import { StartProject } from "@/components/StartProject";
import { SectionHeading } from "@/components/ui";
import { formatRelative } from "@/lib/dates";
import { coachList, projectIdeaList } from "@/lib/queries";

export const metadata: Metadata = { title: "Project Hub" };
export const dynamic = "force-dynamic";

/**
 * The ideas board. The 92-project catalogue generated from the planning
 * workbook used to sit under this — it was a menu nobody picked from, and
 * most of it had no brief written and nobody named against it. What students
 * put up for each other is the part that was worth keeping.
 */
export default async function ProjectsPage() {
  const session = await auth();
  const user = session!.user;
  const [coaches, rows] = await Promise.all([coachList(), projectIdeaList()]);

  // "a month ago" is computed here, not in the card: it reads the clock, and
  // doing that again during hydration would tear the page.
  const now = new Date();
  const ideas = rows.map((idea) => ({ ...idea, posted: formatRelative(idea.createdAt, now) }));

  return (
    <>
      <SectionHeading
        eyebrow="From other students"
        title="Project ideas"
        description="Things people thought were worth doing but are not running themselves. Take one on and it becomes your project, with your coach."
        action={
          <div className="flex flex-wrap gap-2">
            <StartProject coaches={coaches} />
            <PostIdea />
          </div>
        }
      />

      <ProjectIdeas
        ideas={ideas}
        coaches={coaches}
        meId={user.id}
        canModerate={user.role !== "student"}
      />
    </>
  );
}
