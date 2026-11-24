Read docs/FRONTEND_INTEGRATION.md completely, then connect the existing MileVault
UI to the backend API by following it exactly. Start with the API client and
wallet sign-in, test them with a real Testnet wallet, then implement the screens.
If the API behaves differently from the guide, stop and report it.

# MileVault Frontend Integration Guide

**Audience:** an AI coding agent (Claude Code) implementing the MileVault web frontend. The backend source is in another repository, so treat this file as the API contract.

**Your job:** connect the existing MileVault UI and prototype to this API. Do not change escrow rules in the frontend, and do not add mock data once a screen is connected.

## 1. Rules that must not be broken

1. **Never submit an on-chain transaction to Stellar yourself.** The wallet signs only. Send the signed XDR to `POST /actions/{id}/submit`. Fund, release, decline, and confirmed cancellation need a second server signature and will fail if submitted directly.
2. **Sign the returned XDR unchanged.** Editing the fee, memo, or time bounds changes its hash, and the API rejects it with `400`.
3. **Never ask for a secret key or seed phrase.** Wallet extensions do all signing.
4. **The backend owns state.** After every action, refetch the agreement. Never set a milestone to `paid`, `approved`, or similar optimistically.
5. **`approved` does not mean paid.** Keep Approve and Release as two separate steps in the UI.
6. **A `200` from submit is not success.** Read `data.status`. Only `confirmed` means the action happened.
7. **Amounts are decimal strings.** Do not use floats for money. Use the string for display and send strings in requests.
8. **There is no Soroban contract.** Remove contract wording and the `C…E2M` contract row from the UI (see section 12).

## 2. Environment and connection

```bash
# Frontend env. Use your framework's public-variable prefix, such as NEXT_PUBLIC_.
MILEVAULT_API_URL=http://localhost:4000/api/v1
```

- The URL includes `/api/v1` and has no trailing slash.
- Local frontends are allowed on ports 3000, 3001, and 3002.
- The backend must allow the frontend origin through its `FRONTEND_URL` or `CORS_ORIGINS` setting. A CORS error usually means that value is missing.
- Interactive docs are at `http://localhost:4000/docs` when the backend has `SWAGGER_ENABLED=true`.
- Network: **Stellar Testnet**, passphrase `Test SDF Network ; September 2015`.
- Asset: Circle test USDC, `USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`. Read it from `GET /escrow/config` instead of hardcoding it.

## 3. Response and error format

Success:

```json
{ "statusCode": 200, "message": "Agreement loaded", "data": {} }
```

Paginated `data`:

```json
{
  "result": [],
  "paginationMeta": {
    "nextPage": false,
    "previousPage": false,
    "currentPage": 1,
    "totalPage": 1,
    "totalCount": 0,
    "pageCount": 0
  }
}
```

`GET /notifications` uses the same shape and adds `unread` next to `result`.

Every error has this shape:

```json
{
  "statusCode": 400,
  "message": "Please fix the 2 highlighted fields.",
  "data": null,
  "error": {
    "code": "VALIDATION_FAILED",
    "fields": [
      {
        "field": "contributorAddress",
        "message": "Enter a valid Stellar address. It starts with G and has 56 characters."
      },
      {
        "field": "milestones.0.amount",
        "message": "Enter an amount as text with up to 2 decimal places, like \"300.00\"."
      }
    ],
    "requestId": "0197c2a4-...",
    "traceId": "...",
    "timestamp": "2026-11-23T12:00:00.000Z",
    "path": "/api/v1/agreements"
  }
}
```

How to use it:

- **`message`** is written for users. Show it directly.
- **`error.code`** is stable. Branch on it in code, never on `message`.
- **`error.fields`** lists every invalid field, when present. Show each message under its input. Paths use zero-based indexes, so `milestones.0.amount` is the first milestone.
- **`error.details`** holds extra facts for some codes, such as `shortfall`.
- **`error.retryAfterSeconds`** is present on `429`.
- **`error.requestId`** should be included in support logs. `204` responses have no body.

### Error codes

