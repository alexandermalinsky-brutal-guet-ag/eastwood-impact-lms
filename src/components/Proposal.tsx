"use client";

import { useState, useTransition } from "react";

import { approveProposal, saveProposal, signCharter } from "@/lib/actions";
import { buttonClass } from "@/components/ui";
import { STRANDS } from "@/lib/brand";
import { PROJECT_TYPES } from "@/lib/handbook";
import type { enrolments as enrolmentsTable } from "@/db/schema";

type Enrolment = typeof enrolmentsTable.$inferSelect;

const FIELDS = [
  {
    name: "proposalIdea",
    label: "The core idea",
    hint: "What is the project, in plain language?",
  },
  {
    name: "proposalInternalImpact",
    label: "Intended internal impact",
    hint: "What changes inside the school as a result?",
  },
  {
    name: "proposalExternalImpact",
    label: "Intended external impact",
    hint: "Who outside the school is affected, and how?",
  },
  {
    name: "proposalFeasibility",
    label: "Initial feasibility",
    hint: "What will this need — time, money, permissions, people? What could stop it?",
  },
] as const;

/**
 * Stage 1's deliverable and Stage 2's gate. The proposal is what a coach
 * reviews; approval and the Commitment Charter are what turn it into a project.
 */
export function Proposal({
  enrolment,
  canApprove,
}: {
  enrolment: Enrolment;
  canApprove: boolean;
}) {
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(!enrolment.proposalSubmittedAt);

  const approved = Boolean(enrolment.approvedAt);
  const signed = Boolean(enrolment.charterSignedAt);
  const targeted = new Set(enrolment.targetStrands);

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-royal-purple">
            Stage 1 deliverable
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">
            Project Proposal
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm text-muted">
            The core idea, the impact you intend inside and outside the school,
            the strands you are targeting, and whether it is actually feasible.
            This is what goes for formal review.
          </p>
        </div>
        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className={buttonClass("secondary")}
          >
            Edit
          </button>
        ) : null}
      </div>

      {editing ? (
        <form
          action={(formData) => {
            start(async () => {
              await saveProposal(enrolment.id, formData);
              setEditing(false);
            });
          }}
          className="card space-y-5 p-5"
        >
          {FIELDS.map((field) => (
            <div key={field.name}>
              <label
                htmlFor={field.name}
                className="block text-sm font-bold text-ink"
              >
                {field.label}
              </label>
              <p className="mb-1.5 mt-0.5 text-xs text-muted">{field.hint}</p>
              <textarea
                id={field.name}
                name={field.name}
                rows={3}
                maxLength={4000}
                defaultValue={enrolment[field.name]}
                className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm leading-relaxed text-ink"
              />
            </div>
          ))}

          <fieldset>
            <legend className="text-sm font-bold text-ink">
              Targeted IMPACT strands
            </legend>
            <p className="mb-2.5 mt-0.5 text-xs text-muted">
              Pick every strand this project genuinely engages. No strand stands
              alone — most real projects span three or four.
            </p>
            <div className="flex flex-wrap gap-2">
              {STRANDS.map((strand) => (
                <label
                  key={strand.slug}
                  className="cursor-pointer rounded-full border border-line px-3.5 py-1.5 text-sm font-semibold text-muted transition-colors has-[:checked]:border-transparent has-[:checked]:text-[var(--ink)]"
                  style={
                    {
                      "--ink": strand.ink,
                      backgroundColor: targeted.has(strand.name)
                        ? strand.colour
                        : undefined,
                    } as React.CSSProperties
                  }
                >
                  <input
                    type="checkbox"
                    name="targetStrands"
                    value={strand.name}
                    defaultChecked={targeted.has(strand.name)}
                    className="sr-only"
                  />
                  {strand.name}
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label
              htmlFor="projectType"
              className="block text-sm font-bold text-ink"
            >
              Type
            </label>
            <select
              id="projectType"
              name="projectType"
              defaultValue={enrolment.projectType}
              className="mt-1.5 w-full max-w-md rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
            >
              {PROJECT_TYPES.map((type) => (
                <option key={type.key} value={type.key}>
                  {type.label} — {type.hint}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={pending} className={buttonClass("primary")}>
              {pending ? "Saving…" : "Save proposal"}
            </button>
            {enrolment.proposalSubmittedAt ? (
              <button
                type="button"
                onClick={() => setEditing(false)}
                className={buttonClass("ghost")}
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      ) : (
        <div className="card space-y-4 p-5">
          {FIELDS.map((field) => (
            <div key={field.name}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                {field.label}
              </h3>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink">
                {enrolment[field.name] || (
                  <span className="text-muted">Not written yet</span>
                )}
              </p>
            </div>
          ))}

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
              Targeted strands
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {enrolment.targetStrands.length === 0 ? (
                <span className="text-sm text-muted">None chosen yet</span>
              ) : (
                STRANDS.filter((s) => targeted.has(s.name)).map((strand) => (
                  <span
                    key={strand.slug}
                    className="rounded-full px-3 py-1 text-xs font-bold"
                    style={{ background: strand.colour, color: strand.ink }}
                  >
                    {strand.name}
                  </span>
                ))
              )}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
              Type
            </h3>
            <p className="mt-1 text-sm font-semibold text-ink">
              {PROJECT_TYPES.find((t) => t.key === enrolment.projectType)?.label}
            </p>
          </div>
        </div>
      )}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div
          className={`rounded-[14px] border p-5 ${
            approved ? "border-transparent bg-forest-green/10" : "border-line bg-surface"
          }`}
        >
          <h3 className="font-bold text-ink">Formal approval</h3>
          {approved ? (
            <p className="mt-1 text-sm text-muted">
              Approved on {enrolment.approvedAt!.toLocaleDateString("en-GB")}.
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted">
              A coach reviews the proposal and approves it before the project
              moves to goal setting.
            </p>
          )}
          {canApprove && !approved ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => start(() => void approveProposal(enrolment.id))}
              className={`${buttonClass("primary")} mt-3`}
            >
              Approve this proposal
            </button>
          ) : null}
        </div>

        <div
          className={`rounded-[14px] border p-5 ${
            signed ? "border-transparent bg-forest-green/10" : "border-line bg-surface"
          }`}
        >
          <h3 className="font-bold text-ink">Commitment Charter</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            {signed
              ? `Signed on ${enrolment.charterSignedAt!.toLocaleDateString("en-GB")}.`
              : "By signing, you agree to pursue this project through to completion unless a coach-led review decides a pivot is necessary."}
          </p>
          {!signed ? (
            <button
              type="button"
              disabled={pending || !approved}
              onClick={() => start(() => void signCharter(enrolment.id))}
              className={`${buttonClass("primary")} mt-3`}
            >
              {approved ? "Sign the charter" : "Awaiting approval"}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
