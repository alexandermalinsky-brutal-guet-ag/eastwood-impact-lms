/**
 * Where a project stands, derived rather than stored.
 *
 * The platform does one thing: a student writes an Impact Proposal and a coach
 * approves it or sends it back. These five states are that loop, and every
 * surface — dashboard, coach queue, profile — reads them from here so they
 * cannot drift apart.
 */

export type ProposalState =
  | "drafting"
  | "with-coach"
  | "returned"
  | "approved"
  | "withdrawn";

/** The fields the state is read from. Structural, so any query shape fits. */
type Proposal = {
  status: "active" | "withdrawn";
  problem: string;
  proposalSubmittedAt: Date | null;
  approvedAt: Date | null;
  returnedAt: Date | null;
};

export function proposalState(enrolment: Proposal): ProposalState {
  if (enrolment.status === "withdrawn") return "withdrawn";
  if (enrolment.approvedAt) return "approved";
  if (enrolment.proposalSubmittedAt) return "with-coach";
  // Returned clears the submission, so this has to be checked after it.
  if (enrolment.returnedAt) return "returned";
  return "drafting";
}

export const PROPOSAL_STATES: Record<
  ProposalState,
  { label: string; next: string; dot: string; text: string }
> = {
  drafting: {
    label: "Draft",
    next: "Write the Impact Proposal",
    dot: "bg-line",
    text: "text-muted",
  },
  "with-coach": {
    label: "With coach",
    next: "Waiting on your coach to read it",
    dot: "bg-royal-purple",
    text: "text-royal-purple",
  },
  returned: {
    label: "Sent back",
    next: "Your coach asked for changes",
    dot: "bg-mustard",
    text: "text-mustard",
  },
  approved: {
    label: "Approved",
    next: "Approved — the work starts here",
    dot: "bg-forest-green",
    text: "text-forest-green",
  },
  withdrawn: {
    label: "Withdrawn",
    next: "Withdrawn",
    dot: "bg-line",
    text: "text-muted",
  },
};