| Status | Code | What the UI should do |
| --- | --- | --- |
| 400 | `VALIDATION_FAILED` | Show `error.fields` under the inputs |
| 400 | `INVALID_JSON` | Frontend bug: log it |
| 400 | `INVALID_ADDRESS` | Show under the address input |
| 400 | `CONTRIBUTOR_IS_CLIENT` | Show under the contributor address |
| 400 | `AGREEMENT_TOTAL_TOO_LARGE` | Show on the milestone total |
| 400 | `INVALID_TRANSACTION`, `TRANSACTION_MISMATCH`, `SIGNATURE_MISSING` | Say the wallet did not sign the original transaction, then start again |
| 401 | `WALLET_NOT_CONNECTED`, `SESSION_EXPIRED` | Clear the token and show connect wallet |
| 401 | `CHALLENGE_EXPIRED`, `CHALLENGE_USED`, `CHALLENGE_NOT_SIGNED`, `CHALLENGE_WRONG_ISSUER`, `CHALLENGE_INVALID` | Show `message` and restart sign-in |
| 403 | `NOT_CLIENT`, `NOT_CONTRIBUTOR`, `NOT_PARTY`, `ACTION_WRONG_WALLET` | Show `message` and refetch |
| 403 | `CANNOT_CONFIRM_OWN_CANCELLATION`, `CANNOT_REJECT_OWN_CANCELLATION`, `NOT_CANCELLATION_PROPOSER` | Show `message` and refetch |
| 404 | `AGREEMENT_NOT_FOUND` | Show “This wallet isn't part of this agreement” |
| 404 | `MILESTONE_NOT_FOUND`, `ACTION_NOT_FOUND`, `NOTIFICATION_NOT_FOUND`, `ROUTE_NOT_FOUND` | Show not found and log it |
| 409 | `TRANSACTION_IN_PROGRESS` | Disable actions, wait a few seconds, refetch |
| 409 | `ACTION_EXPIRED` | Say it expired and offer Try again, which prepares a new transaction |
| 409 | `AGREEMENT_CHANGED`, `INVALID_AGREEMENT_STATE`, `INVALID_MILESTONE_STATE`, `MILESTONE_OUT_OF_ORDER`, `MILESTONE_ALREADY_PAID` | Show `message` and refetch |
| 409 | `ALREADY_FUNDED`, `ALREADY_ACCEPTED`, `NOT_ACCEPTED`, `AGREEMENT_ALREADY_PUBLISHED` | Show `message` and refetch |
| 409 | `MUTUAL_CANCEL_REQUIRED`, `CANCEL_NOT_NEEDED`, `CANCELLATION_ALREADY_OPEN`, `NO_OPEN_CANCELLATION` | Show `message` and refetch |
| 409 | `RECOVERY_DATE_PASSED`, `RECOVERY_NOT_REACHED`, `NOTHING_TO_RECOVER` | Show `message` and refetch |
| 413 | `PAYLOAD_TOO_LARGE` | Frontend bug: log it |
| 422 | `DRAFT_INCOMPLETE` | Show `error.fields` and return to the matching form step |
| 422 | `ACCOUNT_NOT_ACTIVE` | Show the add-XLM prompt |
| 422 | `TRUSTLINE_MISSING` | Show Enable USDC |
| 422 | `INSUFFICIENT_BALANCE` | Show `details.shortfall` and the faucet link |
| 422 | `RECIPIENT_TRUSTLINE_MISSING` | Show `message`. `details.recipient` says which party must enable USDC |
| 429 | `RATE_LIMITED` | Disable the button for `retryAfterSeconds` |
| 500 | `INTERNAL_ERROR` | Show `message` and log `requestId` |
| 503 | `STELLAR_UNAVAILABLE`, `ESCROW_UNAVAILABLE`, `WALLET_SIGN_IN_UNAVAILABLE`, `DATABASE_UNAVAILABLE` | Show a retry state |

### Failed transactions

A transaction that reaches Stellar and fails returns **`200` with `data.status: "failed"`**. No funds moved. Show `data.failure`, and branch on `data.failureCode`:

`INSUFFICIENT_BALANCE`, `INSUFFICIENT_XLM`, `ESCROW_LOW_RESERVE`, `RECIPIENT_TRUSTLINE_MISSING`, `TRUSTLINE_MISSING`, `RECIPIENT_NOT_ACTIVE`, `RECIPIENT_LIMIT_REACHED`, `ASSET_NOT_AUTHORIZED`, `FUNDS_NOT_CLAIMABLE`, `FUNDS_ALREADY_CLAIMED`, `ACCOUNT_NOT_ACTIVE`, `NETWORK_BUSY`, `WALLET_SEQUENCE_CHANGED`, `TRANSACTION_EXPIRED`, `TRANSACTION_TOO_EARLY`, `SIGNATURE_REJECTED`, `TRANSACTION_FAILED`.

Every action also returns **`statusMessage`**, a ready-to-show sentence for its current status, such as “Payment released to the contributor.”

## 4. Copy this API client

Save this as `lib/milevault-api.ts` or the equivalent. It has no dependencies.

