import type { ActionKind, ActivityKind, ActivityRow, Agreement, AgreementActivity, AgreementSummary, Milestone } from "@milevault/api";
import { assetCode, money, shortAddr } from "@milevault/api";
import type { BadgeKind, FolderColor, IconName } from "@milevault/ui";
import type { ConfirmOp } from "./ui";

/* ---------- identity (addresses only — the backend stores no profiles) ---------- */
export const who = (addr: string | null | undefined, me: string | null) => (addr && addr === me ? "You" : shortAddr(addr));
/** The other party; null on a draft with no contributor yet */
export const counterpart = (a: AgreementSummary) => (a.role === "client" ? a.contributor : a.client);
/** Short address of the other party, or a placeholder when none is set */
export const otherName = (a: AgreementSummary) => (counterpart(a) ? shortAddr(counterpart(a)!.address) : "your contributor");
/** "Changes requested" is a pending milestone carrying a note newer than its last submission */
export const changesRequested = (ms: Pick<Milestone, "status" | "changesRequestedAt" | "submittedAt">) =>
  ms.status === "pending" && !!ms.changesRequestedAt && (!ms.submittedAt || ms.changesRequestedAt >= ms.submittedAt);
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const AV = [["#FFE1E6", "#C2417F"], ["#EFE6FF", "#6E4BD6"], ["#E1F1FF", "#3B82C4"], ["#FFF1DC", "#C9821C"], ["#E3F7EA", "#239A5A"], ["#EAF8FE", "#1A9ACB"]] as const;
export const avatarFor = (addr: string) => { const [bg, fg] = AV[hash(addr) % AV.length]!; return { bg, fg, initials: addr.slice(1, 3) }; };
export const folderFor = (ref: string): FolderColor => (["P", "B", "Y"] as const)[hash(ref) % 3]!;

/* ---------- status → design badges (guide §7: badges come from displayStatus) ---------- */
const DISPLAY: Record<string, BadgeKind> = {
  draft: "draft", awaiting_funding: "awaiting", awaiting_contributor: "awaitc", funded: "funded", in_progress: "progress",
  completed: "completed", cancelled: "cancelled", declined: "declined", recovered: "recovered",
};
export function agreementBadge(a: Pick<AgreementSummary, "status" | "displayStatus"> & { cancellation?: Agreement["cancellation"] }): BadgeKind | string {
  if (a.cancellation && (a.status === "funded" || a.status === "in_progress")) return "cancel_requested";
  return DISPLAY[a.displayStatus] ?? DISPLAY[a.status] ?? a.displayStatus ?? a.status;
}
export const milestoneBadge = (ms: Pick<Milestone, "status" | "changesRequestedAt" | "submittedAt">): BadgeKind | string => (changesRequested(ms) ? "changes_requested" : ms.status);
export const isOpen = (a: Pick<AgreementSummary, "status">) => ["created", "funded", "in_progress"].includes(a.status);

/* ---------- project-card status line (design cardLine) ---------- */
const C = { green: "#00CE5C", amber: "#F0AF30", blue: "#4797F6", soft: "#A3A3A3" };
export function cardLine(a: AgreementSummary): [string, string, number] {
  const n = a.milestoneCount || 1, p = a.paidCount, b = agreementBadge(a), na = a.nextAction.type;
  if (b === "draft") return ["Draft", C.soft, 0.1];
  if (b === "awaiting") return [a.role === "client" ? "Awaiting funding" : "Not funded yet", C.amber, 0.25];
  if (b === "awaitc") return [a.role === "client" ? "Awaiting contributor" : "Review the terms", C.blue, 0.25];
  if (b === "completed") return [`${n} of ${n} paid`, C.green, 1];
  if (["cancelled", "declined", "recovered"].includes(b)) return [String(b)[0]!.toUpperCase() + String(b).slice(1), C.soft, 1];
  if (na === "confirm_cancel") return ["Cancellation proposed", C.amber, Math.max(p / n, 0.12)];
  if (na === "recover") return ["Recovery available", C.amber, Math.max(p / n, 0.12)];
  if (na === "approve") return ["1 to approve", C.amber, (p + 0.5) / n];
  if (na === "release") return ["1 to release", C.amber, (p + 0.5) / n];
  if (na === "accept") return ["Review the terms", C.blue, 0.25];
  if (na === "submit") return ["Ready to submit", C.blue, Math.max(p / n, 0.12)];
  return [`${p} of ${n} paid`, C.green, Math.max(p / n, 0.12)];
}

