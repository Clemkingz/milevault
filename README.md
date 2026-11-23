# MileVault

Milestone-based escrow payments on Stellar (Soroban). Clients lock testnet USDC in a smart contract,
and contributors are paid milestone by milestone as the client approves and releases each one.

> MVP on **Stellar Testnet**, using test assets only. This repository is the **frontend**: the
> MileVault backend is a separate, external service (`NEXT_PUBLIC_API_URL`).

## Repository layout

```
apps/
  web/        Landing page (Next.js 16)                       → /         dev :3000
  app/        Client & contributor dashboard (basePath /app)  → /app, /a/* dev :3001
  admin/      Operator console (basePath /admin)              → /admin    dev :3002
contracts/
  escrow/     Soroban milestone escrow contract (Rust) + PRD §6 tests
packages/
  shared/     Status enums, types, zod schemas, amount helpers
  ui/         Design system: tokens, prototype styles, layout, motion, icons, components
  tsconfig/   Shared TS configs
docs/         Architecture, deploy guide, design prototypes + alignment notes
scripts/      Contract deploy + TS bindings generation
```

## Prerequisites

- Node ≥ 22 and pnpm 12 (`corepack enable` picks the pinned version)
- A Stellar wallet extension (Freighter, xBull, …) set to **Testnet** (live mode only)
- Rust + `wasm32v1-none` and the [Stellar CLI](https://developers.stellar.org/docs/tools/cli) (contract work only)

## Getting started

```bash
pnpm install
pnpm dev        # web :3000, app :3001, admin :3002 — open http://localhost:3000
```

The landing proxies `/app`, `/a/*` and `/admin` to the other dev servers, so everything works from
port 3000 (same routing as production). `vercel dev` runs the real Vercel routing instead.
No env files are needed for demo mode. See `.env.example` for live settings.

## Demo mode (mock data)

Until the backend and contract are connected, the dashboard and admin console run on **mock data**:

- **Dashboard** (`/app`): an in-browser mock chain (`apps/app/src/mock`) with a simulated wallet popup.
  Every contract rule is enforced there. Use the **Demo** button (bottom-right) to switch between
  **Aryan (client)** and **Kay (contributor)**, play the other side's next step, force a failed
  transaction or wrong network, or reset the data. State persists in `localStorage`.
- **Admin** (`/admin`): sample platform data. Click **Continue as demo operator** to sign in.

Set `NEXT_PUBLIC_DATA_SOURCE=live` and `NEXT_PUBLIC_API_URL` to switch to the real backend.

## Features

- **Dashboard**: create → fund → accept → submit → approve → release, mutual cancellation, decline,
  transaction history with explorer links, wallets, **profile & settings** (name, photo, preferences).
- **Admin console**: platform KPIs, agreements needing attention, all agreements, wallets (with
  review flags), on-chain events, and system health (Soroban RPC + backend checks).
- **Installable app (PWA)** for the dashboard: manifest, icons, service worker with offline screen
  (production builds; `NEXT_PUBLIC_PWA_DEV=1` to test locally).
- **Layout**: 264px sidebar (76px icon rail at 1024–1279px, tab bar below 1024px), content up to
  1200px, responsive down to 280px wide.

## Contract

```bash
pnpm contract:test          # cargo test: PRD §6 scenarios
pnpm contract:deploy        # build + deploy to Testnet, then prints the contract ID
ESCROW_CONTRACT_ID=C... pnpm contract:bindings   # typed TS client → packages/escrow-client
```

Then set `NEXT_PUBLIC_ESCROW_CONTRACT_ID` for the dashboard and admin, and share it with the backend team.

## Deploy

One Vercel project with three **services** (root [`vercel.json`](vercel.json)): `web` (`/`),
`app` (`/app`, `/a/*`) and `admin` (`/admin`). Details: [docs/deploy.md](docs/deploy.md).

## Scripts

| Command | |
|---|---|
| `pnpm dev` | Run all three apps |
| `pnpm dev:web` / `dev:app` / `dev:admin` | Run one app |
| `pnpm build` | Build all apps |
| `pnpm typecheck` | Typecheck every package |
| `pnpm contract:*` | Build / test / deploy / bindings for the Soroban contract |