```ts
export type AgreementStatus =
  | 'draft'
  | 'created'
  | 'funded'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'declined'
  | 'recovered';

export type DisplayStatus =
  | 'draft'
  | 'awaiting_funding'
  | 'awaiting_contributor'
  | 'funded'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'declined'
  | 'recovered';

export type MilestoneStatus =
  'pending' | 'submitted' | 'approved' | 'paid' | 'refunded';

export type ActionKind =
  | 'fund'
  | 'approve'
  | 'release'
  | 'decline'
  | 'propose_cancel'
  | 'confirm_cancel'
  | 'recover';

export type ActionStatus =
  'prepared' | 'pending' | 'confirmed' | 'failed' | 'expired';

export type NextActionType =
  | 'publish'
  | 'fund'
  | 'accept'
  | 'submit'
  | 'approve'
  | 'release'
  | 'confirm_cancel'
  | 'recover'
  | 'wait'
  | 'none';

export type ActivityKind =
  | 'create'
  | 'accept'
  | 'submit'
  | 'changes'
  | ActionKind
  | 'cancel'
  | 'cancel_withdrawn'
  | 'cancel_rejected';

export interface Party {
  address: string;
  shortAddress: string;
}

export interface TxLink {
  hash: string;
  explorerUrl: string;
}

export interface NextAction {
  type: NextActionType;
  milestonePosition?: number;
}

export interface AgreementSummary {
  reference: string;
  name: string;
  role: 'client' | 'contributor';
  status: AgreementStatus;
  displayStatus: DisplayStatus;
  client: Party;
  contributor: Party | null;
  asset: string;
  total: string;
  released: string;
  locked: string;
  refunded: string;
  milestoneCount: number;
  paidCount: number;
  milestoneStatuses: MilestoneStatus[];
  recoveryAt: string | null;
  recoverySoon: boolean;
  nextAction: NextAction;
  createdAt: string;
}

export interface Milestone {
  id: string;
  position: number;
  title: string;
  description: string;
  amount: string;
  status: MilestoneStatus;
  balanceId: string | null;
  workLink: string | null;
  workNote: string | null;
  submittedAt: string | null;
  changesNote: string | null;
  changesRequestedAt: string | null;
  approvedAt: string | null;
  approveTx: TxLink | null;
  paidAt: string | null;
  releaseTx: TxLink | null;
  refundedAt: string | null;
  refundTx: TxLink | null;
}

export interface AgreementDetail extends AgreementSummary {
  description: string;
  fundedAt: string | null;
  acceptedAt: string | null;
  closedAt: string | null;
  fundTx: TxLink | null;
  cancellation: {
    proposedBy: string;
    proposedByYou: boolean;
    createdAt: string;
  } | null;
  milestones: Milestone[];
}

export interface ChainAction {
  id: string;
  kind: ActionKind;
  status: ActionStatus;
  hash: string;
  amount: string | null;
  /** Unsigned XDR. Present only while status is `prepared`. */
  transaction: string | null;
  networkPassphrase: string;
  expiresAt: string;
  ledger: number | null;
  explorerUrl: string | null;
  /** Ready-to-show sentence for the current status. */
  statusMessage: string;
  /** Stable code when status is `failed`. */
  failureCode: string | null;
  /** User-facing reason when status is `failed`. */
  failure: string | null;
  failureCodes: string[] | null;
}

export interface AgreementActivity {
  id: string;
  kind: ActivityKind;
  actor: string;
  byYou: boolean;
  milestonePosition?: number;
  milestoneTitle?: string;
  amount: string | null;
  txHash: string | null;
  explorerUrl: string | null;
  createdAt: string;
}

export interface ActivityRow {
  id: string;
  reference: string;
  agreementName: string;
  kind: ActivityKind;
  type: 'fund' | 'release' | 'refund' | 'other';
  actor: string;
  byYou: boolean;
  milestonePosition: number | null;
  milestoneTitle: string | null;
  amount: string | null;
  direction: 'in' | 'out' | null;
  asset: string;
  txHash: string | null;
  explorerUrl: string | null;
  createdAt: string;
}

export interface WaitingItem {
  reference: string;
  agreementName: string;
  action: Exclude<NextActionType, 'wait' | 'none'>;
  milestonePosition: number | null;
  milestoneTitle: string | null;
  milestoneCount: number;
  amount: string;
}

export interface Dashboard {
  totals: { agreements: number; active: number; pendingApprovals: number };
  client: {
    fundsInEscrow: string;
    awaitingApproval: string;
    released: string;
    totalFunded: string;
  };
  contributor: {
    paid: string;
    awaitingApproval: string;
    approvedNotPaid: string;
    stillToEarn: string;
  };
  activeAgreements: AgreementSummary[];
  waitingOnYou: WaitingItem[];
  recentActivity: ActivityRow[];
}

export interface WalletOverview {
  address: string;
  network: string;
  /** False when Stellar was unreachable: show balances as unavailable. */
  balancesAvailable: boolean;
  accountExists: boolean;
  hasTrustline: boolean;
  xlmBalance: string | null;
  assetBalance: string | null;
  asset: string;
  agreementsCount: number;
  lockedAsClient: string;
  waitingForYou: string;
}

export interface EscrowSettings {
  configured: boolean;
  network: string;
  networkPassphrase: string;
  asset: string;
  arbiter: string | null;
  recoveryDays: number;
}

export interface WalletSession {
  address: string;
  shortAddress: string;
  networkPassphrase: string;
  expiresAt: string;
}

export interface WalletToken extends WalletSession {
  walletToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

export interface Challenge {
  transaction: string;
  networkPassphrase: string;
  homeDomain: string;
  expiresAt: string;
}

export interface PaginationMeta {
  nextPage: boolean;
  previousPage: boolean;
  currentPage: number;
  totalPage: number;
  totalCount: number;
  pageCount: number;
}

export interface Page<T> {
  result: T[];
  paginationMeta: PaginationMeta;
}

export interface NotificationItem {
  id: string;
  title: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationsResponse extends Page<NotificationItem> {
  unread: number;
}

export interface MilestoneInput {
  title?: string;
  description?: string;
  /** Up to 2 decimal places, such as "300.00". */
  amount?: string;
}

export interface SaveAgreementInput {
  name?: string;
  description?: string;
  contributorAddress?: string;
  /** On update, this replaces the whole list. */
  milestones?: MilestoneInput[];
}

export interface ListQuery {
  limit?: number;
  offset?: number;
  filter?: 'all' | 'client' | 'contributor' | 'needs' | 'completed';
  search?: string;
}

export interface TransactionQuery {
  limit?: number;
  offset?: number;
  type?: 'all' | 'fund' | 'release' | 'refund' | 'other';
  search?: string;
}

/** Implement with your wallet library. Must sign only, never submit. */
export type SignTransaction = (
  xdr: string,
  opts: { networkPassphrase: string; address: string },
) => Promise<string>;

export interface FieldError {
  /** Request path, such as `name` or `milestones.0.amount`. */
  field: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly fields: FieldError[] = [],
    readonly details?: Record<string, unknown>,
    readonly requestId?: string,
    readonly retryAfterSeconds?: number,
  ) {
    super(message);
  }

  /** Field path to message, ready for form inputs. */
  get fieldErrors(): Record<string, string> {
    return Object.fromEntries(this.fields.map((f) => [f.field, f.message]));
  }
}

const TOKEN_KEY = 'milevault.walletToken';

export const tokenStore = {
  get: (): string | null =>
    typeof window === 'undefined' ? null : sessionStorage.getItem(TOKEN_KEY),
  set: (token: string) => sessionStorage.setItem(TOKEN_KEY, token),
  clear: () => {
    if (typeof window !== 'undefined') sessionStorage.removeItem(TOKEN_KEY);
  },
};

const qs = (params: object): string => {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== '',
  );
  return entries.length
    ? `?${new URLSearchParams(entries.map(([k, v]) => [k, String(v)]))}`
    : '';
};

export function createMilevaultApi(
  baseUrl: string,
  onUnauthorized?: () => void,
) {
  const send = async (
    method: string,
    path: string,
    body?: unknown,
  ): Promise<Response> => {
    const token = tokenStore.get();
    let res: Response;
    try {
      res = await fetch(`${baseUrl}${path}`, {
        method,
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          ...(body !== undefined && { 'Content-Type': 'application/json' }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new ApiError(
        'We could not reach MileVault. Check your connection and try again.',
        0,
        'NETWORK_ERROR',
      );
    }
    if (res.ok) return res;
    const json = (await res.json().catch(() => null)) as {
      message?: string;
      error?: {
        code?: string;
        fields?: FieldError[];
        details?: Record<string, unknown>;
        requestId?: string;
        retryAfterSeconds?: number;
      };
    } | null;
    const code = json?.error?.code ?? 'UNKNOWN_ERROR';
    if (code === 'WALLET_NOT_CONNECTED' || code === 'SESSION_EXPIRED') {
      tokenStore.clear();
      onUnauthorized?.();
    }
    throw new ApiError(
      json?.message ?? 'Something went wrong. Please try again.',
      res.status,
      code,
      json?.error?.fields,
      json?.error?.details,
      json?.error?.requestId,
      json?.error?.retryAfterSeconds,
    );
  };

  const request = async <T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> => {
    const res = await send(method, path, body);
    if (res.status === 204) return undefined as T;
    return ((await res.json()) as { data: T }).data;
  };

  const ref = encodeURIComponent;

  const api = {
    escrowConfig: () => request<EscrowSettings>('GET', '/escrow/config'),

    async signIn(address: string, sign: SignTransaction) {
      const c = await request<Challenge>('POST', '/wallet-auth/challenge', {
        address,
      });
      const transaction = await sign(c.transaction, {
        networkPassphrase: c.networkPassphrase,
        address,
      });
      const session = await request<WalletToken>(
        'POST',
        '/wallet-auth/verify',
        { transaction },
      );
      tokenStore.set(session.walletToken);
      return session;
    },
    session: () => request<WalletSession>('GET', '/wallet-auth/session'),
    async logout() {
      try {
        await request<void>('POST', '/wallet-auth/logout');
      } finally {
        tokenStore.clear();
      }
    },

    dashboard: () => request<Dashboard>('GET', '/dashboard'),
    wallet: () => request<WalletOverview>('GET', '/wallet'),
    transactions: (q: TransactionQuery = {}) =>
      request<Page<ActivityRow>>('GET', `/transactions${qs(q)}`),
    async exportTransactions(
      q: Pick<TransactionQuery, 'type' | 'search'> = {},
    ) {
      const res = await send('GET', `/transactions/export${qs(q)}`);
      return res.blob();
    },
    notifications: (q: { limit?: number; offset?: number } = {}) =>
      request<NotificationsResponse>('GET', `/notifications${qs(q)}`),
    readNotification: (id: string) =>
      request<void>('POST', `/notifications/${id}/read`),
    readAllNotifications: () =>
      request<void>('POST', '/notifications/read-all'),

    listAgreements: (q: ListQuery = {}) =>
      request<Page<AgreementSummary>>('GET', `/agreements${qs(q)}`),
    getAgreement: (r: string) =>
      request<AgreementDetail>('GET', `/agreements/${ref(r)}`),
    agreementActivity: (r: string) =>
      request<AgreementActivity[]>('GET', `/agreements/${ref(r)}/activity`),
    createDraft: (input: SaveAgreementInput) =>
      request<AgreementDetail>('POST', '/agreements', input),
    updateDraft: (r: string, input: SaveAgreementInput) =>
      request<AgreementDetail>('PATCH', `/agreements/${ref(r)}`, input),
    deleteDraft: (r: string) =>
      request<void>('DELETE', `/agreements/${ref(r)}`),
    publish: (r: string) =>
      request<AgreementDetail>('POST', `/agreements/${ref(r)}/publish`),
    accept: (r: string) =>
      request<AgreementDetail>('POST', `/agreements/${ref(r)}/accept`),
    cancelUnfunded: (r: string) =>
      request<AgreementDetail>('POST', `/agreements/${ref(r)}/cancel`),
    submitWork: (
      r: string,
      position: number,
      input: { link: string; note?: string },
    ) =>
      request<AgreementDetail>(
        'POST',
        `/agreements/${ref(r)}/milestones/${position}/submit`,
        input,
      ),
    requestChanges: (r: string, position: number, note: string) =>
      request<AgreementDetail>(
        'POST',
        `/agreements/${ref(r)}/milestones/${position}/request-changes`,
        { note },
      ),
    withdrawCancellation: (r: string) =>
      request<AgreementDetail>(
        'POST',
        `/agreements/${ref(r)}/cancellation/withdraw`,
      ),
    rejectCancellation: (r: string) =>
      request<AgreementDetail>(
        'POST',
        `/agreements/${ref(r)}/cancellation/reject`,
      ),

    prepareAction: (r: string, kind: ActionKind, position?: number) =>
      request<ChainAction>('POST', `/agreements/${ref(r)}/actions`, {
        kind,
        ...(position !== undefined && { position }),
      }),
    submitAction: (id: string, signedTransaction: string) =>
      request<ChainAction>('POST', `/actions/${id}/submit`, {
        signedTransaction,
      }),
    getAction: (id: string) => request<ChainAction>('GET', `/actions/${id}`),

    /** Polls until the action leaves `pending`, or returns it still pending. */
    async waitForAction(action: ChainAction, intervalMs = 3000) {
      const deadline = new Date(action.expiresAt).getTime() + 60_000;
      let current = action;
      while (current.status === 'pending' && Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, intervalMs));
        current = await api.getAction(current.id);
      }
      return current;
    },

    /**
     * Prepare, sign, submit, and wait. Use `onStage` to drive the review,
     * wallet, and network states. A wallet rejection throws before anything moves.
     */
    async runAction(input: {
      reference: string;
      kind: ActionKind;
      position?: number;
      address: string;
      sign: SignTransaction;
      onStage?: (stage: 'signing' | 'submitting') => void;
    }): Promise<ChainAction> {
      const prepared = await api.prepareAction(
        input.reference,
        input.kind,
        input.position,
      );
      if (!prepared.transaction)
        throw new Error('The API did not return a transaction to sign');
      input.onStage?.('signing');
      const signed = await input.sign(prepared.transaction, {
        networkPassphrase: prepared.networkPassphrase,
        address: input.address,
      });
      input.onStage?.('submitting');
      return api.waitForAction(await api.submitAction(prepared.id, signed));
    },
  };
  return api;
}

export type AvailableAction =
  | 'publish'
  | 'edit_draft'
  | 'delete_draft'
  | 'cancel_unfunded'
  | 'fund'
  | 'accept'
  | 'decline'
  | 'submit'
  | 'request_changes'
  | 'approve'
  | 'release'
  | 'propose_cancel'
  | 'withdraw_cancel'
  | 'confirm_cancel'
  | 'reject_cancel'
  | 'recover';

/** Every button this wallet may see on an agreement. The API still enforces each rule. */
export function availableActions(
  a: AgreementDetail,
  now = new Date(),
): { action: AvailableAction; position?: number }[] {
  const isClient = a.role === 'client';
  const live = a.status === 'funded' || a.status === 'in_progress';
  const pastRecovery = !!a.recoveryAt && now >= new Date(a.recoveryAt);
  const out: { action: AvailableAction; position?: number }[] = [];

  if (a.status === 'draft')
    out.push(
      { action: 'edit_draft' },
      { action: 'publish' },
      { action: 'delete_draft' },
    );
  if (a.status === 'created' && isClient)
    out.push({ action: 'fund' }, { action: 'cancel_unfunded' });
  if (live && pastRecovery) {
    if (isClient) out.push({ action: 'recover' });
  }
  if (live && !pastRecovery) {
    if (a.status === 'funded' && !isClient)
      out.push({ action: 'accept' }, { action: 'decline' });
    if (a.status === 'in_progress') {
      const m = a.milestones.find((x) => x.status !== 'paid');
      if (m?.status === 'pending' && !isClient)
        out.push({ action: 'submit', position: m.position });
      if (m?.status === 'submitted' && isClient)
        out.push(
          { action: 'approve', position: m.position },
          { action: 'request_changes', position: m.position },
        );
      if (m?.status === 'approved' && isClient)
        out.push({ action: 'release', position: m.position });
    }
    if (!a.cancellation) out.push({ action: 'propose_cancel' });
    else if (a.cancellation.proposedByYou)
      out.push({ action: 'withdraw_cancel' });
    else out.push({ action: 'confirm_cancel' }, { action: 'reject_cancel' });
  }
  return out;
}
```

