import type { Metadata } from "next";
import Link from "next/link";

import { Card, SectionHeading } from "@/components/ui";
import {
  corePractices,
  resources,
  resourcesByCategory,
} from "@/lib/curriculum";

export const metadata: Metadata = { title: "Toolkit" };

export default function ToolkitPage() {
  const groups = resourcesByCategory();

  return (
    <>
      <SectionHeading
        eyebrow="Teaching practices"
        title="The IMPACT toolkit"
        description={`${resources.length} practices, methods and references the team draws on. The ${corePractices.length} marked as core are the ones being rolled out first, each with a member of staff who owns it.`}
      />

      <section className="mb-12">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.16em] text-royal-purple">
          Core practices
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {corePractices.map((practice) => (
            <Link key={practice.slug} href={`/toolkit/${practice.slug}`}>
              <Card className="h-full border-l-4 border-l-royal-purple transition-shadow hover:shadow-md">
                <p className="font-semibold leading-snug text-ink">
                  {practice.title}
                </p>
                <p className="mt-1.5 text-xs text-muted">
                  {practice.leads.length
                    ? `Owned by ${practice.leads.join(" & ")}`
                    : "No owner yet"}
                </p>
                {practice.notes ? (
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {practice.notes}
                  </p>
                ) : null}
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {groups.map((group) => (
        <section key={group.category} className="mb-10">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.16em] text-muted">
            {group.category}{" "}
            <span className="tabular-nums opacity-60">{group.items.length}</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {group.items.map((resource) => (
              <Link
                key={resource.slug}
                href={`/toolkit/${resource.slug}`}
                className="card px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-light-purple hover:text-royal-purple"
              >
                {resource.title}
                {resource.corePractice ? (
                  <span className="ml-2 text-[0.6rem] font-bold uppercase tracking-wider text-royal-purple">
                    core
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
