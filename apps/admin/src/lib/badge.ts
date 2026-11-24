import type { BadgeKind } from "@milevault/ui";
import type { AgreementSummary } from "@milevault/api";

/** Agreement → status badge (same mapping as the dashboard, without the viewer's role). */
const DISPLAY: Record<string, BadgeKind> = {
  draft: "draft", awaiting_funding: "awaiting", awaiting_contributor: "awaitc", funded: "funded", in_progress: "progress",
  completed: "completed", cancelled: "cancelled", declined: "declined", recovered: "recovered",
};
export function agreementBadge(a: Pick<AgreementSummary, "status" | "displayStatus"> & { cancellation?: unknown }): BadgeKind | string {
  if (a.cancellation && (a.status === "funded" || a.status === "in_progress")) return "cancel_requested";
  return DISPLAY[a.displayStatus] ?? DISPLAY[a.status] ?? a.displayStatus ?? a.status;
}
/** "Changes requested" = pending milestone with a note newer than its last submission */
export const milestoneBadge = (m: { status: string; changesRequestedAt: string | null; submittedAt: string | null }): BadgeKind | string =>
  m.status === "pending" && m.changesRequestedAt && (!m.submittedAt || m.changesRequestedAt >= m.submittedAt) ? "changes_requested" : m.status;
/** `system.arbiter.status` (guide §13) → health */
export const ARBITER: Record<string, ["ok" | "warn" | "down" | "idle", string]> = {
  ok: ["ok", "OK"], low_xlm: ["warn", "Low XLM"], missing_trustline: ["down", "Missing trustline"], missing_account: ["down", "Missing account"],
  not_configured: ["down", "Not configured"], unknown: ["idle", "Unknown"],
};

/** Transaction status → badge */
export const txBadge = (s?: string | null): BadgeKind | string => (s === "pending" ? "pending_tx" : s ?? "pending");

export const AGREEMENT_STATUSES = ["draft", "created", "funded", "in_progress", "completed", "cancelled", "declined", "recovered"] as const;
export const TX_STATUSES = ["prepared", "pending", "confirmed", "failed", "expired"] as const;
export const TX_KINDS = ["fund", "approve", "release", "decline", "propose_cancel", "confirm_cancel", "recover"] as const;
const ACRONYMS = new Set(["xlm", "usdc", "id", "url", "rpc", "api", "tx", "db", "sep10", "mv"]);
/** "xlmBalance" / "last_run_at" → "XLM balance" / "Last run at" */
export const human = (s: string) => s.replace(/[_-]+/g, " ").replace(/([a-z0-9])([A-Z])/g, "$1 $2").trim().split(/\s+/)
  .map((w, i) => (ACRONYMS.has(w.toLowerCase()) ? w.toUpperCase() : i === 0 ? w[0]!.toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase())).join(" ");
