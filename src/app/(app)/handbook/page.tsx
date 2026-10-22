import type { Metadata } from "next";
import Link from "next/link";

import { LEVELS, PHASES_OF_WORK } from "@/lib/handbook";

export const metadata: Metadata = { title: "How IMPACT works" };

/**
 * One page. The old handbook ran to eight sections describing the programme;
 * this explains how to run a project, which is the only thing anyone needs
 * from it while they are working.
 */
export default function HowItWorks() {
  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-royal-purple">
        How IMPACT works
      </p>
      <h1 className="mt-2 text-4xl font-bold leading-tight tracking-tight text-ink">
        Pick something that matters. Prove it changed.
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-muted">
        That is the whole idea. Everything below is just the shape of getting there.
      </p>

      <section className="mt-12">
        <h2 className="text-2xl font-bold tracking-tight text-ink">
          Every project answers three questions
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {[
            ["Who benefits?", "A specific group, with a number on it. Not “people”."],
            ["What changes?", "The situation afterwards — not the activity you ran."],
            ["How do we know?", "One thing you measure, before and after."],
          ].map(([q, a]) => (
            <div key={q} className="rounded-[14px] bg-deep-blue p-5 text-white">
              <p className="text-lg font-bold">{q}</p>
              <p className="mt-2 text-sm leading-relaxed text-light-purple">{a}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          If you can answer those three, you have a project. If you cannot, you have an activity —
          which is fine, but it is not what this is for.
        </p>
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-bold tracking-tight text-ink">Four phases</h2>
        <p className="mt-2 text-base leading-relaxed text-muted">
          You move to the next phase when a coach says the work is there. Between those gates,
          the project is yours to run.
        </p>

        <ol className="mt-6 space-y-3">
          {PHASES_OF_WORK.map((phase) => {
            const levels = LEVELS.filter((l) => l.phase === phase.key);
            return (
              <li key={phase.key} className="card overflow-hidden p-0">
                <div className="flex flex-wrap items-baseline gap-3 border-b border-line bg-paper px-5 py-4">
                  <span className="rounded-full bg-deep-blue px-3 py-1 text-xs font-bold text-white">
                    {phase.number}
                  </span>
                  <h3 className="text-xl font-bold tracking-tight text-ink">{phase.name}</h3>
                  <span className="text-sm text-muted">{phase.verb}</span>
                </div>

                <div className="px-5 py-4">
                  <p className="text-sm leading-relaxed text-muted">{phase.summary}</p>

                  <ul className="mt-4 space-y-2">
                    {levels.map((l) => (
                      <li key={l.n} className="flex gap-3 text-sm">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-royal-purple text-[0.62rem] font-bold text-white">
                          {l.n}
                        </span>
                        <span>
                          <span className="font-semibold text-ink">{l.milestone}</span>
                          <span className="text-muted"> — {l.evidence}</span>
                        </span>
                      </li>
                    ))}
                  </ul>

                  <p className="mt-4 rounded-lg bg-royal-purple/5 px-4 py-2.5 text-sm text-ink">
                    <span className="font-bold">Moves on when: </span>{phase.gate}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-bold tracking-tight text-ink">
          Levels unlock on evidence, not effort
        </h2>
        <p className="mt-2 text-base leading-relaxed text-muted">
          Seven levels across the four phases. You reach the next one by showing something real —
          a photo, a file, a number, something someone said — and a coach confirming it.
          There are no points for logging in, and no leaderboard.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[14px] border border-forest-green/40 bg-forest-green/5 p-5">
            <p className="font-bold text-ink">One strong piece beats ten weak ones</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              “Asked three Year 7s what they thought, here is what they said” is worth more than a
              week of ticked boxes.
            </p>
          </div>
          <div className="rounded-[14px] border border-mustard/40 bg-mustard/5 p-5">
            <p className="font-bold text-ink">Sent back is not failed</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              A coach returning your evidence means they told you what is missing. You revise and
              send it again. Nothing is lost.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-bold tracking-tight text-ink">The words we use</h2>
        <dl className="mt-5 divide-y divide-line overflow-hidden rounded-[14px] border border-line bg-surface">
          {[
            ["Impact Proposal", "The first thing you write. Who it is for, what changes, and the one number you will watch."],
            ["Indicator", "That number. Where it is today, and where you want it."],
            ["Definition of done", "Three to five things that must be true for this to count as finished."],
            ["Milestone", "A dated step. Three to six of them, ending at the showcase."],
            ["Evidence", "What you show a coach to unlock the next level."],
            ["Charter", "You signing that you will see it through unless a coach agrees to change course."],
            ["Plan · Act · Reflect", "A short write-up each cycle: what you planned, what happened, what you would do differently."],
          ].map(([term, meaning]) => (
            <div key={term} className="grid gap-1 px-5 py-4 sm:grid-cols-[13rem_1fr] sm:gap-5">
              <dt className="font-bold text-ink">{term}</dt>
              <dd className="text-sm leading-relaxed text-muted">{meaning}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-14 rounded-[14px] bg-deep-blue p-7 text-white">
        <h2 className="text-2xl font-bold tracking-tight">Stuck on where to begin?</h2>
        <p className="mt-2 max-w-xl text-base leading-relaxed text-light-purple">
          Start with something that annoys you about this school, or something you wish existed.
          Write one sentence about who it affects. That sentence is level one.
        </p>
        <Link
          href="/dashboard"
          className="mt-5 inline-block rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-deep-blue hover:bg-light-purple"
        >
          Start a project
        </Link>
      </section>
    </div>
  );
}
