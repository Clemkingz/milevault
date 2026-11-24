# MileVault

Milestone-based escrow payments on Stellar. Clients lock test USDC in escrow on Stellar (one claimable
balance per milestone), and contributors are paid milestone by milestone as the client approves and
releases each one.

> MVP on **Stellar Testnet**, using test assets only. This repository is the **frontend**. The
> MileVault API is a separate service (`NEXT_PUBLIC_API_URL`); its contract is
> [docs/FRONTEND_INTEGRATION.md](docs/FRONTEND_INTEGRATION.md).

## Repository layout

```
apps/
  web/        Landing page (Next.js 16)                       → /         dev :3000
  app/        Client & contributor dashboard (basePath /app)  → /app, /a/* dev :3001
  admin/      Operator console (basePath /admin)              → /admin    dev :3002
packages/
  api/        Typed API client, formatting + address helpers, demo-mode mock backend
  ui/         Design system: tokens, prototype styles, layout, motion, icons, components
  tsconfig/   Shared TS configs
docs/         Architecture, deploy guide, design prototypes + alignment notes
```

## Prerequisites

- Node ≥ 22 and pnpm 12 (`corepack enable` picks the pinned version)
- A Stellar wallet extension (Freighter, xBull, …) set to **Testnet** (live mode only)

## Getting started

```bash
pnpm install
pnpm dev        # web :3000, app :3001, admin :3002 — open http://localhost:3000
```

The landing proxies `/app`, `/a/*` and `/admin` to the other dev servers, so everything works from
port 3000 (same routing as production). `vercel dev` runs the real Vercel routing instead.
No env files are needed for demo mode. See `.env.example` for live settings.

## Demo mode and live mode

`NEXT_PUBLIC_DATA_SOURCE=mock` (the default) runs both apps against an in-browser mock of the API
(`packages/api/src/mock.ts`) with the same routes, shapes and error codes. Nothing leaves the browser.

- **Dashboard** (`/app`): a simulated wallet popup signs everything. The **Demo** button
  (bottom-right) switches between the client and contributor wallets, plays the other side's next
  step, forces a failed transaction or wrong network, sets the network latency, or resets the data.
  A brand-new wallet starts inactive, so you can try Friendbot, Enable USDC and the faucet.
- **Admin** (`/admin`): **Sign in as demo operator**, or try a non-operator wallet to see the 403 state.

Set `NEXT_PUBLIC_DATA_SOURCE=live` and `NEXT_PUBLIC_API_URL` to use the real API with a real wallet
(Freighter, xBull, Albedo, LOBSTR or Hana on Testnet).

## Features

- **Dashboard**: SEP-10 wallet sign-in; drafts with autosave → publish → fund → accept → submit →
  request changes / approve → release; decline; mutual cancellation (propose, confirm, reject,
  withdraw); recovery after the recovery date; wallet readiness (activate with Friendbot, Enable USDC,
  test USDC); transactions with CSV export; notifications; share links (`/a/MV-1042`).
- **Admin console**: overview totals, agreements (status filter, search, detail), on-chain
  transactions (status/kind/stuck filters, Re-check), wallets, system health (database, Redis,
  Horizon, arbiter, indexer) with **Run indexer**. Read-only otherwise, as the API is.
- **Installable app (PWA)** for the dashboard (production builds; `NEXT_PUBLIC_PWA_DEV=1` locally).
- **Layout**: 264px sidebar (76px icon rail at 1024–1279px, tab bar below 1024px), responsive down to
  280px wide.

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
