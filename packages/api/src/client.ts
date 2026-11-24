import type {
  AccountSummary, ActionKind, ActivityRow, AgreementActivity, ChainAction, AdminMe, AdminOverview, AdminSystem, AdminWallet, Agreement,
  AdminAgreementDetail, AdminTransaction, AgreementFilter, AgreementStatus, AgreementSummary, ApiErrorBody, Challenge, Dashboard, Envelope, EscrowConfig,
  NetworkInfo, NotificationsPage, PageParams, Paginated, SaveAgreementInput, TxType,
  WalletOverview, WalletSession, WalletToken, ActionStatus,
} from "./types";

/** Error with the backend's stable `error.code`, per-field messages and rate-limit info */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code: string,
    public fields: { field: string; message: string }[] = [],
    public retryAfterSeconds?: number,
    public requestId?: string,
    /** Extra facts for some codes, e.g. `shortfall` on INSUFFICIENT_BALANCE, `recipient` on RECIPIENT_TRUSTLINE_MISSING */
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiError";
  }
  /** Field path → message, ready for form inputs (`milestones.0.amount`) */
  get fieldErrors(): Record<string, string> { return Object.fromEntries(this.fields.map((f) => [f.field, f.message])); }
  fieldMessage(field: string) { return this.fields.find((f) => f.field === field || f.field.endsWith(`.${field}`))?.message; }
}

export interface TransportRequest { method: "GET" | "POST" | "PATCH" | "DELETE"; path: string; query?: Record<string, string | number | boolean | undefined>; body?: unknown; token?: string | null; raw?: boolean }
export interface TransportResponse { status: number; json?: unknown; blob?: Blob; headers?: Record<string, string> }
export type Transport = (req: TransportRequest) => Promise<TransportResponse>;

/**
 * Real network transport. `baseUrl` may be the backend origin or already end in `/api/v1`
 * (the integration guide's form); both resolve to `${origin}/api/v1/...`.
 */