## 5. Wallet connection

The design lists Freighter (recommended), xBull, Albedo, LOBSTR, and Hana. Use [`@creit.tech/stellar-wallets-kit`](https://www.npmjs.com/package/@creit.tech/stellar-wallets-kit) to support them through one interface. Read the docs of the **installed** version, because its API changes between major versions, then adapt it to `SignTransaction`.

Freighter-only example, for `@stellar/freighter-api` v6. Confirm the signature against the installed package:

```ts
import { signTransaction } from '@stellar/freighter-api';
import type { SignTransaction } from './milevault-api';

export const signWithFreighter: SignTransaction = async (
  xdr,
  { networkPassphrase, address },
) => {
  const res = await signTransaction(xdr, { networkPassphrase, address });
  if (res.error) throw new Error('WALLET_REJECTED');
  return res.signedTxXdr;
};
```

**Connect flow:**

1. Get the wallet's public address and network.
2. Compare the passphrase with `GET /escrow/config`. On a mismatch, show “Switch your wallet to Stellar Testnet” and do not request a signature.
3. Call `api.signIn(address, sign)`. The wallet signs a login challenge that cannot move funds.
4. Route to `/dashboard`, or to the agreement when arriving from a share link.

**Session rules:**

- A token lasts up to 12 hours. On reload, call `session()` and treat `401` as disconnected.
- If the wallet's active account changes, call `logout()` and sign in with the new account. Compare `session.address` with the wallet before every signature.
- Disconnect calls `logout()`. The user's agreements and escrow do not change.

## 6. Wallet readiness

Check `GET /wallet` before funding and on the Wallets screen.

| Condition                                  | What to show                                                          |
| ------------------------------------------ | --------------------------------------------------------------------- |
| `accountExists: false`                     | Fund with test XLM at `https://friendbot.stellar.org/?addr={address}` |
| `hasTrustline: false`                      | “Enable USDC” button, using the code below                            |
| Client's `assetBalance` is below the total | Link to `https://faucet.circle.com` and select Stellar Testnet        |
| `xlmBalance` is low                        | Prompt for test XLM. Every signer pays its own network fee            |

**The backend has no trustline endpoint.** Adding a trustline is the one transaction the frontend builds and submits itself:

```ts
import {
  Asset,
  BASE_FEE,
  Horizon,
  Operation,
  TransactionBuilder,
} from '@stellar/stellar-sdk';
import type { EscrowSettings, SignTransaction } from './milevault-api';

const HORIZON_URL = 'https://horizon-testnet.stellar.org';

export async function addTrustline(
  address: string,
  config: EscrowSettings,
  sign: SignTransaction,
) {
  const server = new Horizon.Server(HORIZON_URL);
  const [code, issuer] = config.asset.split(':');
  const tx = new TransactionBuilder(await server.loadAccount(address), {
    fee: BASE_FEE,
    networkPassphrase: config.networkPassphrase,
  })
    .addOperation(Operation.changeTrust({ asset: new Asset(code, issuer) }))
    .setTimeout(120)
    .build();
  const signed = await sign(tx.toXDR(), {
    networkPassphrase: config.networkPassphrase,
    address,
  });
  await server.submitTransaction(
    TransactionBuilder.fromXDR(signed, config.networkPassphrase),
  );
}
```

## 7. Agreement lifecycle

```text
draft ──publish──> created ──fund──> funded ──accept──> in_progress ──all paid──> completed
                      │                 │                   │
                 cancel│          decline│    mutual cancel  │
                      v                 v                   v
                  cancelled          declined            cancelled

After the recovery date, a funded or in_progress agreement can become recovered.
```

Milestones are paid strictly in order:

```text
pending ──submit──> submitted ──approve──> approved ──release──> paid
   ^                    │
   └──request changes───┘

Any unpaid milestone becomes refunded on decline, mutual cancel, or recovery.
```

Use `displayStatus` for agreement badges:

| `displayStatus`        | Label                |
| ---------------------- | -------------------- |
| `draft`                | Draft                |
| `awaiting_funding`     | Awaiting funding     |
| `awaiting_contributor` | Awaiting contributor |
| `funded`               | Funded               |
| `in_progress`          | In progress          |
| `completed`            | Completed            |
| `cancelled`            | Cancelled            |
| `declined`             | Declined             |
| `recovered`            | Recovered            |

Milestone labels are Pending, Submitted, Approved, Paid, and Refunded. The prototype has no Refunded or Recovered badge, so add both.

Use `availableActions(agreement)` to render buttons. Use `nextAction` for the single primary prompt on cards and the “Milestones waiting on you” list. `nextAction` alone is not enough because it does not include secondary actions such as Decline or Request changes.

## 8. Action reference

### API actions, with no wallet popup

| UI action             | Who         | Client method                |
| --------------------- | ----------- | ---------------------------- |
| Save or edit draft    | Client      | `createDraft`, `updateDraft` |
| Create agreement      | Client      | `publish`                    |
| Cancel unfunded       | Client      | `cancelUnfunded`             |
| Accept                | Contributor | `accept`                     |
| Submit milestone      | Contributor | `submitWork`                 |
| Request changes       | Client      | `requestChanges`             |
| Withdraw cancellation | Proposer    | `withdrawCancellation`       |
| Reject cancellation   | Other party | `rejectCancellation`         |

### On-chain actions, with a wallet signature

Use `api.runAction({ reference, kind, position, address, sign, onStage })`.

| `kind`           | Who             | When                          | `position` | Effect                               |
| ---------------- | --------------- | ----------------------------- | ---------- | ------------------------------------ |
| `fund`           | Client          | `created`                     | No         | Locks the full total                 |
| `approve`        | Client          | Current milestone `submitted` | Yes        | Records approval, moves no funds     |
| `release`        | Client          | Current milestone `approved`  | Yes        | Pays the contributor                 |
| `decline`        | Contributor     | `funded`, before accepting    | No         | Refunds the client                   |
| `propose_cancel` | Either party    | Live, no open proposal        | No         | Records the proposal, moves no funds |
| `confirm_cancel` | The other party | Open proposal                 | No         | Refunds all unpaid milestones        |
| `recover`        | Client          | At or after `recoveryAt`      | No         | Client reclaims unpaid milestones    |

### Transaction modal states

```ts
import { ApiError, type ChainAction } from './milevault-api';

// Map these to the prototype's review, wallet, pending, done, and error dialogs.
export function outcomeOf(action: ChainAction) {
  switch (action.status) {
    case 'confirmed':
      return { state: 'done', explorerUrl: action.explorerUrl } as const;
    case 'failed':
      return { state: 'error', message: action.failure } as const;
    case 'expired':
      return {
        state: 'error',
        message: 'The transaction expired. Try again.',
      } as const;
    default:
      return {
        state: 'pending',
        message: 'Still confirming. You can safely close this.',
      } as const;
  }
}

export const isWalletRejection = (err: unknown) =>
  err instanceof Error &&
  !(err instanceof ApiError) &&
  err.message === 'WALLET_REJECTED';
```

- **Wallet rejection:** show the prototype's “You declined in Freighter” state. Nothing changed.
- **`pending` after polling:** do not offer a retry. Show the state and refetch later, because the transaction may still land and the server blocks a second one while it is in flight.
- **`failed` or `expired`:** nothing moved. Show `statusMessage` and offer Try again, which prepares a new transaction.
- **Only retry with a new `prepareAction`.** Each preparation replaces the previous unsigned one, and so does any off-chain change to the agreement. Submitting a replaced or expired action returns `409 ACTION_EXPIRED`.
- After every outcome, refetch the agreement and dashboard.

## 9. Endpoint list

All paths are relative to `/api/v1`. A wallet token is required unless marked public.

| Method | Path                                                            | Notes                                             |
| ------ | --------------------------------------------------------------- | ------------------------------------------------- |
| GET    | `/escrow/config`                                                | Public                                            |
| GET    | `/stellar/network`                                              | Public                                            |
| GET    | `/stellar/accounts/{address}`                                   | Public, useful for checking a contributor address |
| POST   | `/wallet-auth/challenge`                                        | Public, body `{ address }`                        |
| POST   | `/wallet-auth/verify`                                           | Public, body `{ transaction }`                    |
| GET    | `/wallet-auth/session`                                          | Current session                                   |
| POST   | `/wallet-auth/logout`                                           | `204`                                             |
| GET    | `/dashboard`                                                    | Dashboard data                                    |
| GET    | `/wallet`                                                       | Balances and escrow totals                        |
| GET    | `/transactions`                                                 | `type`, `search`, `limit`, `offset`               |
| GET    | `/transactions/export`                                          | CSV, with `type` and `search`                     |
| GET    | `/notifications`                                                | `limit`, `offset`                                 |
| POST   | `/notifications/read-all`                                       | `204`                                             |
| POST   | `/notifications/{id}/read`                                      | `204`                                             |
| GET    | `/agreements`                                                   | `filter`, `search`, `limit`, `offset`             |
| POST   | `/agreements`                                                   | Create draft                                      |
| GET    | `/agreements/{reference}`                                       | Detail                                            |
| PATCH  | `/agreements/{reference}`                                       | Draft only                                        |
| DELETE | `/agreements/{reference}`                                       | Draft only, `204`                                 |
| GET    | `/agreements/{reference}/activity`                              | Newest first                                      |
| POST   | `/agreements/{reference}/publish`                               | Fixes the terms                                   |
| POST   | `/agreements/{reference}/accept`                                | Contributor                                       |
| POST   | `/agreements/{reference}/cancel`                                | Client, unfunded only                             |
| POST   | `/agreements/{reference}/milestones/{position}/submit`          | `{ link, note? }`                                 |
| POST   | `/agreements/{reference}/milestones/{position}/request-changes` | `{ note }`                                        |
| POST   | `/agreements/{reference}/cancellation/withdraw`                 | Proposer                                          |
| POST   | `/agreements/{reference}/cancellation/reject`                   | Other party                                       |
| POST   | `/agreements/{reference}/actions`                               | `{ kind, position? }`                             |
| POST   | `/actions/{id}/submit`                                          | `{ signedTransaction }`                           |
| GET    | `/actions/{id}`                                                 | Refreshes from the chain while open               |

`reference` looks like `MV-1001`. Pagination defaults to `limit=20`, with a maximum of 100.

**Rate limits:** 60 requests burst, then 1 per second overall. Sign-in is 10 burst, then 1 every 6 seconds. Prepare and submit are 20 burst, then 1 every 3 seconds.

## 10. Screen mapping

| Screen                      | Data                                                | Actions                                                                                 |
| --------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Landing                     | None, or `/escrow/config`                           | Connect wallet                                                                          |
| Share link `/a/{reference}` | **Show no agreement data before sign-in**           | Connect, then `getAgreement`. On `404`, show “This wallet isn't part of this agreement” |
| Dashboard                   | `dashboard()`                                       | Route each `waitingOnYou` item by `action`                                              |
| Agreements                  | `listAgreements({ filter, search, limit, offset })` | Filter chips All, As client, As contributor, Needs you, Completed                       |
| New agreement               | Local form, `createDraft`, `updateDraft`            | Preview, then `publish`                                                                 |
| Agreement created           | Publish response                                    | Fund, copy link                                                                         |
| Agreement detail            | `getAgreement`, `agreementActivity`                 | `availableActions`                                                                      |
| Transactions                | `transactions({ type, search })`                    | Explorer links, CSV                                                                     |
| Wallets                     | `wallet()`                                          | Faucet, trustline, switch, disconnect                                                   |
| Notifications               | `notifications()`                                   | Mark read                                                                               |

**Dashboard role fields:**

- Client: `client.fundsInEscrow`, `awaitingApproval`, `released`, `totalFunded`. Label `totalFunded` as “Total spent” only if the product accepts that refunded funds remain included.
- Contributor: `contributor.paid`, `awaitingApproval`, `approvedNotPaid`, `stillToEarn`.
- A wallet can be both client and contributor. Show the role per agreement using `role`.

**Share link format:** build it in the frontend as `{frontendOrigin}/a/{reference}`.

**Names and avatars:** the backend has no profiles. Show `shortAddress` everywhere the prototype shows a person's name, and generate avatars from the address.

**Refreshing:** there is no WebSocket. Refetch on window focus and after each action. Poll an open agreement every 15 to 30 seconds. Poll notifications every 30 to 60 seconds.

**CSV:** the filename header is not exposed across origins, so name the download `milevault-transactions.csv` in the frontend.

## 11. Client-side validation

Validate before calling the API for instant feedback. The API enforces the same rules and returns `error.fields`, so also map server errors to inputs with `err.fieldErrors`. To clear a draft's contributor address, send `""`. Do not send `null`, which is rejected.

| Field                 | Rule                                                                |
| --------------------- | ------------------------------------------------------------------- |
| Project name          | Required to publish, up to 60 characters                            |
| Description           | Optional, up to 500                                                 |
| Contributor address   | Required to publish, valid `G...` address, not the connected wallet |
| Milestones            | 1 to 10                                                             |
| Milestone title       | Required to publish, up to 60                                       |
| Milestone description | Optional, up to 500                                                 |
| Milestone amount      | Text, above 0, up to 2 decimal places, at most 900,000,000,000 per milestone and in total |
| Work link             | Required, full `http://` or `https://` URL, up to 500               |
| Work note             | Optional, up to 300                                                 |
| Request-changes note  | Required, up to 300                                                 |

Use `StrKey.isValidEd25519PublicKey` from `@stellar/stellar-sdk` for addresses. The prototype's looser regex is not sufficient. Require a protocol on work links, because the prototype accepts links without one and the API does not.

**Amount display:** the API returns the shortest exact form, so `1500` can mean 1,500.00. Format it for display without passing it through arithmetic.

```ts
export function formatAmount(value: string, code = 'USDC') {
  const [whole, fraction = ''] = value.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${grouped}.${fraction.padEnd(2, '0')} ${code}`;
}
```

Compute displayed form totals by converting to integer cents with `BigInt`, not by adding floats. The API's `total` is authoritative after saving.

## 12. Differences from the prototype

The prototype simulates a Soroban contract. The real product differs in these ways:

| Prototype                                          | Implement instead                                                                                    |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Wallet popup on create, accept, submit             | Plain API call, no popup and no transaction hash                                                     |
| Create shows a transaction hash                    | Show the reference, such as `MV-1001`                                                                |
| Row “Escrow contract C…E2M”                        | Show the reference and a funding transaction link from `fundTx`                                      |
| Wallet popup shows `create_agreement`, etc.        | Remove. Show the real action in your review dialog                                                   |
| “To: Escrow contract” on funding                   | “Locked in Stellar escrow”                                                                           |
| Cancel only when unfunded                          | Add propose, confirm, reject, and withdraw for funded agreements                                     |
| No way to reject work                              | Add Request changes with a required note, and show `changesNote` to the contributor                  |
| Share page shows name and amount before connecting | Generic “Connect your wallet to view this agreement”                                                 |
| Names and photos                                   | Short addresses and generated avatars                                                                |
| No recovery                                        | Show `recoveryAt`, a warning when `recoverySoon` is true, and a client Recover action after the date |

**Required copy changes:** the backend holds a co-signing key, so these claims would be false.

| Remove                                                                                | Replace with                                                                          |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| “Lock test USDC in a Soroban escrow”                                                  | “Lock test USDC in escrow on Stellar”                                                 |
| “MileVault is a window onto a Soroban contract. It can't move money for you.”         | “Funds are locked on Stellar, and every payout starts with your wallet's signature.”  |
| “Funds are held by a Soroban contract”                                                | “Funds are locked in Stellar claimable balances”                                      |
| “The contract holds the USDC and only pays out when the client releases a milestone.” | “Each milestone is locked separately and paid when the client releases it.”           |
| “Every action is signed in your own wallet. We can't move funds for you.”             | “Every on-chain action is signed in your own wallet. MileVault never sees your keys.” |
| “Nobody can move it alone.”                                                           | Remove                                                                                |
| Footer “Soroban contract”                                                             | Remove                                                                                |

Keep “MileVault never holds your keys”, which remains true of user keys.

**Recovery warning copy for contributors:** “After {date}, the client can reclaim any milestone that hasn't been paid.”

## 13. Admin API

The admin site signs in with the same wallet flow. The wallet must be listed in the backend's `ADMIN_WALLETS`. Call `GET /admin/me` after sign-in: `200` means admin, and `403 NOT_ADMIN` means show “This wallet does not have admin access.”

**No admin route can sign, approve, release, refund, or edit an agreement. Do not build controls for those actions.**

| Method | Path | Purpose | Query |
| --- | --- | --- | --- |
| GET | `/admin/me` | Confirm admin access | |
| GET | `/admin/overview` | Agreement, fund, transaction, and wallet totals | |
| GET | `/admin/system` | Database, Redis, Horizon, arbiter, indexer | |
| GET | `/admin/agreements` | Search all agreements | `status`, `search`, `limit`, `offset` |
| GET | `/admin/agreements/{reference}` | Full record with milestones, cancellations, transactions, activity | |
| GET | `/admin/transactions` | Search all on-chain actions | `status`, `kind`, `stuck=true`, `search`, `limit`, `offset` |
| POST | `/admin/transactions/{id}/reconcile` | Re-check an open transaction on Stellar | |
| POST | `/admin/indexer/run` | Run one sync, returns system status | |
| GET | `/admin/wallets` | Wallets in published agreements | `search`, `limit`, `offset` |
| GET | `/admin/wallets/{address}` | One wallet and its agreements | |

Lists use the standard paginated shape. Show `system.arbiter.status` as a health badge: `ok`, `low_xlm`, `missing_trustline`, `missing_account`, `not_configured`, or `unknown`. A transaction with `stuck: true` has been pending for over 5 minutes, so offer Re-check. Reconciling a settled transaction returns `409 ACTION_ALREADY_SETTLED`.

## 14. Acceptance checklist

The API journey passed on Testnet using SDK-signed transactions. **Real browser wallets have not been tested yet**, so test these with a real wallet first and report any failure instead of working around it:

- [ ] Sign in with Freighter on Testnet
- [ ] Wrong-network state appears before any signature
- [ ] Add a USDC trustline
- [ ] Fund a three-milestone agreement. This transaction has operations from two accounts, so confirm the wallet signs it unchanged
- [ ] Contributor opens the share link in a second wallet and accepts
- [ ] Submit, request changes, resubmit
- [ ] Approve, then release, and confirm the balance on the explorer
- [ ] Reject a wallet prompt and confirm nothing changes
- [ ] Decline a funded agreement before accepting
- [ ] Propose, reject, propose again, and confirm a mutual cancellation
- [ ] A third wallet opening a share link sees the not-a-party state
- [ ] Expired session returns to connect wallet
- [ ] Mobile and desktop show loading, empty, success, error, and disconnected states
- [ ] No Soroban or “can't move funds” wording remains

If the API behaves differently from this guide, stop and report the request, response, and `error.requestId` to the backend developer. Do not change the frontend to depend on undocumented behavior.
