/**
 * Shapes returned by the MileVault backend (https://milevault-api-production.up.railway.app/docs).
 * Fields marked "observed" were verified against live responses; others follow the OpenAPI
 * descriptions and are typed loosely where the spec does not document the payload.
 */

export type Address = string;
/** Exact decimal string, e.g. "300" or "1250.5" */
export type Decimal = string;
export type ISODate = string;

export interface Envelope<T> { statusCode: number; message: string; data: T }
export interface PaginationMeta { nextPage: boolean; previousPage: boolean; currentPage: number; totalPage: number; totalCount: number; pageCount: number }
export interface Paginated<T> { result: T[]; paginationMeta: PaginationMeta }
export interface PageParams { limit?: number; offset?: number }

export interface ApiErrorBody {
  code: string;
  fields?: { field: string; message: string }[];
  details?: unknown;
  retryAfterSeconds?: number;
  requestId?: string;
  traceId?: string;
  timestamp?: string;
  path?: string;
}

/* ---------- Stellar ---------- */
export interface Asset { id: string; code: string; issuer: string | null; native: boolean }
export interface NetworkInfo {
  network: "testnet" | "mainnet";
  networkPassphrase: string;
  horizonUrl: string;
  explorerUrl: string;
  assets: Asset[];
  platformAccount: string | null;
}
export interface AccountAsset extends Asset { trusted: boolean; balance: Decimal | null }
export interface AccountSummary { address: Address; shortAddress: string; exists: boolean; explorerUrl: string; assets: AccountAsset[] }

/* ---------- Wallet sign-in (SEP-10) ---------- */
export interface Challenge { transaction: string; networkPassphrase: string; homeDomain: string; expiresAt: ISODate }
export interface WalletSession { address: Address; shortAddress: string; networkPassphrase: string; expiresAt: ISODate }
export interface WalletToken extends WalletSession { walletToken: string; tokenType: "Bearer"; expiresIn: number }

/* ---------- Agreements (docs/FRONTEND_INTEGRATION.md §4) ---------- */
export type AgreementStatus = "draft" | "created" | "funded" | "in_progress" | "completed" | "cancelled" | "declined" | "recovered";
export type DisplayStatus = "draft" | "awaiting_funding" | "awaiting_contributor" | "funded" | "in_progress" | "completed" | "cancelled" | "declined" | "recovered";
/** "Changes requested" is not a status: the milestone goes back to `pending` with `changesNote` set. */
export type MilestoneStatus = "pending" | "submitted" | "approved" | "paid" | "refunded";
export type Role = "client" | "contributor";
export interface Party { address: Address; shortAddress: string }

export type NextActionType = "publish" | "fund" | "accept" | "submit" | "approve" | "release" | "confirm_cancel" | "recover" | "wait" | "none";
export interface NextAction { type: NextActionType; milestonePosition?: number }

export interface Cancellation { proposedBy: Address; proposedByYou: boolean; createdAt: ISODate }

/** On-chain transaction link */
export interface TxLink { hash: string; explorerUrl: string }
/** @deprecated alias kept for call sites */
export type TxRef = TxLink;

export interface AgreementSummary {
  reference: string;
  name: string;
  role: Role;
  status: AgreementStatus;
  displayStatus: DisplayStatus;
  client: Party;
  /** null on a draft without a contributor yet */
  contributor: Party | null;
  /** `CODE:ISSUER` */
  asset: string;
  total: Decimal;
  released: Decimal;
  locked: Decimal;
  refunded: Decimal;
  milestoneCount: number;
  paidCount: number;
  milestoneStatuses: MilestoneStatus[];
  recoveryAt: ISODate | null;
  recoverySoon: boolean;
  nextAction: NextAction;
  createdAt: ISODate;
}

export interface Milestone {
  id: string;
  position: number;
  title: string;
  description: string;
  amount: Decimal;
  status: MilestoneStatus;
  balanceId: string | null;
  workLink: string | null;
  workNote: string | null;
  submittedAt: ISODate | null;
  changesNote: string | null;
  changesRequestedAt: ISODate | null;
  approvedAt: ISODate | null;
  approveTx: TxLink | null;
  paidAt: ISODate | null;
  releaseTx: TxLink | null;
  refundedAt: ISODate | null;
  refundTx: TxLink | null;
}

export interface Agreement extends AgreementSummary {
  description: string;
  fundedAt: ISODate | null;
  acceptedAt: ISODate | null;
  closedAt: ISODate | null;
  fundTx: TxLink | null;
  cancellation: Cancellation | null;
  milestones: Milestone[];
}
export type AgreementDetail = Agreement;

export interface MilestoneInput { title?: string; description?: string; amount?: Decimal }
/** To clear a draft's contributor send `""` (never null). `milestones` replaces the whole list. */
export interface SaveAgreementInput { name?: string; description?: string; contributorAddress?: string; milestones?: MilestoneInput[] }
export type AgreementFilter = "all" | "client" | "contributor" | "needs" | "completed";

