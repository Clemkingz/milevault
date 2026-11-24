# MileVault architecture

```
                 ┌──────────────── milevault.app (one Vercel project, 3 services) ────────────────┐
 browser ──────▶ │  /          → web   (apps/web, landing)                                        │
                 │  /app, /a/* → app   (apps/app, client & contributor dashboard)                 │
                 │  /admin     → admin (apps/admin, operator console)                             │
                 └──────────────┬───────────────────────────────────────┬─────────────────────────┘
                                │ fetch  NEXT_PUBLIC_API_URL/api/v1     │ sign only (Stellar Wallets Kit)
                                ▼                                       ▼
                 External MileVault API ───────────────────────▶ Stellar (claimable balances + arbiter)
                 (owns all state, prepares every transaction,
                  co-signs and submits it)
```

The API contract is [`FRONTEND_INTEGRATION.md`](FRONTEND_INTEGRATION.md). The typed client is
`packages/api` (`createApi`), shared by the dashboard and the admin console.

## Rules the UI follows

- **The backend owns state.** After every action the UI refetches; it never marks a milestone
  approved or paid optimistically.
- **Wallets sign, never submit.** On-chain actions are: prepare (`POST /agreements/{ref}/actions`)
  → the wallet signs the returned XDR unchanged → `POST /actions/{id}/submit` → poll
  `GET /actions/{id}` while `pending`. Only `status: "confirmed"` means it happened.
- The one exception is **Enable USDC**: the frontend builds a `changeTrust` transaction, the wallet
  signs it, and it is submitted to Horizon directly (`apps/app/src/lib/funding.ts`).
- **Amounts are decimal strings.** Display formatting and form totals never use float arithmetic
  (`fmtAmount`, `toCents`/`fromCents` in `@milevault/api`).
- Buttons come from `availableActions()` (`apps/app/src/lib/domain.ts`); the API still enforces
  every rule.

## Agreement lifecycle

| `status` | `displayStatus` / badge | Who acts next | How |
|---|---|---|---|
| `draft` | Draft | Client edits, publishes or deletes | API |
| `created` | Awaiting funding | Client funds or cancels | `fund` (signed) · cancel (API) |
| `funded` | Awaiting contributor | Contributor accepts or declines | accept (API) · `decline` (signed, refunds) |
| `in_progress` | In progress | Contributor submits; client requests changes, approves, releases | submit / request changes (API) · `approve`, `release` (signed) |
| `completed`, `cancelled`, `declined`, `recovered` | (same) | — | — |

Milestones: `pending → submitted → approved → paid`; request changes sends `submitted` back to
`pending` with `changesNote`. **Approved ≠ paid**: release is its own signed transaction.
Either party can propose a cancellation on a live agreement (`propose_cancel`, signed); the other
party confirms (`confirm_cancel`, signed, refunds unpaid milestones) or rejects (API); the proposer
can withdraw (API). After `recoveryAt`, the client can `recover` unpaid milestones and nothing else
can happen.

## Packages

| Path | What |
|---|---|
| `apps/web` | Landing page and legal pages. |
| `apps/app` | Dashboard: wallet sign-in (SEP-10), agreements, actions, transactions, wallet, notifications. React Query, zustand, Radix. |
| `apps/admin` | Operator console: `/admin/*` routes, read-only plus transaction re-check and indexer run. |
| `packages/api` | Typed API client, error class, formatting helpers, address validation, and the demo-mode mock backend. |
| `packages/ui` | Design tokens, prototype styles, layout, motion, icons, components. |
| `docs/design` | Design prototypes and alignment notes. |

## Demo mode

With `NEXT_PUBLIC_DATA_SOURCE=mock` (the default), both apps use `createMockTransport()` from
`packages/api/src/mock.ts`, an in-browser backend that answers the same routes with the same
shapes and error codes. The dashboard shows a simulated wallet popup and a **Demo** panel. Live mode
never loads mock data.
