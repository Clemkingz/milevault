/**
 * In-browser MOCK of the MileVault backend for demo mode (`NEXT_PUBLIC_DATA_SOURCE=mock`).
 * It answers the routes in docs/FRONTEND_INTEGRATION.md with the same envelopes, shapes and error
 * codes, so the UI runs one code path. Live mode never loads this data.
 *
 *   draft ──publish──▶ created ──fund*──▶ funded ──accept──▶ in_progress ──all released──▶ completed
 *   created ──cancel──▶ cancelled      funded ──decline*──▶ declined (refund)
 *   live ──propose_cancel*──▶ open proposal ──confirm_cancel*──▶ cancelled (refund unpaid)
 *                                         ├─ reject (other party)  └─ withdraw (proposer)
 *   live, at/after recoveryAt ──recover*──▶ recovered (client reclaims unpaid)
 *   milestone: pending ──submit──▶ submitted ──approve*──▶ approved ──release*──▶ paid
 *              submitted ──request changes──▶ pending (+changesNote)        (* = signed on-chain)
 */
import type {
  ActionKind, ActionStatus, ActivityKind, ActivityRow, Agreement, AgreementActivity, AgreementSummary, ChainAction, Milestone,
  NextAction, NotificationItem, Party, SaveAgreementInput,
} from "./types";
import type { Transport, TransportRequest, TransportResponse } from "./client";
import { isValidPublicKey } from "./format";

const PASSPHRASE = "Test SDF Network ; September 2015";
const EXPLORER = "https://stellar.expert/explorer/testnet";
const USDC = "USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
const ARBITER = "GDXKCJBYL35WLW4VO4B7UW6FJNT3ECO4RNXB5CDCA7EGHAWMAYK7NYPW";
const H = 36e5, D = 864e5, MIN = 60e3;
const ADDR = /^G[A-Z2-7]{55}$/;

export interface MockWallet { address: string; label: string; role: "client" | "contributor" | "operator" }
export const mockWallets: MockWallet[] = [
  { address: "GDA5IFWPNPJD7XY3QTUIA752KOTHKI4I2ZXK5HFPYCMINNSTQ7ETHOLK", label: "Client wallet", role: "client" },
  { address: "GBHFVICLAUX7444NNXXCLHQXQC5TMGP4SFP55KDKJMBIQEBX4M5SKE6H", label: "Contributor wallet", role: "contributor" },
  { address: "GA2JJZN2VPQT5L4WS2WJ2OH7VBZINEJ2AHUE5YVMCQTMBT6SC7ZUIGZG", label: "Operator wallet", role: "operator" },
];
const [CLIENT, CONTRIB, OPERATOR] = mockWallets.map((w) => w.address) as [string, string, string];
const OTHER1 = "GAOECFHB7FJKFXOWUXXH4VGFQHOCCW7ZYR4PHQWCYXER4VDEG5UJHSMB";
const OTHER2 = "GAMSBCROQV5S5KB3YWW3ESSY7EOQMBJ7BIYZTEO2ORCGGA6OELMEH6C3";

type Derived = "role" | "displayStatus" | "nextAction" | "total" | "released" | "locked" | "refunded" | "milestoneCount" | "paidCount" | "milestoneStatuses" | "recoverySoon" | "cancellation";
interface StoredAgreement extends Omit<Agreement, Derived> { _seq: number; proposal: { proposedBy: string; createdAt: string } | null }
interface ActivityRec { id: string; ref: string; kind: ActivityKind; actor: string; milestonePosition?: number; amount: string | null; txHash: string | null; createdAt: string }
interface ActionRec { id: string; ref: string; kind: ActionKind; position?: number; by: string; status: ActionStatus; hash: string; amount: string | null; createdAt: string; expiresAt: string; submittedAt?: string; failureCode?: string | null; failure?: string | null; ledger?: number | null }
interface Balance { xlm: number; usdc: number; trust: boolean }
interface MockDB {
  v: 2;
  seq: number;
  agreements: StoredAgreement[];
  activity: ActivityRec[];
  notes: (NotificationItem & { to: string })[];
  actions: ActionRec[];
  balances: Record<string, Balance>;
  settings: { failNext: boolean; latencyMs: number };
  indexer: { lastRunAt: string; lastLedger: number };
}

const KEY = "milevault-mock-backend";
const now = () => new Date().toISOString();
const ago = (ms: number) => new Date(Date.now() - ms).toISOString();
const short = (a: string) => `${a.slice(0, 4)}…${a.slice(-4)}`;
const party = (a: string): Party => ({ address: a, shortAddress: short(a) });
const hex = (n = 64) => Array.from(crypto.getRandomValues(new Uint8Array(n / 2)), (b) => b.toString(16).padStart(2, "0")).join("");
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : hex(32));
const num = (s: string | null | undefined) => Number(s || 0);
/** Shortest exact decimal form, as the API returns it ("1500", "1250.5") */
const dec = (n: number) => String(Math.round(n * 100) / 100);
const link = (hash: string) => ({ hash, explorerUrl: `${EXPLORER}/tx/${hash}` });

function ms(position: number, title: string, amount: number, status: Milestone["status"] = "pending", x: Partial<Milestone> = {}): Milestone {
  return { id: uid(), position, title, description: "", amount: dec(amount), status, balanceId: null,
    workLink: null, workNote: null, submittedAt: null, changesNote: null, changesRequestedAt: null, approvedAt: null, approveTx: null, paidAt: null, releaseTx: null, refundedAt: null, refundTx: null, ...x };
}

