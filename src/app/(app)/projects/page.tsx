import type { Metadata } from "next";

import { auth } from "@/auth";
import { ProjectFilters } from "@/components/ProjectFilters";
import { ProjectIdeas } from "@/components/ProjectIdeas";
import { StartProject } from "@/components/StartProject";
import { SectionHeading } from "@/components/ui";
import { projects } from "@/lib/curriculum";
import { coachList, enrolmentCounts, projectIdeaList } from "@/lib/queries";

export const metadata: Metadata = { title: "Projects" };
export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const session = await auth();
  const user = session!.user;
  const [counts, coaches, ideas] = await Promise.all([
    enrolmentCounts(),
    coachList(),
    projectIdeaList(),
  ]);
  const withCounts = projects.map((project) => ({
    ...project,
    members: counts.get(project.slug) ?? 0,
  }));

  return (
    <>
      <section className="mb-10 rounded-[14px] border border-line bg-surface p-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Start your own project</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">
          The best projects come from something you have actually noticed. The list below is for
          inspiration when you are stuck — not a menu you have to pick from.
        </p>
        <div className="mt-4">
          <StartProject coaches={coaches} />
        </div>
      </section>

      <section id="ideas" className="mb-12 scroll-mt-20">
        <SectionHeading
          eyebrow="From other students"
          title="Project ideas"
          description="Things people thought were worth doing but are not running themselves. Take one on and it becomes your project, with your coach."
        />
        <ProjectIdeas
          ideas={ideas}
          coaches={coaches}
          meId={user.id}
          canModerate={user.role !== "student"}
        />
      </section>

      <SectionHeading
        eyebrow="Or borrow an idea"
        title={`${projects.length} projects other people have suggested`}
        description="Each one is a starting point. You still write your own proposal: who it is for, what changes, and how you would know."
      />
      <ProjectFilters projects={withCounts} />
    </>
  );
}
