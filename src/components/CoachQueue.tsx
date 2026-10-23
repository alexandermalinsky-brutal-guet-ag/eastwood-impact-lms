"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { answerHelpRequest, approveProposal, returnProposal, reviewEvidence, validatePlan } from "@/lib/actions";
import { buttonClass } from "@/components/ui";
import { formatDate } from "@/lib/dates";

type Row = { id: string; title: string; studentName: string | null; when: Date | null; body: string; kind: Kind };
type Kind = "proposal" | "plan" | "evidence" | "help";

const KIND = {
  proposal: { label: "Proposal to approve", accent: "var(--color-royal-purple)" },
  plan: { label: "Plan to validate", accent: "var(--color-blue-purple)" },
  evidence: { label: "Evidence to review", accent: "var(--color-forest-green)" },
  help: { label: "Help request", accent: "var(--color-mustard)" },
} as const;

/** Everything blocked on a coach, oldest first. */
export function CoachQueue({
  proposals, plans, evidence, help,
}: {
  proposals: { enrolmentId: string; title: string; studentName: string | null; problem: string; submittedAt: Date | null; projectSlug: string }[];
  plans: { enrolmentId: string; title: string; studentName: string | null; projectSlug: string }[];
  evidence: { id: string; title: string; studentName: string | null; note: string; level: number; url: string; value: string; submittedAt: Date; projectSlug: string }[];
  help: { id: string; title: string; studentName: string | null; question: string; createdAt: Date; projectSlug: string }[];
}) {
  const [pending, start] = useTransition();
  const [open, setOpen] = useState<string | null>(null);

  const items: (Row & { slug: string; targetId: string })[] = [
    ...proposals.map((p) => ({ id: `pr-${p.enrolmentId}`, targetId: p.enrolmentId, kind: "proposal" as Kind,
      title: p.title, studentName: p.studentName, when: p.submittedAt, body: p.problem, slug: p.projectSlug })),
    ...plans.map((p) => ({ id: `pl-${p.enrolmentId}`, targetId: p.enrolmentId, kind: "plan" as Kind,
      title: p.title, studentName: p.studentName, when: null, body: "Milestones and definition of done are ready for review.", slug: p.projectSlug })),
    ...evidence.map((e) => ({ id: `ev-${e.id}`, targetId: e.id, kind: "evidence" as Kind,
      title: e.title, studentName: e.studentName, when: e.submittedAt,
      body: `Level ${e.level}: ${e.note}${e.value ? ` · ${e.value}` : ""}`, slug: e.projectSlug })),
    ...help.map((h) => ({ id: `hp-${h.id}`, targetId: h.id, kind: "help" as Kind,
      title: h.title, studentName: h.studentName, when: h.createdAt, body: h.question, slug: h.projectSlug })),
  ].sort((a, b) => (a.when?.getTime() ?? 0) - (b.when?.getTime() ?? 0));

  if (items.length === 0) {
    return (
      <div className="card border-dashed p-8 text-center">
        <p className="font-semibold text-ink">The queue is clear</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted">
          Nothing is blocked on you. Students are free to keep working between gates.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const meta = KIND[item.kind];
        return (
          <li key={item.id} className="card p-4" style={{ borderLeft: `3px solid ${meta.accent}` }}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[0.65rem] font-bold uppercase tracking-wider" style={{ color: meta.accent }}>
                  {meta.label}
                </p>
                <p className="mt-1 font-bold text-ink">
                  {item.studentName ?? "A student"}
                  <span className="font-normal text-muted"> · </span>
                  <Link href={`/projects/${item.slug}`} className="font-semibold hover:text-royal-purple">
                    {item.title}
                  </Link>
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{item.body}</p>
              </div>
              {item.when ? (
                <span className="shrink-0 text-xs text-muted">{formatDate(item.when)}</span>
              ) : null}
            </div>

            <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
              {item.kind === "proposal" ? (
                open === item.id ? (
                  <form className="w-full space-y-2"
                    action={(fd) => start(async () => { await returnProposal(item.targetId, fd); setOpen(null); })}>
                    <textarea name="comment" rows={2} required maxLength={2000} placeholder="What needs more work?"
                      className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink" />
                    <div className="flex gap-2">
                      <button type="submit" disabled={pending} className={buttonClass("secondary")}>Send back</button>
                      <button type="button" onClick={() => setOpen(null)} className={buttonClass("ghost")}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <button type="button" disabled={pending}
                      onClick={() => start(() => void approveProposal(item.targetId))}
                      className={buttonClass("primary")}>Approve</button>
                    <button type="button" onClick={() => setOpen(item.id)} className={buttonClass("secondary")}>
                      Return with comments
                    </button>
                  </>
                )
              ) : null}

              {item.kind === "plan" ? (
                <button type="button" disabled={pending}
                  onClick={() => start(() => void validatePlan(item.targetId))}
                  className={buttonClass("primary")}>Validate the plan</button>
              ) : null}

              {item.kind === "evidence" ? (
                open === item.id ? (
                  <form className="w-full space-y-2"
                    action={(fd) => start(async () => { await reviewEvidence(item.targetId, "returned", fd); setOpen(null); })}>
                    <textarea name="comment" rows={2} required maxLength={2000} placeholder="What would make this work?"
                      className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink" />
                    <div className="flex gap-2">
                      <button type="submit" disabled={pending} className={buttonClass("secondary")}>Send back</button>
                      <button type="button" onClick={() => setOpen(null)} className={buttonClass("ghost")}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <button type="button" disabled={pending}
                      onClick={() => start(() => void reviewEvidence(item.targetId, "validated"))}
                      className={buttonClass("primary")}>Validate</button>
                    <button type="button" onClick={() => setOpen(item.id)} className={buttonClass("secondary")}>Return</button>
                  </>
                )
              ) : null}

              {item.kind === "help" ? (
                <form className="flex w-full flex-wrap gap-2"
                  action={(fd) => start(() => void answerHelpRequest(item.targetId, fd))}>
                  <input name="answer" required maxLength={2000} placeholder="Reply…"
                    className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink" />
                  <button type="submit" disabled={pending} className={buttonClass("secondary")}>Reply</button>
                </form>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