/* ---------- seed ---------- */
function seed(): MockDB {
  const A = (seq: number, name: string, client: string, contributor: string, status: Agreement["status"], createdMs: number, milestones: Milestone[], x: Partial<StoredAgreement> = {}): StoredAgreement => {
    const funded = !["draft", "created"].includes(status);
    if (funded) milestones.forEach((m) => { if (m.status !== "paid") m.balanceId = hex(16); });
    return {
      _seq: seq, reference: `MV-${seq}`, name, description: "", status, client: party(client), contributor: party(contributor), asset: USDC,
      recoveryAt: funded ? new Date(Date.now() - createdMs + 90 * D).toISOString() : null,
      createdAt: ago(createdMs), fundedAt: funded ? ago(createdMs - H) : null, acceptedAt: status === "in_progress" || status === "completed" ? ago(createdMs - 2 * H) : null,
      closedAt: status === "completed" ? ago(createdMs / 3) : null, fundTx: funded ? link(hex()) : null, proposal: null, milestones, ...x,
    };
  };
  const agreements = [
    A(1041, "Landing page", CLIENT, CONTRIB, "created", 2 * D, [ms(1, "Design", 300), ms(2, "Build", 400), ms(3, "Launch", 200)], { description: "Single landing page for the product launch." }),
    A(1038, "Mobile app MVP", CLIENT, OTHER1, "in_progress", 21 * D, [ms(1, "UI/UX implementation", 450, "submitted", { workLink: "https://figma.com/proto/mvp-ui", workNote: "All screens done.", submittedAt: ago(5 * H) }), ms(2, "Booking flow", 700), ms(3, "Notifications", 450), ms(4, "Store release", 400)], { description: "iOS and Android app for the booking flow." }),
    A(1035, "Token dashboard", CLIENT, OTHER2, "in_progress", 30 * D, [ms(1, "Data layer", 400, "paid", { submittedAt: ago(23 * D), approvedAt: ago(22 * D), approveTx: link(hex()), paidAt: ago(21 * D), releaseTx: link(hex()) }), ms(2, "Charts", 400, "approved", { submittedAt: ago(2 * D), approvedAt: ago(1 * D), approveTx: link(hex()) }), ms(3, "Launch", 400)]),
    A(1029, "Wallet audit", CLIENT, OTHER2, "completed", 60 * D, [ms(1, "Threat model", 250, "paid", { paidAt: ago(49 * D), releaseTx: link(hex()) }), ms(2, "Report", 550, "paid", { paidAt: ago(35 * D), releaseTx: link(hex()) })]),
    A(1039, "Brand refresh", OTHER2, CONTRIB, "funded", 1 * D, [ms(1, "Visual direction", 600), ms(2, "Guidelines", 600)], { description: "Logo cleanup and brand guidelines." }),
    A(1036, "Booking app", OTHER1, CONTRIB, "in_progress", 21 * D, [ms(1, "UI/UX implementation", 450, "paid", { paidAt: ago(6 * D), releaseTx: link(hex()) }), ms(2, "Booking flow", 700, "pending", { workLink: "https://staging.booking.app", submittedAt: ago(3 * D), changesNote: "Please add the mobile layouts.", changesRequestedAt: ago(1 * D) }), ms(3, "Notifications", 450)]),
  ];
  const db: MockDB = {
    v: 2, seq: 1042, agreements, activity: [], notes: [], actions: [],
    balances: { [CLIENT]: { xlm: 48.2, usdc: 2450, trust: true }, [CONTRIB]: { xlm: 21.75, usdc: 312.4, trust: true }, [OTHER1]: { xlm: 30, usdc: 900, trust: true }, [OTHER2]: { xlm: 80, usdc: 5200, trust: true }, [OPERATOR]: { xlm: 10, usdc: 0, trust: false } },
    settings: { failNext: false, latencyMs: 1200 }, indexer: { lastRunAt: ago(40e3), lastLedger: 5885050 },
  };
  for (const a of agreements) {
    const add = (kind: ActivityKind, actor: string, at: string, x: Partial<ActivityRec> = {}) => db.activity.push({ id: uid(), ref: a.reference, kind, actor, createdAt: at, amount: null, txHash: null, ...x });
    add("create", a.client.address, a.createdAt);
    if (a.fundTx) add("fund", a.client.address, a.fundedAt!, { amount: dec(a.milestones.reduce((s, m) => s + num(m.amount), 0)), txHash: a.fundTx.hash });
    if (a.acceptedAt) add("accept", a.contributor!.address, a.acceptedAt);
    for (const m of a.milestones) {
      if (m.submittedAt) add("submit", a.contributor!.address, m.submittedAt, { milestonePosition: m.position });
      if (m.changesRequestedAt) add("changes", a.client.address, m.changesRequestedAt, { milestonePosition: m.position });
      if (m.approvedAt) add("approve", a.client.address, m.approvedAt, { milestonePosition: m.position, txHash: m.approveTx?.hash ?? null });
      if (m.paidAt) add("release", a.client.address, m.paidAt, { milestonePosition: m.position, amount: m.amount, txHash: m.releaseTx!.hash });
    }
  }
  // Every on-chain activity in the seed came from a confirmed action (what the admin console lists).
  const ON_CHAIN: ActivityKind[] = ["fund", "approve", "release", "decline", "propose_cancel", "confirm_cancel", "recover"];
  for (const x of db.activity) if (x.txHash && ON_CHAIN.includes(x.kind))
    db.actions.push({ id: uid(), ref: x.ref, kind: x.kind as ActionKind, position: x.milestonePosition, by: x.actor, status: "confirmed", hash: x.txHash, amount: x.amount, createdAt: x.createdAt, submittedAt: x.createdAt, expiresAt: new Date(new Date(x.createdAt).getTime() + 5 * MIN).toISOString(), ledger: 5884000 + db.actions.length });
  // Operator console examples: one release that never settled (stuck), one failed approval.
  db.actions.push({ id: uid(), ref: "MV-1035", kind: "release", position: 2, by: CLIENT, status: "pending", hash: hex(), amount: "400", createdAt: ago(2 * H), submittedAt: ago(2 * H), expiresAt: ago(2 * H - 5 * MIN) });
  db.actions.push({ id: uid(), ref: "MV-1038", kind: "approve", position: 1, by: CLIENT, status: "failed", hash: hex(), amount: null, createdAt: ago(26 * H), submittedAt: ago(26 * H), expiresAt: ago(26 * H - 5 * MIN), failureCode: "WALLET_SEQUENCE_CHANGED", failure: "Your wallet sent another transaction first. Nothing moved. Try again." });
  db.notes.push({ id: uid(), to: CLIENT, type: "milestone_submitted", title: "UI/UX implementation submitted", message: "Mobile app MVP · ready for your review", reference: "MV-1038", read: false, createdAt: ago(5 * H) });
  db.notes.push({ id: uid(), to: CONTRIB, type: "agreement_funded", title: "Brand refresh is funded", message: "1,200.00 USDC is locked in escrow for you. Review the terms and accept.", reference: "MV-1039", read: false, createdAt: ago(1 * D) });
  db.notes.push({ id: uid(), to: CONTRIB, type: "changes_requested", title: "Changes requested on Booking flow", message: "Please add the mobile layouts.", reference: "MV-1036", read: false, createdAt: ago(1 * D) });
  return db;
}

let cache: MockDB | null = null;
function load(): MockDB {
  if (cache) return cache;
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(KEY) : null;
    const parsed = raw ? (JSON.parse(raw) as MockDB) : null;
    cache = parsed && parsed.v === 2 ? parsed : seed(); // older demo data → reseed
  } catch { cache = seed(); }
  return cache;
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch { /* private mode */ } }

/* ---------- derived fields (what the backend computes) ---------- */
const live = (a: { status: string }) => a.status === "funded" || a.status === "in_progress";
const pastRecovery = (a: StoredAgreement) => !!a.recoveryAt && Date.now() >= new Date(a.recoveryAt).getTime();
const current = (a: StoredAgreement) => a.milestones.find((m) => m.status !== "paid" && m.status !== "refunded");
const isParty = (a: StoredAgreement, me: string) => a.client.address === me || a.contributor?.address === me;
const inFlight = (db: MockDB, ref: string) => db.actions.find((x) => x.ref === ref && x.status === "pending" && new Date(x.expiresAt).getTime() > Date.now());

function derive(a: StoredAgreement, me: string): Agreement {
  const role = a.client.address === me ? "client" : "contributor";
  const total = a.milestones.reduce((s, m) => s + num(m.amount), 0);
  const released = a.milestones.filter((m) => m.status === "paid").reduce((s, m) => s + num(m.amount), 0);
  const refunded = a.milestones.filter((m) => m.status === "refunded").reduce((s, m) => s + num(m.amount), 0);
  const locked = a.fundedAt ? total - released - refunded : 0;
  const recoverySoon = live(a) && !!a.recoveryAt && new Date(a.recoveryAt).getTime() - Date.now() < 7 * D;
  const displayStatus = a.status === "created" ? "awaiting_funding" : a.status === "funded" ? "awaiting_contributor" : a.status;
  const { _seq: _s, proposal, ...rest } = a; void _s;
  return {
    ...rest, role, displayStatus, nextAction: nextAction(a, role, me), total: dec(total), released: dec(released), locked: dec(locked), refunded: dec(refunded),
    milestoneCount: a.milestones.length, paidCount: a.milestones.filter((m) => m.status === "paid").length, milestoneStatuses: a.milestones.map((m) => m.status), recoverySoon,
    cancellation: proposal && live(a) ? { proposedBy: proposal.proposedBy, proposedByYou: proposal.proposedBy === me, createdAt: proposal.createdAt } : null,
  };
}
function nextAction(a: StoredAgreement, role: "client" | "contributor", me: string): NextAction {
  if (["completed", "cancelled", "declined", "recovered"].includes(a.status)) return { type: "none" };
  if (role === "client") {
    if (a.status === "draft") return { type: "publish" };
    if (a.status === "created") return { type: "fund" };
  }
  if (live(a) && pastRecovery(a)) return role === "client" ? { type: "recover" } : { type: "wait" };
  if (a.proposal && live(a)) return a.proposal.proposedBy === me ? { type: "wait" } : { type: "confirm_cancel" };
  if (a.status === "funded") return role === "contributor" ? { type: "accept" } : { type: "wait" };
  if (a.status === "in_progress") {
    const m = current(a);
    if (!m) return { type: "wait" };
    if (role === "client" && m.status === "submitted") return { type: "approve", milestonePosition: m.position };
    if (role === "client" && m.status === "approved") return { type: "release", milestonePosition: m.position };
    if (role === "contributor" && m.status === "pending") return { type: "submit", milestonePosition: m.position };
    return { type: "wait", milestonePosition: m.position };
  }
  return { type: "wait" };
}
const summary = (a: Agreement): AgreementSummary => {
  const { description: _d, fundedAt: _f, acceptedAt: _a, closedAt: _c, fundTx: _t, cancellation: _x, milestones: _m, ...s } = a;
  void _d; void _f; void _a; void _c; void _t; void _x; void _m;
  return s;
};

