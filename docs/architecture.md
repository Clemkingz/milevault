# MileVault architecture

```
                    ┌──────────────── milevault.app (one Vercel project, 3 services) ────────────────┐
 browser ─────────▶ │  /         → web   (apps/web, landing)                                         │
                    │  /app, /a/* → app  (apps/app, client & contributor dashboard)                  │
                    │  /admin    → admin (apps/admin, operator console)                              │
                    └───────────────┬───────────────────────────────────────┬────────────────────────┘
                                    │ browser fetch (NEXT_PUBLIC_API_URL)   │ sign via Stellar Wallets Kit
                                    ▼                                       ▼
                    External MileVault backend                Soroban RPC ──▶ contracts/escrow
                    (metadata, profiles, event index)         (source of truth for funds)
```

## Source of truth
The **Soroban contract** owns escrow balances, authorisation, milestone payment state and refunds.
The external backend stores only what the chain doesn't (project/milestone descriptions, submission links, profiles) and an
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
| `apps/admin` | Operator console (basePath `/admin`): KPIs, agreements, wallets, events, system health. |
| `contracts/escrow` | Soroban (Rust) milestone escrow contract + PRD §6 tests. |
| `packages/shared` | Status enums, DTO types, zod schemas, 7-decimal amount helpers. |
| `packages/ui` | Design tokens (`theme.css`) and primitives (Button, Card, StatusBadge, Field…). |
| `docs/design` | Design prototypes (client & contributor journeys) and design notes. |
