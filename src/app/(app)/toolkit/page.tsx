import type { Metadata } from "next";
import Link from "next/link";

import { Empty, SectionHeading } from "@/components/ui";
import { documents, practicesByPhase, resources } from "@/lib/curriculum";
import { PHASES_OF_WORK } from "@/lib/handbook";

export const metadata: Metadata = { title: "Toolkit" };

/**
 * Practices shown inside the phase where they help, rather than as an A-Z
 * list. Pages nobody has written are hidden — a menu of blank entries is
 * worse than a short menu.
 */
export default function ToolkitPage() {
  const other = resources.filter(
    (r) => !r.phase && r.category !== "Documentation" && r.category !== "Evidence base",
  );

  return (
    <>
      <SectionHeading
        eyebrow="Toolkit"
        title="Ways of working, when you need them"
        description="Each one is a method you can borrow. They are grouped by the point in a project where they actually help."
      />

      <div className="space-y-10">
        {PHASES_OF_WORK.map((phase) => {
          const items = practicesByPhase(phase.key);
          if (items.length === 0) return null;
          return (
            <section key={phase.key}>
              <div className="mb-4 flex flex-wrap items-baseline gap-3">
                <span className="rounded-full bg-deep-blue px-3 py-1 text-xs font-bold text-white">
                  {phase.number}
                </span>
                <h2 className="text-xl font-bold tracking-tight text-ink">{phase.name}</h2>
                <span className="text-sm text-muted">{phase.verb}</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((r) => (
                  <Link key={r.slug} href={`/toolkit/${r.slug}`} className="card p-5 transition-shadow hover:shadow-md">
                    <p className="font-bold leading-snug text-ink">{r.title}</p>
                    {r.notes ? (
                      <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-muted">{r.notes}</p>
                    ) : null}
                    {r.leads.length ? (
                      <p className="mt-2 text-xs text-muted">Ask {r.leads.join(" or ")}</p>
                    ) : null}
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        {other.length > 0 ? (
          <section>
            <h2 className="mb-4 text-xl font-bold tracking-tight text-ink">Anytime</h2>
            <div className="flex flex-wrap gap-2">
              {other.map((r) => (
                <Link
                  key={r.slug}
                  href={`/toolkit/${r.slug}`}
                  className="card px-4 py-2 text-sm font-medium text-ink hover:border-light-purple"
                >
                  {r.title}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <h2 className="mb-1 text-xl font-bold tracking-tight text-ink">Where this comes from</h2>
          <p className="mb-4 text-sm text-muted">
            The documents the programme is built on.
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            {documents.map((doc) => (
              <Link
                key={doc.slug}
                href={doc.href || `/toolkit/${doc.slug}`}
                className="card p-5 transition-shadow hover:shadow-md"
              >
                <p className="font-bold leading-snug text-ink">{doc.title}</p>
                <p className="mt-1 text-xs text-muted">
                  {[doc.author, doc.year].filter(Boolean).join(" · ")}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {resources.length === 0 ? (
          <Empty title="Nothing written up yet">
            Practices appear here once a coach has written one up — what it is, when to use it,
            and how to do it in five minutes.
          </Empty>
        ) : null}
      </div>
    </>
  );
}