/* ---------- available actions (guide §4 `availableActions`; the API still enforces each rule) ---------- */
export type AvailableAction =
  | "publish" | "edit_draft" | "delete_draft" | "cancel_unfunded" | "fund" | "accept" | "decline" | "submit" | "request_changes"
  | "approve" | "release" | "propose_cancel" | "withdraw_cancel" | "confirm_cancel" | "reject_cancel" | "recover";
export function availableActions(a: Agreement, now = new Date()): { action: AvailableAction; position?: number }[] {
  const isClient = a.role === "client";
  const live = a.status === "funded" || a.status === "in_progress";
  const pastRecovery = !!a.recoveryAt && now >= new Date(a.recoveryAt);
  const out: { action: AvailableAction; position?: number }[] = [];
  if (a.status === "draft") out.push({ action: "edit_draft" }, { action: "publish" }, { action: "delete_draft" });
  if (a.status === "created" && isClient) out.push({ action: "fund" }, { action: "cancel_unfunded" });
  if (live && pastRecovery && isClient) out.push({ action: "recover" });
  if (live && !pastRecovery) {
    if (a.status === "funded" && !isClient) out.push({ action: "accept" }, { action: "decline" });
    if (a.status === "in_progress") {
      const m = a.milestones.find((x) => x.status !== "paid");
      if (m?.status === "pending" && !isClient) out.push({ action: "submit", position: m.position });
      if (m?.status === "submitted" && isClient) out.push({ action: "approve", position: m.position }, { action: "request_changes", position: m.position });
      if (m?.status === "approved" && isClient) out.push({ action: "release", position: m.position });
    }
    if (!a.cancellation) out.push({ action: "propose_cancel" });
    else if (a.cancellation.proposedByYou) out.push({ action: "withdraw_cancel" });
    else out.push({ action: "confirm_cancel" }, { action: "reject_cancel" });
  }
  return out;
}
export const can = (a: Agreement, action: AvailableAction, position?: number) =>
  availableActions(a).some((x) => x.action === action && (position === undefined || x.position === position));

/* ---------- next action (design nextAction card) ---------- */
export type Intent =
  | { type: "action"; kind: ActionKind; position?: number }
  | { type: "confirm"; op: ConfirmOp; position?: number }
  | { type: "edit" } | { type: "copy" } | { type: "history" } | { type: "open"; url: string };
export interface NextCard { k: string; title: string; body: string; actions: { label: string; variant: "pri" | "sec" | "danger"; intent: Intent }[] }