const ACTIVITY_TYPE: Partial<Record<ActivityKind, ActivityRow["type"]>> = { fund: "fund", release: "release", decline: "refund", confirm_cancel: "refund", recover: "refund" };
function activityOf(db: MockDB, x: ActivityRec, me: string): AgreementActivity {
  const a = db.agreements.find((y) => y.reference === x.ref);
  const m = x.milestonePosition ? a?.milestones.find((y) => y.position === x.milestonePosition) : undefined;
  return { id: x.id, kind: x.kind, actor: x.actor, byYou: x.actor === me, ...(x.milestonePosition ? { milestonePosition: x.milestonePosition, milestoneTitle: m?.title } : {}),
    amount: x.amount, txHash: x.txHash, explorerUrl: x.txHash ? `${EXPLORER}/tx/${x.txHash}` : null, createdAt: x.createdAt };
}
function rowOf(db: MockDB, x: ActivityRec, me: string): ActivityRow {
  const a = db.agreements.find((y) => y.reference === x.ref)!;
  const type = ACTIVITY_TYPE[x.kind] ?? "other";
  const inbound = (type === "release" && a.contributor?.address === me) || (type === "refund" && a.client.address === me);
  const outbound = type === "fund" && a.client.address === me;
  const m = x.milestonePosition ? a.milestones.find((y) => y.position === x.milestonePosition) : undefined;
  return { id: x.id, reference: a.reference, agreementName: a.name, kind: x.kind, type, actor: x.actor, byYou: x.actor === me, milestonePosition: x.milestonePosition ?? null, milestoneTitle: m?.title ?? null,
    amount: x.amount, direction: x.amount ? (inbound ? "in" : outbound ? "out" : null) : null, asset: a.asset, txHash: x.txHash, explorerUrl: x.txHash ? `${EXPLORER}/tx/${x.txHash}` : null, createdAt: x.createdAt };
}

const STATUS_MSG: Record<ActionKind, string> = {
  fund: "Escrow funded. The contributor can now accept.",
  approve: "Milestone approved. Release the payment as the next step.",
  release: "Payment released to the contributor.",
  decline: "Agreement declined. The client was refunded.",
  propose_cancel: "Cancellation proposed. The other party can confirm or reject it.",
  confirm_cancel: "Agreement cancelled. Unpaid milestones were refunded to the client.",
  recover: "Unpaid milestones were returned to your wallet.",
};
function chain(db: MockDB, rec: ActionRec): ChainAction {
  const msg = rec.status === "confirmed" ? STATUS_MSG[rec.kind]
    : rec.status === "pending" ? "Submitted to Stellar. Waiting for confirmation."
    : rec.status === "prepared" ? "Ready to sign in your wallet."
    : rec.status === "expired" ? "The transaction expired. Nothing moved."
    : rec.failure ?? "The transaction failed. Nothing moved.";
  return { id: rec.id, kind: rec.kind, status: rec.status, hash: rec.hash, amount: rec.amount, transaction: rec.status === "prepared" ? `MOCKTX.${rec.id}` : null,
    networkPassphrase: PASSPHRASE, expiresAt: rec.expiresAt, ledger: rec.status === "confirmed" ? (rec.ledger ?? db.indexer.lastLedger) : null,
    explorerUrl: rec.status === "pending" || rec.status === "confirmed" || rec.status === "failed" ? `${EXPLORER}/tx/${rec.hash}` : null,
    statusMessage: msg, failureCode: rec.status === "failed" ? (rec.failureCode ?? "TRANSACTION_FAILED") : null, failure: rec.status === "failed" ? (rec.failure ?? "The network rejected the transaction. Nothing moved.") : null,
    failureCodes: rec.status === "failed" ? [rec.failureCode ?? "TRANSACTION_FAILED"] : null };
}

/* ---------- helpers ---------- */
type Field = { field: string; message: string };
class MockHttpError { constructor(public status: number, public code: string, public message: string, public fields?: Field[], public details?: Record<string, unknown>) {} }
const fail = (status: number, code: string, message: string, fields?: Field[], details?: Record<string, unknown>): never => { throw new MockHttpError(status, code, message, fields, details); };
const NO_CONTENT = Symbol("204");
function paginate<T>(items: T[], q: Record<string, unknown>) {
  const limit = Math.min(100, Math.max(1, Number(q.limit ?? 20))), offset = Math.max(0, Number(q.offset ?? 0));
  const totalCount = items.length, totalPage = Math.ceil(totalCount / limit), currentPage = Math.floor(offset / limit) + 1;
  const result = items.slice(offset, offset + limit);
  return { result, paginationMeta: { nextPage: offset + limit < totalCount, previousPage: offset > 0, currentPage, totalPage, totalCount, pageCount: result.length } };
}
const NOT_FOUND = "We could not find this agreement, or this wallet is not part of it.";
function mine(db: MockDB, me: string) { return db.agreements.filter((a) => a.client.address === me || (a.contributor?.address === me && a.status !== "draft")); }
function find(db: MockDB, ref: string, me: string) {
  const a = db.agreements.find((x) => x.reference.toUpperCase() === ref.toUpperCase());
  if (!a || !isParty(a, me) || (a.status === "draft" && a.client.address !== me)) fail(404, "AGREEMENT_NOT_FOUND", NOT_FOUND);
  return a!;
}
function act(db: MockDB, a: StoredAgreement, kind: ActivityKind, actor: string, x: Partial<ActivityRec> = {}) {
  db.activity.unshift({ id: uid(), ref: a.reference, kind, actor, createdAt: now(), amount: null, txHash: null, ...x });
}
function notify(db: MockDB, to: string | undefined, title: string, message: string, a: StoredAgreement, type: string) {
  if (to) db.notes.unshift({ id: uid(), to, type, title, message, reference: a.reference, read: false, createdAt: now() });
}
const other = (a: StoredAgreement, me: string) => (a.client.address === me ? a.contributor?.address : a.client.address);
const needState = (ok: boolean, msg: string) => { if (!ok) fail(409, "INVALID_AGREEMENT_STATE", msg); };
const AMOUNT = /^\d+(\.\d{1,2})?$/;
function validateDraft(input: SaveAgreementInput, me: string) {
  const fields: Field[] = [];
  const allowed = new Set(["name", "description", "contributorAddress", "milestones"]);
  for (const k of Object.keys(input ?? {})) if (!allowed.has(k)) fields.push({ field: k, message: `"${k}" is not a recognized field.` });
  if (input.name && input.name.length > 60) fields.push({ field: "name", message: "Use 60 characters or fewer." });
  if (input.description && input.description.length > 500) fields.push({ field: "description", message: "Use 500 characters or fewer." });
  if (input.contributorAddress && !isValidPublicKey(input.contributorAddress)) fields.push({ field: "contributorAddress", message: "Enter a valid Stellar address. It starts with G and has 56 characters." });
  if (input.milestones && input.milestones.length > 10) fields.push({ field: "milestones", message: "Use 10 milestones or fewer." });
  input.milestones?.forEach((m, i) => {
    if (m.title && m.title.length > 60) fields.push({ field: `milestones.${i}.title`, message: "Use 60 characters or fewer." });
    if (m.description && m.description.length > 500) fields.push({ field: `milestones.${i}.description`, message: "Use 500 characters or fewer." });
    if (m.amount && num(m.amount) > 9e11) fields.push({ field: `milestones.${i}.amount`, message: "Use at most 900,000,000,000 per milestone." });
    if (m.amount && (!AMOUNT.test(m.amount) || num(m.amount) <= 0)) fields.push({ field: `milestones.${i}.amount`, message: "Enter an amount as text with up to 2 decimal places, like \"300.00\"." });
  });
  if ((input.milestones ?? []).reduce((s, m) => s + num(m.amount), 0) > 9e11) fail(400, "AGREEMENT_TOTAL_TOO_LARGE", "The agreement total can be at most 900,000,000,000.");
  if (input.contributorAddress === me) fail(400, "CONTRIBUTOR_IS_CLIENT", "The contributor must be a different wallet from yours.", [{ field: "contributorAddress", message: "The contributor must be a different wallet from yours." }]);
  if (fields.length) fail(400, "VALIDATION_FAILED", fields.length === 1 ? fields[0]!.message : `Please fix the ${fields.length} highlighted fields.`, fields);
}
const toMilestones = (list: SaveAgreementInput["milestones"] = []) => list.map((x, i) => ({ ...ms(i + 1, x.title ?? "", 0), description: x.description ?? "", amount: x.amount ? dec(num(x.amount)) : "" }));