/* ---------- Escrow actions ---------- */
export type ActionKind = "fund" | "approve" | "release" | "decline" | "propose_cancel" | "confirm_cancel" | "recover";
export type ActionStatus = "prepared" | "pending" | "confirmed" | "failed" | "expired";
export type ActivityKind = "create" | "accept" | "submit" | "changes" | ActionKind | "cancel" | "cancel_withdrawn" | "cancel_rejected";

export interface EscrowConfig { configured: boolean; network: string; networkPassphrase: string; asset: string; arbiter: Address | null; recoveryDays: number }

/** On-chain action: prepare → wallet signs `transaction` → submit → poll while `pending` */
export interface ChainAction {
  id: string;
  kind: ActionKind;
  status: ActionStatus;
  hash: string;
  amount: Decimal | null;
  /** Unsigned XDR, present only while `prepared` */
  transaction: string | null;
  networkPassphrase: string;
  expiresAt: ISODate;
  ledger: number | null;
  explorerUrl: string | null;
  /** Ready-to-show sentence for the current status */
  statusMessage: string;
  /** Stable code when `failed` */
  failureCode: string | null;
  /** User-facing reason when `failed` */
  failure: string | null;
  failureCodes: string[] | null;
}

/** GET /agreements/{ref}/activity, newest first */
export interface AgreementActivity {
  id: string;
  kind: ActivityKind;
  actor: Address;
  byYou: boolean;
  milestonePosition?: number;
  milestoneTitle?: string;
  amount: Decimal | null;
  txHash: string | null;
  explorerUrl: string | null;
  createdAt: ISODate;
}

/** Dashboard recent activity + GET /transactions rows */
export interface ActivityRow {
  id: string;
  reference: string;
  agreementName: string;
  kind: ActivityKind;
  type: "fund" | "release" | "refund" | "other";
  actor: Address;
  byYou: boolean;
  milestonePosition: number | null;
  milestoneTitle: string | null;
  amount: Decimal | null;
  direction: "in" | "out" | null;
  asset: string;
  txHash: string | null;
  explorerUrl: string | null;
  createdAt: ISODate;
}

/* ---------- Overview ---------- */
export interface WaitingItem {
  reference: string;
  agreementName: string;
  action: Exclude<NextActionType, "wait" | "none">;
  milestonePosition: number | null;
  milestoneTitle: string | null;
  milestoneCount: number;
  amount: Decimal;
}
export interface Dashboard {
  totals: { agreements: number; active: number; pendingApprovals: number };
  client: { fundsInEscrow: Decimal; awaitingApproval: Decimal; released: Decimal; totalFunded: Decimal };
  contributor: { paid: Decimal; awaitingApproval: Decimal; approvedNotPaid: Decimal; stillToEarn: Decimal };
  activeAgreements: AgreementSummary[];
  waitingOnYou: WaitingItem[];
  recentActivity: ActivityRow[];
}
export interface WalletOverview {
  address: Address;
  network: string;
  /** false when Stellar was unreachable: show balances as unavailable */
  balancesAvailable: boolean;
  accountExists: boolean;
  hasTrustline: boolean;
  xlmBalance: Decimal | null;
  assetBalance: Decimal | null;
  asset: string;
  agreementsCount: number;
  lockedAsClient: Decimal;
  waitingForYou: Decimal;
}
export type TxType = "all" | "fund" | "release" | "refund" | "other";

/** The guide documents id/title/read/createdAt; the rest is optional if the backend sends it. */
export interface NotificationItem {
  id: string;
  title: string;
  read: boolean;
  createdAt: ISODate;
  message?: string;
  reference?: string | null;
  type?: string;
}
export interface NotificationsPage extends Paginated<NotificationItem> { unread: number }

/* ---------- Admin (guide §13 lists the routes; payload fields are rendered tolerantly) ---------- */
export interface AdminMe { address?: Address; [k: string]: unknown }
export type AdminOverview = Record<string, unknown>;
/** `arbiter.status`: ok | low_xlm | missing_trustline | missing_account | not_configured | unknown */
export type AdminSystem = Record<string, unknown>;
/** Admin view of an on-chain action. `stuck`: pending for over 5 minutes. */
export type AdminTransaction = Partial<ChainAction> & {
  id: string;
  stuck?: boolean;
  reference?: string;
  agreement?: { reference: string; name: string } | null;
  agreementName?: string;
  position?: number | null;
  milestonePosition?: number | null;
  signer?: Address;
  wallet?: Address;
  createdAt?: ISODate;
  [k: string]: unknown;
};
export type AdminAgreementDetail = Agreement & { transactions?: AdminTransaction[]; activity?: AgreementActivity[]; cancellations?: unknown[]; [k: string]: unknown };
export interface AdminWallet { address: Address; shortAddress?: string; agreements?: number; [k: string]: unknown }