export function nextCard(a: Agreement, me: string): NextCard | null {
  const client = a.role === "client";
  const o = otherName(a);
  const total = money(a.total, a.asset), locked = money(a.locked, a.asset);
  const na = a.nextAction;
  const m = (pos?: number) => (pos ? a.milestones.find((x) => x.position === pos) : undefined) ?? a.milestones.find((x) => !["paid", "refunded"].includes(x.status));
  void me;

  if (a.status === "draft") return { k: "O-02", title: "Finish and publish your draft", body: "Publishing fixes the terms and shares the agreement with your contributor. Nothing moves on-chain until you fund it.", actions: [{ label: "Publish", variant: "pri", intent: { type: "confirm", op: "publish" } }, { label: "Edit draft", variant: "sec", intent: { type: "edit" } }] };
  if (a.status === "cancelled") return Number(a.refunded) > 0
    ? { k: "C-07", title: "This agreement was cancelled", body: `Both sides agreed to cancel. ${money(a.refunded, a.asset)} went back to ${client ? "your wallet" : "the client"}; paid milestones stayed paid.`, actions: [{ label: "View payment history", variant: "sec", intent: { type: "history" } }] }
    : { k: "C-02", title: "This agreement was cancelled", body: "It was never funded, so there was nothing to refund.", actions: [] };
  if (a.status === "declined") return { k: "C-06", title: client ? `${o} declined this agreement` : "You declined this agreement", body: `The ${total} went back to ${client ? "your wallet" : "the client"}.`, actions: [] };
  if (a.status === "recovered") return { k: "C-07", title: "Escrow recovered", body: `The recovery period passed, so ${money(a.refunded, a.asset)} that wasn’t released went back to the client.`, actions: [{ label: "View payment history", variant: "sec", intent: { type: "history" } }] };
  if (a.status === "completed") return { k: client ? "M-10" : "M-07", title: client ? "All milestones paid" : "Paid in full", body: client ? `You released ${money(a.released, a.asset)} to ${o}. The escrow is empty.` : `You received ${money(a.released, a.asset)}. Every payment links to its Stellar transaction.`, actions: [{ label: "View payment history", variant: "sec", intent: { type: "history" } }] };

  if (na.type === "recover") return { k: "C-07", title: "Recover the escrow", body: `This agreement passed its recovery date${a.recoveryAt ? ` (${new Date(a.recoveryAt).toLocaleDateString()})` : ""}. You can reclaim the ${locked} that wasn’t released.`, actions: [{ label: "Recover funds", variant: "pri", intent: { type: "action", kind: "recover" } }] };
  if (a.recoveryAt && isOpen(a) && new Date(a.recoveryAt) <= new Date()) return { k: "C-07", title: "The recovery date has passed", body: `After ${new Date(a.recoveryAt).toLocaleDateString()}, the client can reclaim any milestone that hasn’t been paid. No other action is possible now.`, actions: [] };
  if (a.cancellation && isOpen(a)) {
    if (a.cancellation.proposedByYou) return { k: "C-04", title: `Waiting for ${o} to respond`, body: `You proposed cancelling. If they confirm, the ${locked} still in escrow goes back to ${client ? "you" : "the client"}. They can also reject it and continue.`, actions: [{ label: "Withdraw proposal", variant: "sec", intent: { type: "confirm", op: "withdraw_cancel" } }] };
    return { k: "C-04", title: `${o} proposed cancelling`, body: `Confirming refunds the ${locked} still in escrow to ${client ? "you" : "the client"}. Paid milestones stay paid. Reject to carry on as agreed.`, actions: [{ label: "Confirm cancellation", variant: "danger", intent: { type: "action", kind: "confirm_cancel" } }, { label: "Reject", variant: "sec", intent: { type: "confirm", op: "reject_cancel" } }] };
  }

  if (client) {
    if (a.status === "created") return { k: "F-04", title: "Fund escrow to start", body: `${o} won’t start until the ${total} is locked in escrow.`, actions: [{ label: `Fund ${total}`, variant: "pri", intent: { type: "action", kind: "fund" } }, { label: "Copy agreement link", variant: "sec", intent: { type: "copy" } }, { label: "Cancel agreement", variant: "sec", intent: { type: "confirm", op: "cancel" } }] };
    if (a.status === "funded") return { k: "F-02", title: `Waiting for ${o} to accept`, body: "The escrow is funded. The contributor reviews the terms and accepts before starting milestone 1.", actions: [{ label: "Copy agreement link", variant: "sec", intent: { type: "copy" } }] };
    const ms = m(na.milestonePosition);
    if (ms?.status === "submitted") return { k: "M-02", title: `Review ${ms.title}`, body: `Submitted ${ms.submittedAt ? new Date(ms.submittedAt).toLocaleDateString() : ""}${ms.workLink ? ` with ${ms.workLink.replace(/^https?:\/\//, "")}` : ""}. Approving doesn’t pay yet; you release the ${money(ms.amount, a.asset)} next.`,
      actions: [{ label: "Approve milestone", variant: "pri", intent: { type: "action", kind: "approve", position: ms.position } }, { label: "Request changes", variant: "sec", intent: { type: "confirm", op: "request_changes", position: ms.position } }, ...(ms.workLink ? [{ label: "Open submitted link", variant: "sec" as const, intent: { type: "open" as const, url: ms.workLink } }] : [])] };
    if (ms?.status === "approved") return { k: "M-04", title: `Release ${money(ms.amount, a.asset)} for ${ms.title}`, body: `You approved it, but ${o} isn’t paid yet. Releasing sends the money from escrow to their wallet.`, actions: [{ label: "Release payment", variant: "pri", intent: { type: "action", kind: "release", position: ms.position } }] };
    if (ms && changesRequested(ms)) return { k: "F-02", title: `Changes requested on ${ms.title}`, body: `You asked ${o} for changes${ms.changesNote ? `: “${ms.changesNote}”` : ""}. They’ll resubmit when it’s ready.`, actions: [] };
    return { k: "F-02", title: `Waiting on ${o}${ms ? ` for ${ms.title}` : ""}`, body: `Funds are locked. You’ll get a notification when milestone ${ms?.position ?? ""} is submitted.`, actions: [] };
  }
  if (a.status === "created") return { k: "F-04", title: "Not funded yet. Don’t start work.", body: `${o} published this agreement but hasn’t locked any money in escrow. You’ll be notified as soon as they do.`, actions: [] };
  if (a.status === "funded") return { k: "O-02", title: "Review the terms", body: `${total} is locked in escrow for ${a.milestoneCount} milestone${a.milestoneCount === 1 ? "" : "s"}. Accept to start, or decline to refund the client.`, actions: [{ label: "Accept agreement", variant: "pri", intent: { type: "confirm", op: "accept" } }, { label: "Decline", variant: "sec", intent: { type: "action", kind: "decline" } }] };
  const ms = m(na.milestonePosition);
  const cr = !!ms && changesRequested(ms);
  if (ms && ms.status === "pending")
    return { k: "M-01", title: cr ? `Changes requested on ${ms.title}` : `Ready to submit ${ms.title}`, body: cr ? `${o} asked for changes${ms.changesNote ? `: “${ms.changesNote}”` : ""}. Resubmit when it’s ready.` : `When the work is done, submit a link so ${o} can review it. ${money(ms.amount, a.asset)} is waiting in escrow for this milestone.`,
      actions: [{ label: cr ? "Resubmit milestone" : "Submit milestone", variant: "pri", intent: { type: "confirm", op: "submit", position: ms.position } }] };
  if (ms?.status === "submitted") return { k: "M-02", title: `Waiting for ${o} to review`, body: `You submitted ${ms.title}. Nothing to do until it’s approved or sent back.`, actions: [] };
  return { k: "M-04", title: "Approved, not paid yet", body: `${ms?.title ?? "The milestone"} is approved. The ${money(ms?.amount, a.asset)} reaches your wallet when the client releases it.`, actions: [] };
}

/** Milestone row sub-line + inline action */
export function milestoneLine(a: Agreement, ms: Milestone): { sub: string; action?: { label: string; intent: Intent } } {
  const client = a.role === "client";
  const cur = a.milestones.find((x) => !["paid", "refunded"].includes(x.status));
  const when = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" }) : "");
  let sub = ms.description || "";
  if (ms.status === "paid") sub = `Released ${when(ms.paidAt)}`;
  else if (ms.status === "refunded") sub = `Refunded ${when(ms.refundedAt)}`;
  else if (ms.status === "submitted") sub = `Submitted ${when(ms.submittedAt)}${ms.workLink ? ` · ${ms.workLink.replace(/^https?:\/\//, "")}` : ""}`;
  else if (changesRequested(ms)) sub = `Changes requested${ms.changesNote ? `: ${ms.changesNote}` : ""}`;
  else if (ms.status === "approved") sub = "Approved, waiting for release";
  else if (a.status === "in_progress" && cur && ms.position > cur.position) sub = `Starts after milestone ${ms.position - 1}`;
  else if (a.status === "in_progress" && cur?.position === ms.position) sub = client ? "In progress" : "Ready for you";
  if (client && can(a, "approve", ms.position)) return { sub, action: { label: "Approve", intent: { type: "action", kind: "approve", position: ms.position } } };
  if (client && can(a, "release", ms.position)) return { sub, action: { label: "Release", intent: { type: "action", kind: "release", position: ms.position } } };
  if (!client && can(a, "submit", ms.position)) return { sub, action: { label: changesRequested(ms) ? "Resubmit" : "Submit", intent: { type: "confirm", op: "submit", position: ms.position } } };
  void cur;
  return { sub };
}

/* ---------- activity & transactions (AgreementActivity / ActivityRow) ---------- */
type AnyActivity = (AgreementActivity | ActivityRow) & { agreementName?: string; reference?: string; asset?: string };
export function activityText(x: AnyActivity, me: string | null, agreementName?: string): { title: string; sub: string; icon: [IconName, string, string] } {
  const w = x.byYou ? "You" : who(x.actor, me);
  const name = x.agreementName ?? agreementName ?? "";
  const mn = x.milestoneTitle ?? (x.milestonePosition ? `milestone ${x.milestonePosition}` : "");
  const amt = x.amount ? money(x.amount, x.asset ?? "USDC") : "";
  const P: Record<ActivityKind, [string, string, [IconName, string, string]]> = {
    create: [`${w} created ${name || "the agreement"}`, "Draft", ["file_new", "#B36BF2", "#FAF3FE"]],
    fund: [`${w} funded escrow${amt ? ` with ${amt}` : ""}`, name, ["safe_lock", "#2EBEF2", "#EAF8FE"]],
    accept: [`${w} accepted ${name || "the agreement"}`, "Ready to start milestone 1", ["check_circle", "#4797F6", "#ECF4FE"]],
    decline: [`${w} declined ${name || "the agreement"}`, amt ? `${amt} refunded to the client` : "Escrow refunded to the client", ["close_circle", "#7B7B7B", "#F5F5F5"]],
    submit: [`${w} submitted ${mn}`, name, ["flag", "#F0AF30", "#FEFCE6"]],
    changes: [`${w} requested changes on ${mn}`, name, ["edit", "#F0AF30", "#FEFCE6"]],
    approve: [`${w} approved ${mn}`, `${name ? `${name} · ` : ""}release comes next`, ["check_circle", "#4797F6", "#ECF4FE"]],
    release: [`${w} released ${amt || mn}`, `${name}${mn ? `${name ? " · " : ""}${mn}` : ""}`, ["bill", "#00CE5C", "#EBFEF3"]],
    propose_cancel: [`${w} proposed cancelling ${name || "the agreement"}`, "Waiting for the other side", ["time", "#F0AF30", "#FEFCE6"]],
    confirm_cancel: [`${w} confirmed the cancellation`, amt ? `${amt} refunded to the client` : name, ["close_circle", "#7B7B7B", "#F5F5F5"]],
    cancel_withdrawn: [`${w} withdrew the cancellation`, `${name || "The agreement"} continues`, ["refresh", "#4797F6", "#ECF4FE"]],
    cancel_rejected: [`${w} rejected the cancellation`, `${name || "The agreement"} continues`, ["close_circle", "#7B7B7B", "#F5F5F5"]],
    cancel: [`${w} cancelled ${name || "the agreement"}`, "It was never funded", ["close_circle", "#7B7B7B", "#F5F5F5"]],
    recover: [`${w} recovered ${amt || "the escrow"}`, name, ["refresh", "#B36BF2", "#FAF3FE"]],
  };
  const hit = P[x.kind];
  if (hit) return { title: hit[0], sub: hit[1], icon: hit[2] };
  return { title: String(x.kind).replace(/_/g, " "), sub: name, icon: ["history", "#7B7B7B", "#F5F5F5"] };
}

export function txLabel(x: ActivityRow): { label: string; icon: [IconName, string, string]; sign: 1 | -1 | 0 } {
  const inbound = x.direction === "in", sign = x.direction === "in" ? 1 : x.direction === "out" ? -1 : 0;
  if (x.type === "fund") return { label: "Fund escrow", icon: ["safe_lock", "#2EBEF2", "#EAF8FE"], sign };
  if (x.type === "release") return { label: inbound ? "Payment received" : "Release", icon: ["transfer", "#00CE5C", "#EBFEF3"], sign };
  if (x.type === "refund") return { label: x.kind === "recover" ? "Recovery" : x.kind === "decline" ? "Refund (declined)" : "Refund", icon: ["refresh", "#B36BF2", "#FAF3FE"], sign };
  const L: Partial<Record<ActivityKind, string>> = { approve: "Approve milestone", propose_cancel: "Propose cancellation", confirm_cancel: "Confirm cancellation" };
  return { label: L[x.kind] ?? x.kind.replace(/_/g, " "), icon: x.kind === "approve" ? ["check_circle", "#4797F6", "#ECF4FE"] : ["history", "#7B7B7B", "#F5F5F5"], sign };
}

export const ACTION_COPY: Record<ActionKind, { title: string; fn: string }> = {
  fund: { title: "Fund escrow", fn: "fund" }, approve: { title: "Approve milestone", fn: "approve" }, release: { title: "Release payment", fn: "release" },
  decline: { title: "Decline agreement", fn: "decline" }, propose_cancel: { title: "Propose cancellation", fn: "propose_cancel" },
  confirm_cancel: { title: "Confirm cancellation", fn: "confirm_cancel" }, recover: { title: "Recover escrow", fn: "recover" },
};
export { assetCode };
