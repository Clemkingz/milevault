/**
 * Lifecycle states — must stay in sync with the escrow contract (maintained separately).
 * The Soroban contract is the source of truth; these mirror its enums.
 *
 * Flow (PRD §5 + design prototype):
 *   created ──fund──▶ funded ──accept (contributor)──▶ active ──all paid──▶ completed
 *      │                 │  └─decline (contributor)──▶ declined  (full refund to client)
 *      └─cancel─▶ cancelled   └─request_cancel + confirm_cancel (both parties)──▶ cancelled (unreleased refunded)
 */

export const AGREEMENT_STATUSES = [
  "created", // on-chain, not funded — client may fund or cancel
  "funded", // full escrow locked, waiting for the contributor to accept
  "active", // contributor accepted — milestones can be submitted
  "cancel_requested", // one party proposed mutual cancellation of a funded agreement
  "completed", // every milestone paid
  "cancelled", // cancelled under permitted conditions (refund details available)
  "declined", // contributor declined a funded agreement — escrow refunded to client
] as const;
export type AgreementStatus = (typeof AGREEMENT_STATUSES)[number];

export const MILESTONE_STATUSES = [
  "pending", // work not yet submitted
  "submitted", // contributor marked ready for review
  "approved", // client approved — ready to pay, NOT paid (release is a separate tx)
  "paid", // payment transferred to contributor
] as const;
export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];

/** On-chain events emitted by the escrow contract and indexed by the API. */
export const ESCROW_EVENT_TYPES = [
  "agreement_created",
  "agreement_funded",
  "agreement_accepted",
  "agreement_declined",
  "milestone_submitted",
  "milestone_approved",
  "milestone_released",
  "cancel_requested",
  "agreement_cancelled",
  "agreement_refunded",
] as const;
export type EscrowEventType = (typeof ESCROW_EVENT_TYPES)[number];

export type AgreementRole = "client" | "contributor";

/**
 * What the UI shows for an agreement (design "BADGE" set). Derived from on-chain state —
 * e.g. an `active` agreement shows "Funded" until the first milestone moves, then "In progress".
 */
export type AgreementDisplayState =
  | "awaiting" // Awaiting funding
  | "awaitc" // Awaiting contributor
  | "funded"
  | "progress" // In progress
  | "cancel_requested"
  | "completed"
  | "cancelled"
  | "declined";

export function agreementDisplayState(a: {
  status: AgreementStatus;
  milestones: { status: MilestoneStatus }[];
}): AgreementDisplayState {
  switch (a.status) {
    case "created":
      return "awaiting";
    case "funded":
      return "awaitc";
    case "active":
      return a.milestones.some((m) => m.status !== "pending") ? "progress" : "funded";
    default:
      return a.status;
  }
}

export const DISPLAY_STATE_LABEL: Record<AgreementDisplayState, string> = {
  awaiting: "Awaiting funding",
  awaitc: "Awaiting contributor",
  funded: "Funded",
  progress: "In progress",
  cancel_requested: "Cancellation requested",
  completed: "Completed",
  cancelled: "Cancelled",
  declined: "Declined",
};

export const MILESTONE_STATUS_LABEL: Record<MilestoneStatus, string> = {
  pending: "Pending",
  submitted: "Submitted",
  approved: "Approved",
  paid: "Paid",
};

/** Human agreement reference shown in the UI and invite links, e.g. 1042 → "MV-1042" */
export const agreementRef = (id: string | number | bigint) => `MV-${id}`;
export const parseAgreementRef = (ref: string) => ref.replace(/^MV-/i, "");
