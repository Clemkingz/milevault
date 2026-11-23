import type { BadgeKind } from "@milevault/ui";

/**
 * MOCK platform data for the operator console. Shapes mirror what the external backend
 * should return (see docs/admin.md); swap `getAdminData()` for API calls in live mode.
 */
export interface Wallet { addr: string; name: string; img?: string; bg: string; fg?: string; flagged?: boolean; lastActive: string }
export interface AdminAgreement {
  id: string; name: string; client: string; contributor: string;
  total: number; released: number; locked: number; milestones: number; paid: number;
  status: BadgeKind; createdAt: string; flag?: "cancel_requested" | "stale_submission" | "awaiting_funding";
}
export interface AdminEvent { id: string; kind: "create" | "fund" | "approve" | "release" | "refund" | "cancel" | "accept" | "submit"; agreementId: string; amount?: number; actor: string; hash: string; at: string }

const H = 36e5, D = 864e5;
const ago = (ms: number) => new Date(Date.now() - ms).toISOString();
function hash(n: number) { let x = (n * 2654435761) >>> 0, o = ""; while (o.length < 64) { x = (x * 1103515245 + 12345) >>> 0; o += x.toString(16).padStart(8, "0"); } return o.slice(0, 64); }

export const WALLETS: Wallet[] = [
  { addr: "GHBRPOIGF3CBFNOBM2O4RAK3VRJNVGFYGWWQC5HYFSXMECOSFOGYR7QX", name: "Aryan Roy", img: "av-aryan", bg: "#FFE1E6", lastActive: ago(3 * H) },
  { addr: "G5XKXWNREKPK5YROUDOCUZRENUN7Z5JQIPQ3ZXOI7FDHJK3EYY5QA4KD", name: "Kay Finley", img: "av-kay", bg: "#EFE6FF", lastActive: ago(20 * H) },
  { addr: "GHRVHS3K5AQLGTMJXKAU7BHXTPDPFF7EII6KQ3NMTZX44HPOEVBOOJHL", name: "Rhea Hull", bg: "#E1F1FF", fg: "#3B82C4", lastActive: ago(1 * D) },
  { addr: "GAEDOECVEPR7NI6P62MGG3W325DGDZVGPMM4I3LR5PE4GDAFPK276ALI", name: "Abbas Ali", bg: "#FFF1DC", fg: "#C9821C", lastActive: ago(4 * D) },
  { addr: "GNZDKYAYQ5S37JMSNDDUDD6KDFLEEPZHPCF2UQNUPQZIT5UEA5GENKNT", name: "Sophia Kent", bg: "#E3F7EA", fg: "#239A5A", lastActive: ago(1 * H) },
  { addr: "GDQ7V4ZPXM2LJ3KTWB6RNE5YHCFU8AS9OIGQ2MXEZ4TLKD7PVWRJ3NOA", name: "Nova Labs", bg: "#E8EEFF", fg: "#4C5FD5", lastActive: ago(6 * H) },
  { addr: "GCM4XKQ2B7HN5PZRJ6YWT3VLDE8FUSA9QOGI2KMXLT4ZHBN7PJVRC5WE", name: "Lena Park", bg: "#FFE9F3", fg: "#C2417F", lastActive: ago(9 * D), flagged: true },
];
const W = (i: number) => WALLETS[i]!.addr;

export const AGREEMENTS: AdminAgreement[] = [
  { id: "1041", name: "Landing page", client: W(0), contributor: W(1), total: 900, released: 0, locked: 0, milestones: 3, paid: 0, status: "awaiting", createdAt: ago(2 * D), flag: "awaiting_funding" },
  { id: "1040", name: "API integration", client: W(0), contributor: W(2), total: 1150, released: 0, locked: 1150, milestones: 2, paid: 0, status: "funded", createdAt: ago(7 * D) },
  { id: "1039", name: "Brand refresh", client: W(3), contributor: W(1), total: 1200, released: 0, locked: 1200, milestones: 2, paid: 0, status: "funded", createdAt: ago(1 * D) },
  { id: "1038", name: "Mobile app MVP", client: W(0), contributor: W(2), total: 2000, released: 0, locked: 2000, milestones: 4, paid: 0, status: "progress", createdAt: ago(21 * D) },
  { id: "1037", name: "Data pipeline", client: W(5), contributor: W(6), total: 3200, released: 800, locked: 2400, milestones: 4, paid: 1, status: "cancel_requested", createdAt: ago(18 * D), flag: "cancel_requested" },
  { id: "1036", name: "Booking app", client: W(4), contributor: W(1), total: 2000, released: 0, locked: 2000, milestones: 4, paid: 0, status: "progress", createdAt: ago(21 * D) },
  { id: "1035", name: "Token dashboard", client: W(0), contributor: W(3), total: 1200, released: 800, locked: 400, milestones: 3, paid: 2, status: "progress", createdAt: ago(30 * D) },
  { id: "1034", name: "Audit report", client: W(5), contributor: W(3), total: 1800, released: 600, locked: 1200, milestones: 3, paid: 1, status: "progress", createdAt: ago(26 * D), flag: "stale_submission" },
  { id: "1033", name: "Docs site", client: W(4), contributor: W(6), total: 650, released: 0, locked: 0, milestones: 2, paid: 0, status: "declined", createdAt: ago(33 * D) },
  { id: "1030", name: "Logo refresh", client: W(3), contributor: W(1), total: 600, released: 600, locked: 0, milestones: 1, paid: 1, status: "completed", createdAt: ago(28 * D) },
  { id: "1029", name: "Wallet audit", client: W(0), contributor: W(3), total: 800, released: 800, locked: 0, milestones: 3, paid: 3, status: "completed", createdAt: ago(60 * D) },
  { id: "1028", name: "Landing v0", client: W(5), contributor: W(2), total: 400, released: 0, locked: 0, milestones: 1, paid: 0, status: "cancelled", createdAt: ago(64 * D) },
];

