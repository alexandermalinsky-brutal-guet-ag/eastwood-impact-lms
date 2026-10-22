import type { Metadata } from "next";

import { ProjectFilters } from "@/components/ProjectFilters";
import { StartProject } from "@/components/StartProject";
import { SectionHeading } from "@/components/ui";
import { projects } from "@/lib/curriculum";
import { enrolmentCounts } from "@/lib/queries";

export const metadata: Metadata = { title: "Projects" };
export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const counts = await enrolmentCounts();
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
          <StartProject />
        </div>
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