export function httpTransport(baseUrl: string): Transport {
  const root = baseUrl.replace(/\/+$/, "").replace(/\/api\/v1$/, "");
  return async ({ method, path, query, body, token, raw }) => {
    const url = new URL(`${root}${path.startsWith("/health") ? "" : "/api/v1"}${path}`);
    for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
    const res = await fetch(url, {
      method,
      headers: { ...(body !== undefined ? { "content-type": "application/json" } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const headers = { "retry-after": res.headers.get("retry-after") ?? "", "content-disposition": res.headers.get("content-disposition") ?? "" };
    if (raw && res.ok) return { status: res.status, blob: await res.blob(), headers };
    const text = await res.text();
    let json: unknown;
    try { json = text ? JSON.parse(text) : undefined; } catch { json = undefined; }
    return { status: res.status, json, headers };
  };
}

export interface ClientOptions { transport: Transport; getToken: () => string | null; onUnauthorized?: () => void }

export function createApi({ transport, getToken, onUnauthorized }: ClientOptions) {
  async function call<T>(req: Omit<TransportRequest, "token">, auth = true): Promise<T> {
    let res: TransportResponse;
    try { res = await transport({ ...req, token: auth ? getToken() : null }); }
    catch (e) {
      // Usually CORS (the API doesn't allow this site's origin) or a missing/wrong NEXT_PUBLIC_API_URL
      console.error(`[MileVault] request to ${req.path} failed before reaching the API (from ${typeof location !== "undefined" ? location.origin : "?"}):`, e);
      throw new ApiError(0, "Can’t reach MileVault. Check your connection and try again.", "NETWORK_ERROR");
    }
    if (req.raw && res.blob) return res.blob as T;
    const env = res.json as (Envelope<T> & { error?: ApiErrorBody }) | undefined;
    if (res.status >= 200 && res.status < 300 && !env) return undefined as T; // 204 No Content
    if (res.status >= 400 || !env) {
      const e = env?.error;
      const code = e?.code ?? (res.status === 0 ? "NETWORK_ERROR" : "UNKNOWN_ERROR");
      // Only a missing/expired session ends it; CHALLENGE_* 401s just restart sign-in.
      if (res.status === 401 && auth && (code === "WALLET_NOT_CONNECTED" || code === "SESSION_EXPIRED" || code === "UNKNOWN_ERROR")) onUnauthorized?.();
      const retry = e?.retryAfterSeconds ?? (Number(res.headers?.["retry-after"]) || undefined);
      throw new ApiError(res.status, env?.message ?? "Something went wrong. Please try again.", code, e?.fields ?? [], retry, e?.requestId,
        e?.details && typeof e.details === "object" ? (e.details as Record<string, unknown>) : undefined);
    }
    return env.data;
  }
  const page = (p?: PageParams) => ({ limit: p?.limit ?? 20, offset: p?.offset ?? 0 });
  const r = (ref: string) => encodeURIComponent(ref);

  return {
    health: () => call<{ status: string; database: string; redis: string }>({ method: "GET", path: "/health" }, false),
    stellar: {
      network: () => call<NetworkInfo>({ method: "GET", path: "/stellar/network" }, false),
      account: (address: string) => call<AccountSummary>({ method: "GET", path: `/stellar/accounts/${address}` }, false),
    },
    auth: {
      challenge: (address: string) => call<Challenge>({ method: "POST", path: "/wallet-auth/challenge", body: { address } }, false),
      verify: (transaction: string) => call<WalletToken>({ method: "POST", path: "/wallet-auth/verify", body: { transaction } }, false),
      session: () => call<WalletSession>({ method: "GET", path: "/wallet-auth/session" }),
      logout: () => call<void>({ method: "POST", path: "/wallet-auth/logout" }),
    },
    agreements: {
      list: (p: PageParams & { filter?: AgreementFilter; search?: string } = {}) =>
        call<Paginated<AgreementSummary>>({ method: "GET", path: "/agreements", query: { ...page(p), filter: p.filter, search: p.search } }),
      get: (ref: string) => call<Agreement>({ method: "GET", path: `/agreements/${r(ref)}` }),
      create: (input: SaveAgreementInput) => call<Agreement>({ method: "POST", path: "/agreements", body: input }),
      update: (ref: string, input: SaveAgreementInput) => call<Agreement>({ method: "PATCH", path: `/agreements/${r(ref)}`, body: input }),
      remove: (ref: string) => call<void>({ method: "DELETE", path: `/agreements/${r(ref)}` }),
      activity: (ref: string) => call<AgreementActivity[]>({ method: "GET", path: `/agreements/${r(ref)}/activity` }),
      publish: (ref: string) => call<Agreement>({ method: "POST", path: `/agreements/${r(ref)}/publish` }),
      accept: (ref: string) => call<Agreement>({ method: "POST", path: `/agreements/${r(ref)}/accept` }),
      cancel: (ref: string) => call<Agreement>({ method: "POST", path: `/agreements/${r(ref)}/cancel` }),
      submit: (ref: string, position: number, body: { link: string; note?: string }) =>
        call<Agreement>({ method: "POST", path: `/agreements/${r(ref)}/milestones/${position}/submit`, body }),
      requestChanges: (ref: string, position: number, note: string) =>
        call<Agreement>({ method: "POST", path: `/agreements/${r(ref)}/milestones/${position}/request-changes`, body: { note } }),
      withdrawCancellation: (ref: string) => call<Agreement>({ method: "POST", path: `/agreements/${r(ref)}/cancellation/withdraw` }),
      rejectCancellation: (ref: string) => call<Agreement>({ method: "POST", path: `/agreements/${r(ref)}/cancellation/reject` }),
    },
    escrow: {
      config: () => call<EscrowConfig>({ method: "GET", path: "/escrow/config" }),
      prepare: (ref: string, kind: ActionKind, position?: number) =>
        call<ChainAction>({ method: "POST", path: `/agreements/${r(ref)}/actions`, body: position === undefined ? { kind } : { kind, position } }),
      submit: (id: string, signedTransaction: string) => call<ChainAction>({ method: "POST", path: `/actions/${id}/submit`, body: { signedTransaction } }),
      status: (id: string) => call<ChainAction>({ method: "GET", path: `/actions/${id}` }),
    },
    overview: {
      dashboard: () => call<Dashboard>({ method: "GET", path: "/dashboard" }),
      wallet: () => call<WalletOverview>({ method: "GET", path: "/wallet" }),
      transactions: (p: PageParams & { type?: TxType; search?: string } = {}) =>
        call<Paginated<ActivityRow>>({ method: "GET", path: "/transactions", query: { ...page(p), type: p.type, search: p.search } }),
      exportCsv: (p: { type?: TxType; search?: string } = {}) =>
        call<Blob>({ method: "GET", path: "/transactions/export", query: { type: p.type, search: p.search }, raw: true }),
      notifications: (p: PageParams = {}) => call<NotificationsPage>({ method: "GET", path: "/notifications", query: page(p) }),
      readAll: () => call<void>({ method: "POST", path: "/notifications/read-all" }),
      read: (id: string) => call<void>({ method: "POST", path: `/notifications/${id}/read` }),
    },
    admin: {
      me: () => call<AdminMe>({ method: "GET", path: "/admin/me" }),
      overview: () => call<AdminOverview>({ method: "GET", path: "/admin/overview" }),
      system: () => call<AdminSystem>({ method: "GET", path: "/admin/system" }),
      agreements: (p: PageParams & { status?: AgreementStatus; search?: string } = {}) =>
        call<Paginated<AgreementSummary>>({ method: "GET", path: "/admin/agreements", query: { ...page(p), status: p.status, search: p.search } }),
      agreement: (ref: string) => call<AdminAgreementDetail>({ method: "GET", path: `/admin/agreements/${r(ref)}` }),
      transactions: (p: PageParams & { status?: ActionStatus; kind?: ActionKind; stuck?: boolean; search?: string } = {}) =>
        call<Paginated<AdminTransaction>>({ method: "GET", path: "/admin/transactions", query: { ...page(p), status: p.status, kind: p.kind, stuck: p.stuck || undefined, search: p.search } }),
      reconcile: (id: string) => call<AdminTransaction>({ method: "POST", path: `/admin/transactions/${id}/reconcile` }),
      runIndexer: () => call<AdminSystem>({ method: "POST", path: "/admin/indexer/run" }),
      wallets: (p: PageParams & { search?: string } = {}) => call<Paginated<AdminWallet>>({ method: "GET", path: "/admin/wallets", query: { ...page(p), search: p.search } }),
      wallet: (address: string) => call<AdminWallet & { agreements?: AgreementSummary[] }>({ method: "GET", path: `/admin/wallets/${address}` }),
    },
  };
}

export type MileVaultApi = ReturnType<typeof createApi>;
