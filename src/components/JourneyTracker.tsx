import Link from "next/link";

import { STAGES, STAGE_ORDER, type StageKey } from "@/lib/handbook";

/**
 * The four-stage IMPACT Journey. Every project at every grade follows the same
 * structure; what changes with readiness is scope, ambition and independence.
 */
export function JourneyTracker({
  current,
  compact = false,
}: {
  current: StageKey;
  compact?: boolean;
}) {
  const index = STAGE_ORDER.indexOf(current);

  if (compact) {
    return (
      <ol className="flex items-center gap-1.5" aria-label="IMPACT Journey stage">
        {STAGES.map((stage, i) => (
          <li key={stage.key} className="flex items-center gap-1.5">
            <span
              title={stage.name}
              aria-current={i === index ? "step" : undefined}
              className={`h-1.5 rounded-full transition-all ${
                i < index
                  ? "w-6 bg-royal-purple"
                  : i === index
                    ? "w-10 bg-deep-blue"
                    : "w-6 bg-line"
              }`}
            />
          </li>
        ))}
        <li className="ml-1.5 text-xs font-semibold text-muted">
          {STAGES[index].shortName}
        </li>
      </ol>
    );
  }

  return (
    <ol className="grid gap-3 md:grid-cols-4">
      {STAGES.map((stage, i) => {
        const done = i < index;
        const active = i === index;
        return (
          <li
            key={stage.key}
            aria-current={active ? "step" : undefined}
            className={`rounded-[14px] border p-4 ${
              active
                ? "border-transparent bg-deep-blue text-white"
                : done
                  ? "border-transparent bg-royal-purple/10"
                  : "border-line bg-surface"
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-[0.65rem] font-bold uppercase tracking-[0.16em] ${
                  active ? "text-light-purple" : "text-muted"
                }`}
              >
                Stage {stage.number}
              </span>
              {done ? (
                <span className="text-xs font-bold text-royal-purple">✓</span>
              ) : null}
            </div>
            <p
              className={`mt-1.5 font-bold leading-snug ${
                active ? "text-white" : "text-ink"
              }`}
            >
              {stage.shortName}
            </p>
            <p
              className={`mt-1 text-xs leading-relaxed ${
                active ? "text-white/70" : "text-muted"
              }`}
            >
              {stage.deliverable}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

/** The full explanation, used on the handbook page. */
export function JourneyDetail() {
  return (
    <ol className="space-y-5">
      {STAGES.map((stage) => (
        <li key={stage.key} className="card p-6">
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="rounded-full bg-deep-blue px-3 py-1 text-xs font-bold text-white">
              Stage {stage.number}
            </span>
            <h3 className="text-xl font-bold tracking-tight text-ink">
              {stage.name}
            </h3>
          </div>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            {stage.summary}
          </p>

          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {stage.activities.map((activity) => (
              <li key={activity} className="flex gap-2.5 text-sm text-ink">
                <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-light-purple" />
                {activity}
              </li>
            ))}
          </ul>

          <p className="mt-4 rounded-lg bg-paper p-3 text-sm text-ink">
            <span className="font-bold">Ends with: </span>
            {stage.deliverable}
          </p>
        </li>
      ))}
    </ol>
  );
}

export function JourneyLink() {
  return (
    <Link
      href="/handbook#journey"
      className="text-sm font-semibold text-royal-purple underline"
    >
      The four stages explained
    </Link>
  );
}
