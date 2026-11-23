# MileVault architecture

```
                 ┌───────────────────────── milevault.app ─────────────────────────┐
 browser ──────▶ │ apps/web (Next.js, :3000)   /  /#how …  landing                  │
                 │   rewrites /app/* and /a/* ─▶ apps/app (Next.js, basePath /app)  │
                 └──────────────────────────────────────────────┬──────────────────┘
                                                                │
       Stellar Wallets Kit (Freighter, xBull, Albedo, …)        │ REST (metadata, activity)
              │ sign                                            ▼
              ▼                                   apps/api (Hono, :4000) ── Postgres
   Soroban RPC ──▶ contracts/escrow (source of truth)       ▲
                          │ events                          │ getEvents polling
                          └─────────────────────────────────┘ (indexer)
```

## Source of truth
The **Soroban contract** owns escrow balances, authorisation, milestone payment state and refunds.
The API stores only what the chain doesn't (project/milestone descriptions, submission links) and an
indexed cache of contract events used for dashboards and history. The UI must never mark a milestone
paid optimistically — it waits for the confirmed transaction / indexed event.

## Agreement lifecycle

| On-chain status | UI label | Who acts next | Contract call |
|---|---|---|---|
| `Created` | Awaiting funding | Client funds or cancels | `fund`, `cancel` |
| `Funded` | Awaiting contributor | Contributor accepts or declines | `accept`, `decline` (full refund) |
| `Active` | Funded → In progress | Contributor submits, client approves, then releases | `submit_milestone`, `approve_milestone`, `release` |
| `CancelRequested` | Cancellation requested | Other party confirms (or requester withdraws) | `confirm_cancel`, `withdraw_cancel` |
| `Completed` | Completed | — | — |
| `Cancelled` / `Declined` | Cancelled / Declined | — | — |

Milestones: `Pending → Submitted → Approved → Paid`. **Approved ≠ paid**: release is a separate
transaction, and the UI says so explicitly (PRD §5).

## Packages

| Path | What |
|---|---|
| `apps/web` | Landing page (Inter). Proxies `/app/*` and `/a/*` to the dashboard zone. |
| `apps/app` | Client & contributor dashboard (Open Runde). Wallet kit, React Query, zustand, Radix dialog, sonner. |
| `apps/api` | Hono + Drizzle/Postgres. Metadata API + Soroban event indexer. |
| `contracts/escrow` | Soroban (Rust) milestone escrow contract + PRD §6 tests. |
| `packages/shared` | Status enums, DTO types, zod schemas, 7-decimal amount helpers. |
| `packages/ui` | Design tokens (`theme.css`) and primitives (Button, Card, StatusBadge, Field…). |
| `docs/design` | Design prototypes (client & contributor journeys) and design notes. |