/* ---------- router ---------- */
async function handle(req: TransportRequest, db: MockDB): Promise<unknown> {
  const { method, path, body } = req;
  const q = (req.query ?? {}) as Record<string, unknown>;
  const tokenAddr = req.token?.startsWith("mock.") && ADDR.test(req.token.slice(5)) ? req.token.slice(5) : null;
  const authed = () => tokenAddr ?? fail(401, req.token ? "SESSION_EXPIRED" : "WALLET_NOT_CONNECTED", req.token ? "Your session has ended. Connect your wallet again." : "Connect your wallet to continue.");
  const m = (re: RegExp) => path.match(re);
  let r: RegExpMatchArray | null;

  if (method === "GET" && path === "/health") return { status: "ok", database: "up", redis: "up" };
  if (method === "GET" && path === "/stellar/network")
    return { network: "testnet", networkPassphrase: PASSPHRASE, horizonUrl: "https://horizon-testnet.stellar.org", explorerUrl: EXPLORER,
      assets: [{ id: "XLM", code: "XLM", issuer: null, native: true }, { id: USDC, code: "USDC", issuer: USDC.split(":")[1], native: false }], platformAccount: ARBITER };
  if (method === "GET" && (r = m(/^\/stellar\/accounts\/(G[A-Z2-7]{55})$/))) {
    const b = db.balances[r[1]!];
    return { address: r[1], shortAddress: short(r[1]!), exists: !!b && b.xlm > 0, explorerUrl: `${EXPLORER}/account/${r[1]}`, assets: [
      { id: "XLM", code: "XLM", issuer: null, native: true, trusted: !!b, balance: b ? b.xlm.toFixed(7) : null },
      { id: USDC, code: "USDC", issuer: USDC.split(":")[1], native: false, trusted: !!b?.trust, balance: b?.trust ? b.usdc.toFixed(7) : null }] };
  }
  if (method === "GET" && path === "/escrow/config") return { configured: true, network: "testnet", networkPassphrase: PASSPHRASE, asset: USDC, arbiter: ARBITER, recoveryDays: 90 };
  /* auth */
  if (method === "POST" && path === "/wallet-auth/challenge") {
    const addr = (body as { address?: string })?.address ?? "";
    if (!isValidPublicKey(addr)) fail(400, "INVALID_ADDRESS", "Enter a valid Stellar address. It starts with G and has 56 characters.", [{ field: "address", message: "Enter a valid Stellar address." }]);
    return { transaction: `MOCKCHALLENGE.${addr}.${hex(16)}`, networkPassphrase: PASSPHRASE, homeDomain: "milevault.app", expiresAt: new Date(Date.now() + 5 * MIN).toISOString() };
  }
  if (method === "POST" && path === "/wallet-auth/verify") {
    const t = (body as { transaction?: string })?.transaction ?? "";
    const mt = t.match(/^SIGNED\.MOCKCHALLENGE\.(G[A-Z2-7]{55})\./);
    if (!mt) fail(401, "CHALLENGE_NOT_SIGNED", "The sign-in request was not signed by this wallet. Try again.");
    const address = mt![1]!;
    db.balances[address] ??= { xlm: 0, usdc: 0, trust: false };
    return { address, shortAddress: short(address), networkPassphrase: PASSPHRASE, expiresAt: new Date(Date.now() + 12 * H).toISOString(), walletToken: `mock.${address}`, tokenType: "Bearer", expiresIn: 43200 };
  }
  if (method === "GET" && path === "/wallet-auth/session") { const a = authed(); return { address: a, shortAddress: short(a), networkPassphrase: PASSPHRASE, expiresAt: new Date(Date.now() + 12 * H).toISOString() }; }
  if (method === "POST" && path === "/wallet-auth/logout") { authed(); return NO_CONTENT; }

  /* admin: same wallet token, plus the backend allowlist */
  if (path.startsWith("/admin")) return admin(req, db, authed());

  const me = authed();
  /* agreements */
  if (method === "GET" && path === "/agreements") {
    const f = String(q.filter ?? "all"), s = String(q.search ?? "").trim().toLowerCase();
    let list = mine(db, me).map((a) => derive(a, me));
    if (f === "client") list = list.filter((a) => a.role === "client");
    if (f === "contributor") list = list.filter((a) => a.role === "contributor");
    if (f === "needs") list = list.filter((a) => !["wait", "none"].includes(a.nextAction.type));
    if (f === "completed") list = list.filter((a) => a.status === "completed");
    if (s) list = list.filter((a) => a.name.toLowerCase().includes(s) || a.reference.toLowerCase().includes(s) || a.client.address.toLowerCase().includes(s) || !!a.contributor?.address.toLowerCase().includes(s));
    list.sort((x, y) => y.createdAt.localeCompare(x.createdAt));
    return paginate(list.map(summary), q);
  }
  if (method === "POST" && path === "/agreements") {
    const input = (body ?? {}) as SaveAgreementInput; validateDraft(input, me);
    const seq = db.seq++;
    const a: StoredAgreement = { _seq: seq, reference: `MV-${seq}`, name: input.name ?? "", description: input.description ?? "", status: "draft", client: party(me), contributor: input.contributorAddress ? party(input.contributorAddress) : null, asset: USDC,
      recoveryAt: null, createdAt: now(), fundedAt: null, acceptedAt: null, closedAt: null, fundTx: null, proposal: null, milestones: toMilestones(input.milestones) };
    db.agreements.unshift(a);
    return derive(a, me);
  }
  if ((r = m(/^\/agreements\/(MV-\d+)$/i))) {
    const a = find(db, r[1]!, me);
    if (method === "GET") return derive(a, me);
    if (a.client.address !== me) fail(403, "NOT_CLIENT", "Only the client can change this agreement.");
    needState(a.status === "draft", "Only a draft can be changed. Published terms are fixed.");
    if (method === "PATCH") {
      const input = (body ?? {}) as SaveAgreementInput; validateDraft(input, me);
      if (input.name !== undefined) a.name = input.name;
      if (input.description !== undefined) a.description = input.description;
      if (input.contributorAddress !== undefined) a.contributor = input.contributorAddress ? party(input.contributorAddress) : null;
      if (input.milestones) a.milestones = toMilestones(input.milestones);
      return derive(a, me);
    }
    if (method === "DELETE") { db.agreements = db.agreements.filter((x) => x !== a); return NO_CONTENT; }
  }
  if (method === "GET" && (r = m(/^\/agreements\/(MV-\d+)\/activity$/i))) {
    const a = find(db, r[1]!, me);
    return db.activity.filter((x) => x.ref === a.reference).sort((x, y) => y.createdAt.localeCompare(x.createdAt)).map((x) => activityOf(db, x, me));
  }
  if (method === "POST" && (r = m(/^\/agreements\/(MV-\d+)\/(publish|accept|cancel)$/i))) {
    const a = find(db, r[1]!, me); const op = r[2]!;
    if (op === "publish") {
      if (a.client.address !== me) fail(403, "NOT_CLIENT", "Only the client can publish this agreement.");
      if (a.status !== "draft") fail(409, "AGREEMENT_ALREADY_PUBLISHED", "This agreement is already published.");
      const f: Field[] = [];
      if (!a.name.trim()) f.push({ field: "name", message: "Give the agreement a name." });
      if (!a.contributor) f.push({ field: "contributorAddress", message: "Add your contributor's Stellar address." });
      if (!a.milestones.length) f.push({ field: "milestones", message: "Add at least one milestone." });
      a.milestones.forEach((x, i) => { if (!x.title.trim()) f.push({ field: `milestones.${i}.title`, message: "Give this milestone a title." }); if (!(num(x.amount) > 0)) f.push({ field: `milestones.${i}.amount`, message: "Enter an amount above 0." }); });
      if (f.length) fail(422, "DRAFT_INCOMPLETE", "Finish the highlighted fields before you publish.", f);
      a.status = "created"; notify(db, a.contributor?.address, `${a.name} was shared with you`, "It isn't funded yet. Don't start work until it is.", a, "agreement_published");
    }
    if (op === "accept") {
      if (a.contributor?.address !== me) fail(403, "NOT_CONTRIBUTOR", "Only the contributor can accept this agreement.");
      if (a.status === "in_progress") fail(409, "ALREADY_ACCEPTED", "You already accepted this agreement.");
      needState(a.status === "funded", "This agreement can be accepted once it's funded.");
      if (pastRecovery(a)) fail(409, "RECOVERY_DATE_PASSED", "The recovery date has passed, so this agreement can't continue.");
      a.status = "in_progress"; a.acceptedAt = now(); act(db, a, "accept", me); notify(db, a.client.address, `${a.name} was accepted`, "The contributor can start milestone 1.", a, "agreement_accepted");
    }
    if (op === "cancel") {
      if (a.client.address !== me) fail(403, "NOT_CLIENT", "Only the client can cancel this agreement.");
      if (live(a)) fail(409, "MUTUAL_CANCEL_REQUIRED", "This agreement is funded, so both sides need to agree to cancel it.");
      needState(a.status === "created", "Only an unfunded agreement can be cancelled.");
      a.status = "cancelled"; a.closedAt = now(); act(db, a, "cancel", me); notify(db, a.contributor?.address, `${a.name} was cancelled`, "It was never funded, so no money moved.", a, "agreement_cancelled");
    }
    return derive(a, me);
  }
  if (method === "POST" && (r = m(/^\/agreements\/(MV-\d+)\/milestones\/(\d+)\/(submit|request-changes)$/i))) {
    const a = find(db, r[1]!, me); const pos = Number(r[2]);
    const ml = a.milestones.find((x) => x.position === pos) ?? fail(404, "MILESTONE_NOT_FOUND", "We could not find that milestone.");
    if (r[3] === "submit") {
      const b = (body ?? {}) as { link?: string; note?: string };
      if (a.contributor?.address !== me) fail(403, "NOT_CONTRIBUTOR", "Only the contributor can submit work.");
      if (a.status === "funded") fail(409, "NOT_ACCEPTED", "Accept the agreement before you submit work.");
      needState(a.status === "in_progress", "Work can only be submitted on an agreement in progress.");
      if (current(a)?.position !== pos) fail(409, "MILESTONE_OUT_OF_ORDER", "Milestones are submitted in order. Submit the current one first.");
      if (ml.status !== "pending") fail(409, "INVALID_MILESTONE_STATE", "This milestone is already submitted.");
      const f: Field[] = [];
      if (!b.link || !/^https?:\/\/\S+\.\S+/.test(b.link) || b.link.length > 500) f.push({ field: "link", message: "Enter a full link that starts with http:// or https://." });
      if (b.note && b.note.length > 300) f.push({ field: "note", message: "Use 300 characters or fewer." });
      if (f.length) fail(400, "VALIDATION_FAILED", f[0]!.message, f);
      Object.assign(ml, { status: "submitted", workLink: b.link, workNote: b.note ?? null, submittedAt: now() });
      act(db, a, "submit", me, { milestonePosition: pos }); notify(db, a.client.address, `${ml.title} submitted`, `${a.name} · ready for your review`, a, "milestone_submitted");
    } else {
      const note = ((body ?? {}) as { note?: string }).note ?? "";
      if (a.client.address !== me) fail(403, "NOT_CLIENT", "Only the client can request changes.");
      if (ml.status !== "submitted") fail(409, "INVALID_MILESTONE_STATE", "Only submitted work can be sent back.");
      if (!note.trim() || note.length > 300) fail(400, "VALIDATION_FAILED", "Tell the contributor what to change.", [{ field: "note", message: note.trim() ? "Use 300 characters or fewer." : "Tell the contributor what to change." }]);
      Object.assign(ml, { status: "pending", changesNote: note, changesRequestedAt: now() });
      act(db, a, "changes", me, { milestonePosition: pos }); notify(db, a.contributor?.address, `Changes requested on ${ml.title}`, note, a, "changes_requested");
    }
    return derive(a, me);
  }
  if (method === "POST" && (r = m(/^\/agreements\/(MV-\d+)\/cancellation\/(withdraw|reject)$/i))) {
    const a = find(db, r[1]!, me);
    if (!a.proposal || !live(a)) fail(409, "NO_OPEN_CANCELLATION", "There's no open cancellation on this agreement.");
    if (r[2] === "withdraw" && a.proposal!.proposedBy !== me) fail(403, "NOT_CANCELLATION_PROPOSER", "Only the wallet that proposed the cancellation can withdraw it.");
    if (r[2] === "reject" && a.proposal!.proposedBy === me) fail(403, "CANNOT_REJECT_OWN_CANCELLATION", "The other party has to respond to your proposal.");
    a.proposal = null; act(db, a, r[2] === "withdraw" ? "cancel_withdrawn" : "cancel_rejected", me);
    notify(db, other(a, me), r[2] === "withdraw" ? "Cancellation withdrawn" : "Cancellation rejected", `${a.name} continues as agreed.`, a, "cancellation_" + r[2]);
    return derive(a, me);
  }
  /* on-chain actions */
  if (method === "POST" && (r = m(/^\/agreements\/(MV-\d+)\/actions$/i))) {
    const a = find(db, r[1]!, me); const { kind, position } = (body ?? {}) as { kind: ActionKind; position?: number };
    const isClient = a.client.address === me;
    const ml = position ? a.milestones.find((x) => x.position === position) : undefined;
    if (inFlight(db, a.reference)) fail(409, "TRANSACTION_IN_PROGRESS", "Another transaction on this agreement is still confirming. Try again in a few seconds.");
    const clientOnly = () => { if (!isClient) fail(403, "NOT_CLIENT", "Only the client can do this."); };
    const beforeRecovery = () => { if (pastRecovery(a)) fail(409, "RECOVERY_DATE_PASSED", "The recovery date has passed. The client can now recover unpaid funds."); };
    switch (kind) {
      case "fund": clientOnly(); if (live(a)) fail(409, "ALREADY_FUNDED", "This agreement is already funded."); needState(a.status === "created", "Publish the agreement before funding it."); break;
      case "approve": case "release": {
        clientOnly(); needState(a.status === "in_progress", "This agreement isn't in progress."); beforeRecovery();
        if (!ml) fail(404, "MILESTONE_NOT_FOUND", "We could not find that milestone.");
        if (ml!.status === "paid") fail(409, "MILESTONE_ALREADY_PAID", "This milestone is already paid.");
        if (current(a)?.position !== position) fail(409, "MILESTONE_OUT_OF_ORDER", "Milestones are paid in order.");
        if (ml!.status !== (kind === "approve" ? "submitted" : "approved")) fail(409, "INVALID_MILESTONE_STATE", kind === "approve" ? "Only submitted work can be approved." : "Approve this milestone before releasing it.");
        break;
      }
      case "decline": if (isClient) fail(403, "NOT_CONTRIBUTOR", "Only the contributor can decline."); if (a.status === "in_progress") fail(409, "ALREADY_ACCEPTED", "You already accepted, so propose a cancellation instead."); needState(a.status === "funded", "Only a funded agreement can be declined."); beforeRecovery(); break;
      case "propose_cancel": if (a.status === "created") fail(409, "CANCEL_NOT_NEEDED", "This agreement isn't funded. The client can cancel it directly."); needState(live(a), "Only a live agreement can be cancelled."); if (a.proposal) fail(409, "CANCELLATION_ALREADY_OPEN", "A cancellation is already open on this agreement."); beforeRecovery(); break;
      case "confirm_cancel": if (!a.proposal || !live(a)) fail(409, "NO_OPEN_CANCELLATION", "There's no open cancellation to confirm."); if (a.proposal!.proposedBy === me) fail(403, "CANNOT_CONFIRM_OWN_CANCELLATION", "The other party has to confirm your proposal."); beforeRecovery(); break;
      case "recover": clientOnly(); needState(live(a), "Only a live agreement can be recovered."); if (!pastRecovery(a)) fail(409, "RECOVERY_NOT_REACHED", `Recovery opens on ${new Date(a.recoveryAt!).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}.`); break;
      default: fail(400, "VALIDATION_FAILED", "Unknown action.", [{ field: "kind", message: "Unknown action." }]);
    }
    const total = a.milestones.reduce((s, x) => s + num(x.amount), 0);
    const b = db.balances[me];
    if (!b || b.xlm <= 0) fail(422, "ACCOUNT_NOT_ACTIVE", "This wallet isn't active on Stellar yet. Add test XLM to activate it.");
    if (kind === "fund") {
      if (!b!.trust) fail(422, "TRUSTLINE_MISSING", "Enable USDC in your wallet before funding.");
      if (b!.usdc < total) fail(422, "INSUFFICIENT_BALANCE", `You need ${dec(total - b!.usdc)} more USDC to fund this agreement.`, undefined, { shortfall: dec(total - b!.usdc), required: dec(total), balance: dec(b!.usdc) });
    }
    if (kind === "release" && !db.balances[a.contributor!.address]?.trust) fail(422, "RECIPIENT_TRUSTLINE_MISSING", "The contributor needs to enable USDC before you can pay them.", undefined, { recipient: "contributor" });
    // Each preparation replaces the previous unsigned one for this agreement.
    db.actions.forEach((x) => { if (x.ref === a.reference && x.status === "prepared") x.status = "expired"; });
    const unpaid = dec(a.milestones.filter((x) => x.status !== "paid" && x.status !== "refunded").reduce((s, x) => s + num(x.amount), 0));
    const amount = kind === "fund" ? dec(total) : kind === "release" ? ml!.amount : ["decline", "confirm_cancel", "recover"].includes(kind) ? unpaid : null;
    const rec: ActionRec = { id: uid(), ref: a.reference, kind, position, by: me, status: "prepared", hash: hex(), amount, createdAt: now(), expiresAt: new Date(Date.now() + 5 * MIN).toISOString() };
    db.actions.push(rec);
    return chain(db, rec);
  }
  if ((r = m(/^\/actions\/([\w-]+)(\/submit)?$/))) {
    const rec = db.actions.find((x) => x.id === r![1]) ?? fail(404, "ACTION_NOT_FOUND", "We could not find that transaction.");
    if (rec!.by !== me) fail(403, "ACTION_WRONG_WALLET", "This transaction was prepared for another wallet.");
    if (method === "GET") {
      // Settles after the configured latency, like a ledger closing.
      if (rec!.status === "pending" && Date.now() - new Date(rec!.submittedAt!).getTime() >= db.settings.latencyMs) settle(db, rec!);
      return chain(db, rec!);
    }
    if (rec!.status === "expired" || (rec!.status === "prepared" && new Date(rec!.expiresAt).getTime() < Date.now())) { rec!.status = "expired"; fail(409, "ACTION_EXPIRED", "This transaction expired or was replaced. Prepare a new one."); }
    if (rec!.status !== "prepared") fail(409, "TRANSACTION_IN_PROGRESS", "This transaction was already submitted.");
    if ((body as { signedTransaction?: string })?.signedTransaction !== `SIGNED.MOCKTX.${rec!.id}`) fail(400, "TRANSACTION_MISMATCH", "The wallet didn't sign the original transaction. Start again.");
    rec!.status = "pending"; rec!.submittedAt = now();
    return chain(db, rec!);
  }
  /* overview */
  if (method === "GET" && path === "/dashboard") {
    const list = mine(db, me).map((a) => derive(a, me));
    const sumMs = (as: Agreement[], st: string) => as.flatMap((a) => a.milestones.filter((x) => x.status === st)).reduce((s, x) => s + num(x.amount), 0);
    const asC = list.filter((a) => a.role === "client"), asK = list.filter((a) => a.role === "contributor");
    const openList = list.filter((a) => ["created", "funded", "in_progress"].includes(a.status));
    const waiting = list.filter((a) => !["wait", "none"].includes(a.nextAction.type)).map((a) => {
      const p = a.nextAction.milestonePosition; const ml = p ? a.milestones.find((x) => x.position === p) : undefined;
      return { reference: a.reference, agreementName: a.name, action: a.nextAction.type as Exclude<NextAction["type"], "wait" | "none">, milestonePosition: p ?? null, milestoneTitle: ml?.title ?? null, milestoneCount: a.milestoneCount, amount: ml?.amount ?? a.total };
    });
    const refs = new Set(list.map((a) => a.reference));
    const recent = db.activity.filter((x) => refs.has(x.ref)).sort((x, y) => y.createdAt.localeCompare(x.createdAt)).slice(0, 6).map((x) => rowOf(db, x, me));
    return {
      totals: { agreements: list.filter((a) => a.status !== "draft").length, active: openList.length, pendingApprovals: asC.flatMap((a) => a.milestones).filter((x) => x.status === "submitted").length },
      client: { fundsInEscrow: dec(asC.reduce((s, a) => s + num(a.locked), 0)), awaitingApproval: dec(sumMs(asC, "submitted")), released: dec(asC.reduce((s, a) => s + num(a.released), 0)), totalFunded: dec(asC.filter((a) => a.fundedAt).reduce((s, a) => s + num(a.total), 0)) },
      contributor: { paid: dec(sumMs(asK, "paid")), awaitingApproval: dec(sumMs(asK, "submitted")), approvedNotPaid: dec(sumMs(asK, "approved")), stillToEarn: dec(asK.filter(live).reduce((s, a) => s + num(a.locked), 0)) },
      activeAgreements: openList.map(summary), waitingOnYou: waiting, recentActivity: recent,
    };
  }
  if (method === "GET" && path === "/wallet") {
    const list = mine(db, me).map((a) => derive(a, me)); const b = db.balances[me];
    const active = !!b && b.xlm > 0;
    return { address: me, network: "testnet", balancesAvailable: true, accountExists: active, hasTrustline: active && b!.trust, xlmBalance: active ? b!.xlm.toFixed(7) : null, assetBalance: active && b!.trust ? b!.usdc.toFixed(7) : null, asset: USDC,
      agreementsCount: list.length, lockedAsClient: dec(list.filter((a) => a.role === "client").reduce((s, a) => s + num(a.locked), 0)), waitingForYou: dec(list.filter((a) => a.role === "contributor").reduce((s, a) => s + num(a.locked), 0)) };
  }
  if (method === "GET" && (path === "/transactions" || path === "/transactions/export")) {
    const refs = new Set(mine(db, me).map((a) => a.reference));
    const t = String(q.type ?? "all"), s = String(q.search ?? "").toLowerCase();
    let list = db.activity.filter((x) => refs.has(x.ref) && x.txHash).map((x) => rowOf(db, x, me));
    if (t !== "all") list = list.filter((x) => x.type === t);
    if (s) list = list.filter((x) => x.agreementName.toLowerCase().includes(s) || x.reference.toLowerCase().includes(s) || (x.txHash ?? "").includes(s));
    list.sort((x, y) => y.createdAt.localeCompare(x.createdAt));
    if (path.endsWith("/export")) {
      const rows = [["date", "reference", "agreement", "kind", "type", "milestone", "amount", "asset", "direction", "hash"], ...list.map((x) => [x.createdAt, x.reference, x.agreementName, x.kind, x.type, x.milestoneTitle ?? "", x.amount ?? "", x.asset.split(":")[0], x.direction ?? "", x.txHash])];
      return new Blob([rows.map((row) => row.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n")], { type: "text/csv" });
    }
    return paginate(list, q);
  }
  if (method === "GET" && path === "/notifications") {
    const list = db.notes.filter((n) => n.to === me).map(({ to: _t, ...n }) => (void _t, n));
    return { unread: list.filter((n) => !n.read).length, ...paginate(list, q) };
  }
  if (method === "POST" && path === "/notifications/read-all") { db.notes.forEach((n) => { if (n.to === me) n.read = true; }); return NO_CONTENT; }
  if (method === "POST" && (r = m(/^\/notifications\/([\w-]+)\/read$/))) {
    const n = db.notes.find((x) => x.id === r![1] && x.to === me) ?? fail(404, "NOTIFICATION_NOT_FOUND", "We could not find that notification.");
    n!.read = true; return NO_CONTENT;
  }
  return fail(404, "ROUTE_NOT_FOUND", `Cannot ${method} ${path}`);
}

/* ---------- admin ---------- */
function admin(req: TransportRequest, db: MockDB, me: string): unknown {
  const { method, path } = req;
  const q = (req.query ?? {}) as Record<string, unknown>;
  const m = (re: RegExp) => path.match(re);
  let r: RegExpMatchArray | null;
  if (me !== OPERATOR) fail(403, "NOT_ADMIN", "This wallet does not have admin access.");
  const all = db.agreements.map((a) => derive(a, a.client.address));
  const name = (ref: string) => db.agreements.find((a) => a.reference === ref)?.name ?? ref;
  /** Pending for over 5 minutes */
  const stuck = (x: ActionRec) => x.status === "pending" && Date.now() - new Date(x.submittedAt ?? x.createdAt).getTime() > 5 * MIN;
  const txRow = (x: ActionRec) => {
    const { transaction: _t, ...c } = chain(db, x); void _t;
    return { ...c, reference: x.ref, agreementName: name(x.ref), milestonePosition: x.position ?? null, wallet: x.by, stuck: stuck(x), createdAt: x.createdAt, submittedAt: x.submittedAt ?? null };
  };
  const system = () => ({
    database: { status: "ok" }, redis: { status: "ok" }, horizon: { status: "ok", url: "https://horizon-testnet.stellar.org" },
    arbiter: { address: ARBITER, status: "ok", xlmBalance: "9812.44", hasTrustline: true },
    indexer: { status: "ok", lastRunAt: db.indexer.lastRunAt, lastLedger: db.indexer.lastLedger },
  });

  if (method === "GET" && path === "/admin/me") return { address: me, shortAddress: short(me) };
  if (method === "GET" && path === "/admin/overview") {
    const by = (s: string) => all.filter((a) => a.status === s).length;
    return {
      agreements: { total: all.length, draft: by("draft"), created: by("created"), funded: by("funded"), inProgress: by("in_progress"), completed: by("completed"), cancelled: by("cancelled"), declined: by("declined"), recovered: by("recovered") },
      funds: { asset: USDC, locked: dec(all.reduce((s, a) => s + num(a.locked), 0)), released: dec(all.reduce((s, a) => s + num(a.released), 0)), refunded: dec(all.reduce((s, a) => s + num(a.refunded), 0)) },
      transactions: { confirmed: db.actions.filter((x) => x.status === "confirmed").length, pending: db.actions.filter((x) => x.status === "pending").length, failed: db.actions.filter((x) => x.status === "failed").length, stuck: db.actions.filter(stuck).length },
      wallets: new Set(all.filter((a) => a.status !== "draft").flatMap((a) => [a.client.address, a.contributor?.address]).filter(Boolean)).size,
    };
  }
  if (method === "GET" && path === "/admin/system") return system();
  if (method === "POST" && path === "/admin/indexer/run") { db.indexer = { lastRunAt: now(), lastLedger: db.indexer.lastLedger + 1 + Math.floor(Math.random() * 12) }; return system(); }
  if (method === "GET" && path === "/admin/agreements") {
    const st = q.status ? String(q.status) : "", s = String(q.search ?? "").toLowerCase();
    return paginate(all.filter((a) => !st || a.status === st).filter((a) => !s || a.name.toLowerCase().includes(s) || a.reference.toLowerCase().includes(s) || a.client.address.toLowerCase().includes(s) || !!a.contributor?.address.toLowerCase().includes(s)).sort((x, y) => y.createdAt.localeCompare(x.createdAt)).map(summary), q);
  }
  if (method === "GET" && (r = m(/^\/admin\/agreements\/(MV-\d+)$/i))) {
    const a = all.find((x) => x.reference.toUpperCase() === r![1]!.toUpperCase()) ?? fail(404, "AGREEMENT_NOT_FOUND", "No agreement has this reference.");
    const stored = db.agreements.find((x) => x.reference === a!.reference)!;
    return { ...a, cancellations: stored.proposal ? [{ ...stored.proposal, status: "open" }] : [],
      transactions: db.actions.filter((x) => x.ref === a!.reference && x.status !== "prepared").map(txRow),
      activity: db.activity.filter((x) => x.ref === a!.reference).sort((x, y) => y.createdAt.localeCompare(x.createdAt)).map((x) => activityOf(db, x, "")) };
  }
  if (method === "GET" && path === "/admin/transactions") {
    const st = String(q.status ?? ""), k = String(q.kind ?? ""), s = String(q.search ?? "").toLowerCase();
    const list = db.actions.filter((x) => x.status !== "prepared" || st === "prepared").map(txRow)
      .filter((x) => (!st || x.status === st) && (!k || x.kind === k) && (!q.stuck || x.stuck) && (!s || x.reference.toLowerCase().includes(s) || x.hash.includes(s) || x.wallet.toLowerCase().includes(s)))
      .sort((x, y) => y.createdAt.localeCompare(x.createdAt));
    return paginate(list, q);
  }
  if (method === "POST" && (r = m(/^\/admin\/transactions\/([\w-]+)\/reconcile$/))) {
    const x = db.actions.find((y) => y.id === r![1]) ?? fail(404, "ACTION_NOT_FOUND", "We could not find that transaction.");
    if (x!.status !== "pending" && x!.status !== "prepared") fail(409, "ACTION_ALREADY_SETTLED", "This transaction is already settled.");
    // Re-check on Stellar: a pending tx past its time bounds never landed → expired; otherwise it settles.
    if (new Date(x!.expiresAt).getTime() < Date.now()) x!.status = "expired"; else settle(db, x!);
    return txRow(x!);
  }
  if (method === "GET" && path === "/admin/wallets") {
    const addrs = [...new Set(all.filter((a) => a.status !== "draft").flatMap((a) => [a.client.address, a.contributor?.address]).filter((x): x is string => !!x))];
    const s = String(q.search ?? "").toLowerCase();
    return paginate(addrs.filter((x) => !s || x.toLowerCase().includes(s)).map((address) => {
      const asC = all.filter((a) => a.client.address === address), asK = all.filter((a) => a.contributor?.address === address);
      return { address, shortAddress: short(address), agreements: asC.length + asK.length, asClient: asC.length, asContributor: asK.length, funded: dec(asC.filter((a) => a.fundedAt).reduce((s2, a) => s2 + num(a.total), 0)), earned: dec(asK.reduce((s2, a) => s2 + num(a.released), 0)), lastActiveAt: [...asC, ...asK].map((a) => a.createdAt).sort().pop() };
    }), q);
  }
  if (method === "GET" && (r = m(/^\/admin\/wallets\/(G[A-Z2-7]{55})$/))) {
    const address = r[1]!; const list = all.filter((a) => a.client.address === address || a.contributor?.address === address);
    const b = db.balances[address];
    return { address, shortAddress: short(address), xlmBalance: b ? b.xlm.toFixed(7) : null, assetBalance: b?.trust ? b.usdc.toFixed(7) : null, hasTrustline: !!b?.trust, agreements: list.map(summary) };
  }
  return fail(404, "ROUTE_NOT_FOUND", `Cannot ${method} ${path}`);
}

/* ---------- settlement (what Stellar + the backend do once a signed tx lands) ---------- */
function settle(db: MockDB, rec: ActionRec) {
  if (db.settings.failNext) {
    db.settings.failNext = false;
    Object.assign(rec, { status: "failed", failureCode: "TRANSACTION_FAILED", failure: "The network rejected the transaction. No funds moved." });
    return;
  }
  const a = db.agreements.find((x) => x.reference === rec.ref)!;
  const me = rec.by;
  const ml = rec.position ? a.milestones.find((x) => x.position === rec.position) : undefined;
  const total = a.milestones.reduce((s, x) => s + num(x.amount), 0);
  const unpaid = a.milestones.filter((x) => x.status !== "paid" && x.status !== "refunded");
  const bal = (addr: string | undefined, d: number) => { if (!addr) return; db.balances[addr] ??= { xlm: 10, usdc: 0, trust: true }; db.balances[addr]!.usdc = Math.round((db.balances[addr]!.usdc + d) * 100) / 100; };
  const fee = db.balances[me]; if (fee) fee.xlm = Math.round((fee.xlm - 0.00001) * 1e7) / 1e7;
  const refundUnpaid = () => {
    const amt = unpaid.reduce((s, x) => s + num(x.amount), 0);
    unpaid.forEach((x) => Object.assign(x, { status: "refunded", refundedAt: now(), refundTx: link(rec.hash), balanceId: null }));
    bal(a.client.address, amt); a.closedAt = now(); a.proposal = null;
    return amt;
  };
  const log = (kind: ActivityKind, x: Partial<ActivityRec> = {}) => act(db, a, kind, me, { txHash: rec.hash, ...x });
  switch (rec.kind) {
    case "fund":
      bal(me, -total); a.status = "funded"; a.fundedAt = now(); a.fundTx = link(rec.hash); a.recoveryAt = new Date(Date.now() + 90 * D).toISOString();
      a.milestones.forEach((x) => (x.balanceId = hex(16))); log("fund", { amount: dec(total) });
      notify(db, a.contributor?.address, `${a.name} is funded`, `${dec(total)} USDC is locked in escrow for you. Review the terms and accept.`, a, "agreement_funded"); break;
    case "approve":
      Object.assign(ml!, { status: "approved", approvedAt: now(), approveTx: link(rec.hash) }); log("approve", { milestonePosition: ml!.position });
      notify(db, a.contributor?.address, `${ml!.title} approved`, "The client releases the payment as the next step.", a, "milestone_approved"); break;
    case "release":
      Object.assign(ml!, { status: "paid", paidAt: now(), releaseTx: link(rec.hash), balanceId: null }); bal(a.contributor?.address, num(ml!.amount));
      log("release", { milestonePosition: ml!.position, amount: ml!.amount });
      if (a.milestones.every((x) => x.status === "paid")) { a.status = "completed"; a.closedAt = now(); }
      notify(db, a.contributor?.address, `You received ${ml!.amount} USDC`, `${a.name} · ${ml!.title}`, a, "milestone_paid"); break;
    case "decline": { const amt = refundUnpaid(); a.status = "declined"; log("decline", { amount: dec(amt) }); notify(db, a.client.address, `${a.name} was declined`, "The escrow was refunded to your wallet.", a, "agreement_declined"); break; }
    case "propose_cancel":
      a.proposal = { proposedBy: me, createdAt: now() }; log("propose_cancel");
      notify(db, other(a, me), `Cancellation proposed on ${a.name}`, "Confirm to refund what's still in escrow, or reject to continue.", a, "cancellation_proposed"); break;
    case "confirm_cancel": { const amt = refundUnpaid(); a.status = "cancelled"; log("confirm_cancel", { amount: dec(amt) }); notify(db, other(a, me), `${a.name} was cancelled`, "Unpaid milestones went back to the client.", a, "agreement_cancelled"); break; }
    case "recover": { const amt = refundUnpaid(); a.status = "recovered"; log("recover", { amount: dec(amt) }); notify(db, a.contributor?.address, `${a.name} was recovered`, "The client reclaimed the unpaid milestones after the recovery date.", a, "agreement_recovered"); break; }
  }
  rec.status = "confirmed"; rec.ledger = ++db.indexer.lastLedger;
}

/**
 * Mock transport plus helpers for the demo controls (reset, failNext, latency) and for the
 * demo wallet (sign; Friendbot, trustline and faucet stand-ins).
 */
export function createMockTransport() {
  const transport: Transport = async (req) => {
    await new Promise((x) => setTimeout(x, 120 + Math.random() * 180));
    const db = load();
    try {
      const data = await handle(req, db);
      save();
      if (data === NO_CONTENT) return { status: 204 };
      if (req.raw && data instanceof Blob) return { status: 200, blob: data } as TransportResponse;
      return { status: 200, json: { statusCode: 200, message: "OK", data } };
    } catch (e) {
      save();
      if (e instanceof MockHttpError) return { status: e.status, json: { statusCode: e.status, message: e.message, data: null, error: { code: e.code, fields: e.fields, details: e.details, requestId: uid(), timestamp: now(), path: `/api/v1${req.path}` } } };
      throw e;
    }
  };
  return {
    transport,
    reset: () => { cache = seed(); save(); },
    settings: () => load().settings,
    setSettings: (s: Partial<MockDB["settings"]>) => { Object.assign(load().settings, s); save(); },
    /** Sign like a wallet would (demo only) */
    sign: (xdr: string) => `SIGNED.${xdr}`,
    /** Demo stand-ins for what the frontend does on Stellar directly (Friendbot, changeTrust, Circle faucet) */
    friendbot: (address: string) => { const db = load(); const b = (db.balances[address] ??= { xlm: 0, usdc: 0, trust: false }); b.xlm += 10000; save(); },
    addTrustline: (address: string) => { const db = load(); const b = (db.balances[address] ??= { xlm: 0, usdc: 0, trust: false }); if (b.xlm <= 0) throw new Error("ACCOUNT_NOT_ACTIVE"); b.trust = true; b.xlm = Math.round((b.xlm - 0.00001) * 1e7) / 1e7; save(); },
    faucet: (address: string, amount = 1000) => { const db = load(); const b = db.balances[address]; if (!b?.trust) throw new Error("TRUSTLINE_MISSING"); b.usdc += amount; save(); },
  };
}
