import type { Metadata } from "next";

import { ProjectFilters } from "@/components/ProjectFilters";
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
      <SectionHeading
        eyebrow="The menu"
        title={`${projects.length} projects`}
        description="Everything the IMPACT team has put on the table. Filter by strand, or search for something you already have in mind."
      />
      <ProjectFilters projects={withCounts} />
    </>
  );
}
