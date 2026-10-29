import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "How IMPACT works" };

/**
 * One page, and only what the platform actually does today: you write an
 * Impact Proposal and a coach approves it or sends it back. The phases,
 * levels and evidence this page used to describe are the programme's shape,
 * not something anyone can do here yet — so they are not promised here.
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
        <h2 className="text-2xl font-bold tracking-tight text-ink">What happens here</h2>
        <ol className="mt-6 space-y-3">
          {[
            ["Start a project", "Your own idea, or one from the catalogue. A working title is enough to begin."],
            ["Write the Impact Proposal", "The three questions above, plus what you will deliver, what you need, and the main risk. Every field shows you a strong answer and a weak one."],
            ["Send it to a coach", "They read it and either approve it or send it back saying what is missing."],
            ["Revise and send it again", "Sent back is not failed. It means someone told you exactly what would make it work."],
          ].map(([step, what], i) => (
            <li key={step} className="card flex gap-4 p-5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-deep-blue text-xs font-bold text-white">
                {i + 1}
              </span>
              <div>
                <h3 className="font-bold text-ink">{step}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{what}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          That is everything the platform does today. The rest of the programme — the plan, the
          work, the evidence, the final showcase — still happens, it just does not live here yet.
        </p>
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-bold tracking-tight text-ink">The words we use</h2>
        <dl className="mt-5 divide-y divide-line overflow-hidden rounded-[14px] border border-line bg-surface">
          {[
            ["Impact Proposal", "The first thing you write. Who it is for, what changes, and the one number you will watch."],
            ["Indicator", "That number. Where it is today, and where you want it."],
            ["Approved", "A coach has read your proposal and agreed it is a real project."],
            ["Sent back", "A coach has told you what is missing. You revise and send it again."],
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
          Write one sentence about who it affects. That sentence is the proposal's first line.
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
