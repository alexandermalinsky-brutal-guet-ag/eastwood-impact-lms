import type { Metadata } from "next";
import Link from "next/link";

import { JourneyDetail } from "@/components/JourneyTracker";
import { SectionHeading } from "@/components/ui";
import { INTEGRATION_NOTE, STRANDS } from "@/lib/brand";
import { evidenceBase, kickoffProjects } from "@/lib/curriculum";
import {
  COACH_ROLES,
  COACH_SCORECARD,
  EXTERNAL_CATEGORIES,
  GOAL_KINDS,
  PHASES,
  RHYTHMS,
  STUDENT_SCORECARD,
} from "@/lib/handbook";

export const metadata: Metadata = { title: "Handbook" };

export default function HandbookPage() {
  return (
    <>
      <SectionHeading
        eyebrow="The IMPACT Handbook · Vol. 1"
        title="How the programme works"
        description="The structures every project runs on — the four stages, the strands, how goals and evaluation work, and what changes as students progress."
        action={
          <Link
            href="/toolkit/impact-handbook"
            className="card px-4 py-2 text-sm font-semibold text-ink hover:border-light-purple"
          >
            Source document
          </Link>
        }
      />

      <nav className="mb-12 flex flex-wrap gap-2">
        {[
          ["#journey", "The Journey"],
          ["#strands", "The strands"],
          ["#goals", "Goals"],
          ["#evaluation", "Evaluation"],
          ["#coaching", "Coaching"],
          ["#progression", "Progression"],
          ["#external", "External impact"],
          ["#kickoff", "Kickoff projects"],
          ["#evidence", "Evidence base"],
        ].map(([href, label]) => (
          <a
            key={href}
            href={href}
            className="card px-4 py-2 text-sm font-semibold text-ink hover:border-light-purple"
          >
            {label}
          </a>
        ))}
      </nav>

      <section id="journey" className="mb-16 scroll-mt-24">
        <h2 className="mb-2 text-2xl font-bold tracking-tight text-ink">
          The IMPACT Journey
        </h2>
        <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted">
          Four stages, the same at every grade. What changes over time is the
          scope, the ambition, and how much independence is expected. Projects
          run over months rather than weeks, because meaningful skill
          development needs time, iteration and reflection.
        </p>
        <JourneyDetail />
      </section>

      <section id="strands" className="mb-16 scroll-mt-24">
        <h2 className="mb-2 text-2xl font-bold tracking-tight text-ink">
          The six strands
        </h2>
        <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted">
          {INTEGRATION_NOTE}
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {STRANDS.map((strand) => (
            <Link
              key={strand.slug}
              href={`/strands/${strand.slug}`}
              className="rounded-[14px] p-5 transition-transform hover:-translate-y-0.5"
              style={{ background: strand.colour, color: strand.ink }}
            >
              <p className="text-3xl font-bold leading-none opacity-40">
                {strand.letter}
              </p>
              <h3 className="mt-3 text-lg font-bold">{strand.name}</h3>
              <p className="mt-1 text-sm font-semibold opacity-80">
                {strand.definition}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section id="goals" className="mb-16 scroll-mt-24">
        <h2 className="mb-2 text-2xl font-bold tracking-tight text-ink">
          Goals
        </h2>
        <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted">
          Three to five per project, agreed with a coach. A good set combines all
          three types below. Goals are reviewed and recalibrated when
          circumstances change — that preserves ambition rather than penalising
          it.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {GOAL_KINDS.map((kind) => (
            <div key={kind.key} className="card p-5">
              <span
                className="inline-block rounded-full px-3 py-1 text-xs font-bold text-white"
                style={{ background: kind.colour }}
              >
                {kind.label}
              </span>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {kind.hint}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-4 rounded-lg border border-dashed border-line bg-surface p-4 text-sm leading-relaxed text-muted">
          The qualitative goals are deliberate. Judgment, perseverance and
          ethical awareness cannot be reduced to numerical targets — they have to
          be observed, discussed and reflected on.
        </p>
      </section>

      <section id="evaluation" className="mb-16 scroll-mt-24">
        <h2 className="mb-2 text-2xl font-bold tracking-tight text-ink">
          Evaluation
        </h2>
        <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted">
          There is no single grade. Evidence is aggregated from several sources
          into an Impact Profile, which becomes part of the Eastwood Passport.
          Accountability here is developmental, not punitive.
        </p>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="card p-5">
            <h3 className="font-bold text-ink">Student IMPACT Scorecard</h3>
            <p className="mt-1 text-sm text-muted">
              Bi-monthly. A reflective tool reviewed by a coach — not a
              self-grade.
            </p>
            <ul className="mt-4 space-y-2">
              {STUDENT_SCORECARD.map((d) => (
                <li key={d.key} className="text-sm text-ink">
                  <span className="font-semibold">{d.label}</span>
                  <span className="text-muted"> — {d.hint}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-5">
            <h3 className="font-bold text-ink">Coach Scorecard</h3>
            <p className="mt-1 text-sm text-muted">
              Twice monthly, then calibrated in the Coach Council to reduce
              individual bias.
            </p>
            <ul className="mt-4 space-y-2">
              {COACH_SCORECARD.map((d) => (
                <li key={d.key} className="text-sm font-semibold text-ink">
                  {d.label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-4 rounded-lg bg-royal-purple/5 p-4 text-sm leading-relaxed text-ink">
          A project that misses its intended external outcome is{" "}
          <span className="font-semibold">not a failure</span>. Accompanied by
          honest reflection, it is often the strongest evidence of growth there
          is.
        </p>
      </section>

      <section id="coaching" className="mb-16 scroll-mt-24">
        <h2 className="mb-2 text-2xl font-bold tracking-tight text-ink">
          Coaching and rhythm
        </h2>
        <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted">
          Students are given real autonomy but never left without guidance.
          Responsibility is real; support is reliable.
        </p>

        <div className="grid gap-5 md:grid-cols-3">
          {COACH_ROLES.map((role) => (
            <div key={role.key} className="card p-5">
              <h3 className="font-bold text-ink">{role.name}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                {role.responsibility}
              </p>
            </div>
          ))}
        </div>

        <div className="card mt-5 overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-paper text-left text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 font-bold">What</th>
                <th className="px-4 py-3 font-bold">How often</th>
              </tr>
            </thead>
            <tbody>
              {RHYTHMS.map((rhythm) => (
                <tr key={rhythm.what} className="border-t border-line">
                  <td className="px-4 py-3 font-semibold text-ink">
                    {rhythm.what}
                  </td>
                  <td className="px-4 py-3 text-muted">{rhythm.cadence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="progression" className="mb-16 scroll-mt-24">
        <h2 className="mb-2 text-2xl font-bold tracking-tight text-ink">
          Progression
        </h2>
        <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted">
          By demonstrated readiness, not age. Growth is developmental, not
          chronological — the grades below are the typical rhythm, not a rule.
        </p>
        <ol className="grid gap-4 md:grid-cols-3">
          {PHASES.map((phase, i) => (
            <li key={phase.key} className="card p-5">
              <span className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-royal-purple">
                Phase {i + 1} · {phase.typicalGrade}
              </span>
              <h3 className="mt-2 text-lg font-bold text-ink">{phase.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {phase.summary}
              </p>
              <p className="mt-3 border-t border-line pt-3 text-sm text-ink">
                {phase.expectation}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section id="external" className="mb-16 scroll-mt-24">
        <h2 className="mb-2 text-2xl font-bold tracking-tight text-ink">
          External impact
        </h2>
        <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted">
          No type of outcome is privileged over another, provided the engagement
          is genuine and the learning is deep. What matters is being able to
          articulate the objective of the project and its rationale.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {EXTERNAL_CATEGORIES.map((category) => (
            <div key={category.key} className="card p-5">
              <h3 className="font-bold text-ink">{category.name}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                {category.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="kickoff" className="mb-16 scroll-mt-24">
        <h2 className="mb-2 text-2xl font-bold tracking-tight text-ink">
          Kickoff projects
        </h2>
        <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted">
          Illustrative, not prescriptive. They show the range of ambition and
          format possible — and each engages several strands at once.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {kickoffProjects.map((project) => (
            <Link key={project.slug} href={`/projects/${project.slug}`}>
              <div className="card h-full p-5 transition-shadow hover:shadow-md">
                <h3 className="font-bold leading-snug text-ink">
                  {project.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {project.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {project.strands.map((name) => {
                    const strand = STRANDS.find((s) => s.name === name)!;
                    return (
                      <span
                        key={name}
                        className="rounded-full px-2.5 py-0.5 text-[0.68rem] font-bold"
                        style={{ background: strand.colour, color: strand.ink }}
                      >
                        {name}
                      </span>
                    );
                  })}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section id="evidence" className="scroll-mt-24">
        <h2 className="mb-2 text-2xl font-bold tracking-tight text-ink">
          Evidence base
        </h2>
        <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted">
          The research the handbook grounds the programme in, cited as printed —
          so you can go and read the source rather than take it on trust.
        </p>
        <ul className="space-y-3">
          {evidenceBase.map((work) => (
            <li key={work.slug}>
              <Link href={`/toolkit/${work.slug}`} className="card block p-5 hover:border-light-purple">
                <p className="font-bold leading-snug text-ink">{work.title}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {[work.author, work.year].filter(Boolean).join(" · ")}
                </p>
                {work.notes ? (
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {work.notes}
                  </p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
