"use client";

import { useState, type ReactNode } from "react";

import { PHASES_OF_WORK, type PhaseKey } from "@/lib/handbook";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "plan", label: "Plan" },
  { key: "work", label: "Work" },
  { key: "evidence", label: "Evidence" },
  { key: "report", label: "Report" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/**
 * The project page used to be one scroll of about ten sections. Tabs, with a
 * phase bar on top showing where the project stands and what the next gate
 * requires.
 */
export function ProjectTabs({
  phase,
  panes,
}: {
  phase: PhaseKey;
  panes: Record<TabKey, ReactNode>;
}) {
  const initial: TabKey =
    phase === "create" ? "overview" : phase === "plan" ? "plan" : phase === "execute" ? "work" : "report";
  const [tab, setTab] = useState<TabKey>(initial);

  const current = PHASES_OF_WORK.find((p) => p.key === phase)!;

  return (
    <>
      <section className="mb-6 overflow-hidden rounded-[14px] border border-line bg-surface">
        <ol className="grid sm:grid-cols-4">
          {PHASES_OF_WORK.map((p) => {
            const done = p.number < current.number;
            const now = p.key === phase;
            return (
              <li
                key={p.key}
                aria-current={now ? "step" : undefined}
                className={`border-t border-line p-4 sm:border-l sm:border-t-0 sm:first:border-l-0 ${
                  now ? "bg-deep-blue text-white" : done ? "bg-royal-purple/5" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[0.62rem] font-bold uppercase tracking-wider ${now ? "text-light-purple" : "text-muted"}`}>
                    Phase {p.number}
                  </span>
                  {done ? <span className="text-xs font-bold text-forest-green">✓</span> : null}
                </div>
                <p className={`mt-1 font-bold ${now ? "text-white" : done ? "text-ink" : "text-muted"}`}>
                  {p.name}
                </p>
              </li>
            );
          })}
        </ol>
        <p className="border-t border-line bg-paper px-4 py-3 text-sm text-ink">
          <span className="font-bold">To reach the next phase: </span>
          {current.gate}
        </p>
      </section>

      <div className="mb-6 flex flex-wrap gap-1.5 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            aria-current={tab === t.key ? "page" : undefined}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              tab === t.key
                ? "border-royal-purple text-royal-purple"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div>{panes[tab]}</div>
    </>
  );
}