export const EVENTS: AdminEvent[] = [
  { id: "e1", kind: "approve", agreementId: "1038", actor: W(0), hash: hash(1), at: ago(3 * H) },
  { id: "e2", kind: "approve", agreementId: "1036", actor: W(4), hash: hash(2), at: ago(1 * H) },
  { id: "e3", kind: "fund", agreementId: "1039", amount: 1200, actor: W(3), hash: hash(3), at: ago(1 * D) },
  { id: "e4", kind: "accept", agreementId: "1039", actor: W(1), hash: hash(4), at: ago(20 * H) },
  { id: "e5", kind: "create", agreementId: "1041", actor: W(0), hash: hash(5), at: ago(2 * D) },
  { id: "e6", kind: "release", agreementId: "1035", amount: 400, actor: W(0), hash: hash(6), at: ago(4 * D) },
  { id: "e7", kind: "fund", agreementId: "1040", amount: 1150, actor: W(0), hash: hash(7), at: ago(6 * D) },
  { id: "e8", kind: "release", agreementId: "1037", amount: 800, actor: W(5), hash: hash(8), at: ago(9 * D) },
  { id: "e9", kind: "submit", agreementId: "1034", actor: W(3), hash: hash(9), at: ago(12 * D) },
  { id: "e10", kind: "release", agreementId: "1030", amount: 600, actor: W(3), hash: hash(10), at: ago(14 * D) },
  { id: "e11", kind: "refund", agreementId: "1033", amount: 650, actor: W(6), hash: hash(11), at: ago(16 * D) },
  { id: "e12", kind: "release", agreementId: "1034", amount: 600, actor: W(5), hash: hash(12), at: ago(17 * D) },
  { id: "e13", kind: "fund", agreementId: "1037", amount: 3200, actor: W(5), hash: hash(13), at: ago(18 * D) },
  { id: "e14", kind: "fund", agreementId: "1038", amount: 2000, actor: W(0), hash: hash(14), at: ago(21 * D) },
];

export const wallet = (addr: string) => WALLETS.find((w) => w.addr === addr)!;
export const agreement = (id: string) => AGREEMENTS.find((a) => a.id === id)!;

export function stats() {
  const open = AGREEMENTS.filter((a) => ["awaiting", "funded", "progress", "cancel_requested"].includes(a.status));
  const since30 = Date.now() - 30 * D;
  return {
    tvl: AGREEMENTS.reduce((s, a) => s + a.locked, 0),
    released30: EVENTS.filter((e) => e.kind === "release" && new Date(e.at).getTime() > since30).reduce((s, e) => s + (e.amount ?? 0), 0),
    activeAgreements: open.length,
    totalAgreements: AGREEMENTS.length,
    attention: AGREEMENTS.filter((a) => a.flag).length,
    wallets: WALLETS.length,
    flagged: WALLETS.filter((w) => w.flagged).length,
    completionRate: Math.round((AGREEMENTS.filter((a) => a.status === "completed").length / Math.max(1, AGREEMENTS.filter((a) => ["completed", "cancelled", "declined"].includes(a.status)).length)) * 100),
  };
}

export const FLAG_COPY: Record<NonNullable<AdminAgreement["flag"]>, [string, string]> = {
  cancel_requested: ["Cancellation pending", "One party asked to cancel; waiting for the other to confirm."],
  stale_submission: ["Submission waiting 12 days", "A milestone has been submitted but not reviewed for over a week."],
  awaiting_funding: ["Not funded yet", "Created 2 days ago; the client hasn’t locked funds."],
};
