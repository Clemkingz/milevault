# MileVault

Milestone-based escrow payments on Stellar (Soroban). Clients lock testnet USDC in a smart contract,
and contributors are paid milestone by milestone as the client approves and releases each one.

> MVP on **Stellar Testnet**, using test assets only.

## Repository layout

```
apps/
  web/        Landing page (Next.js 16) on :3000, which proxies /app/* and /a/* to apps/app
  app/        Client & contributor dashboard (Next.js 16, basePath /app) on :3001
  api/        Backend: Hono + Drizzle/Postgres on :4000 (metadata API + event indexer)
contracts/
  escrow/     Soroban milestone escrow contract (Rust) + PRD §6 tests
packages/
  shared/     Status enums, types, zod schemas, amount helpers (shared by app + api)
  ui/         Design tokens (theme.css) + UI primitives
  tsconfig/   Shared TS configs
docs/
  architecture.md   System overview and agreement lifecycle
  design/           Design prototypes + design ↔ PRD/API alignment notes
scripts/      Contract deploy + TS bindings generation
```

See [docs/architecture.md](docs/architecture.md) for how the pieces fit together.

## Prerequisites

- Node ≥ 22 and pnpm 12 (`corepack enable` picks the pinned version)
- Docker (local Postgres)
- Rust + `wasm32v1-none` target and the [Stellar CLI](https://developers.stellar.org/docs/tools/cli) (contract work only)
- A Stellar wallet extension (Freighter, xBull, …) set to **Testnet**

## Getting started

```bash
pnpm install
cp .env.example apps/app/.env.local     # keep the NEXT_PUBLIC_* values
cp .env.example apps/web/.env.local     # APP_URL
cp .env.example apps/api/.env           # DATABASE_URL, ESCROW_CONTRACT_ID, …

pnpm db:up                  # Postgres in Docker
pnpm db:generate && pnpm db:migrate

pnpm dev                    # web :3000, app :3001, api :4000
```

Open http://localhost:3000. The dashboard lives at http://localhost:3000/app.

## Demo mode (mock data)

Until the contract and API are connected, the dashboard runs on an in-browser **mock chain**
(`apps/app/src/mock`) with a simulated wallet popup. Every contract rule is enforced there, so
the full client ↔ contributor journey can be exercised:

1. Open http://localhost:3000 → **Connect wallet** → pick any wallet (it's simulated).
2. Use the **Demo** button (bottom-right) to:
   - switch between **Aryan (client)** and **Kay (contributor)**,
   - play the **other side's next step** (accept, submit, approve, release, confirm cancellation),
   - force edge cases: **failed transaction**, **wallet on Mainnet**, slow/fast network,
   - **reset** the demo data.
3. In each wallet prompt, **Approve** signs; **Reject** shows the declined state.

State persists in `localStorage` (`milevault-demo`). Set `NEXT_PUBLIC_DATA_SOURCE=live` when
wiring the real contract — the mock store's actions map 1:1 to contract calls.

## App features

- **Profile & settings** (`/app/settings`): display name and photo per wallet (shown to the other party),
  preferences (hide balances, notifications, reduced motion, compact lists). API: `GET/PUT /v1/profiles/:address`.
- **Installable app (PWA)**: manifest + icons at `/app/manifest.webmanifest`, service worker `/app/sw.js`
  (app-shell caching and an offline screen). The service worker registers in production builds; set
  `NEXT_PUBLIC_PWA_DEV=1` to test it locally.
- **Layout**: 264px sidebar (76px icon rail at 1024–1279px, tab bar below 1024px), content up to 1200px,
  responsive down to 280px wide.

## Contract

```bash
pnpm contract:test          # cargo test: PRD §6 scenarios
pnpm contract:deploy        # build + deploy to Testnet, then prints the contract ID
ESCROW_CONTRACT_ID=C... pnpm contract:bindings   # typed TS client → packages/escrow-client
```

Then set `ESCROW_CONTRACT_ID` (api), `NEXT_PUBLIC_ESCROW_CONTRACT_ID` (app) and `INDEXER_START_LEDGER`.

## Deploy

Two Vercel projects from this repo: **dashboard** (`apps/app`, deploy first) and **landing** (`apps/web`,
needs `APP_URL` = the dashboard URL). Step-by-step settings and env vars: [docs/deploy.md](docs/deploy.md).

## Scripts

| Command | |
|---|---|
| `pnpm dev` | Run all apps |
| `pnpm build` | Build all apps |
| `pnpm typecheck` | Typecheck every package |
| `pnpm contract:*` | Build / test / deploy / bindings for the Soroban contract |
| `pnpm db:*` | Postgres + Drizzle migrations |
