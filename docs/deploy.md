# Deploying MileVault

MileVault deploys as **two Vercel projects** from this one repository, plus (later) the API on a host
that supports long-running processes.

```
milevault.app (landing, apps/web) ──/app/*, /a/*──▶ milevault-app.vercel.app (dashboard, apps/app, basePath /app)
```

Users only ever see the landing domain: the landing proxies `/app/*` and `/a/*` to the dashboard project.

## 1. Dashboard project (`apps/app`) — deploy this first

| Setting | Value |
|---|---|
| Root Directory | `apps/app` |
| Framework | Next.js (auto-detected; `apps/app/vercel.json` sets install/build) |
| Include files outside the Root Directory | **Enabled** (needed for `packages/*`) |
| Node.js version | 22.x or 24.x |

Environment variables:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_DATA_SOURCE` | `mock` (in-browser demo, the default) until the contract and API are live |
| `NEXT_PUBLIC_SITE_URL` | The landing's public URL, e.g. `https://milevault.app` (used for share links and metadata) |
| `NEXT_PUBLIC_STELLAR_NETWORK` etc. | See `.env.example`. Only needed with `NEXT_PUBLIC_DATA_SOURCE=live` |

Note the deployment URL (for example `https://milevault-app.vercel.app`).

## 2. Landing project (`apps/web`)

| Setting | Value |
|---|---|
| Root Directory | `apps/web` |
| Include files outside the Root Directory | **Enabled** |

Environment variables:

| Variable | Value |
|---|---|
| `APP_URL` | **Required.** The dashboard URL from step 1. The build fails with a clear error if it's missing |
| `NEXT_PUBLIC_SITE_URL` | The landing's public URL (canonical URLs, sitemap, OG images). Falls back to the Vercel URL |

Attach your custom domain to **this** project.

## Notes

- **pnpm**: the repo pins `pnpm@12.14.0` in `packageManager`. Vercel's pnpm switches to that exact
  version automatically. Optionally set `ENABLE_EXPERIMENTAL_COREPACK=1` on both projects.
- **Skipping builds**: each `vercel.json` has an `ignoreCommand` that skips a deploy when nothing in that
  app, `packages/`, or the lockfile changed.
- **PWA**: the service worker (`/app/sw.js`) registers in production builds only. Headers for it are set
  in `apps/app/next.config.ts`.
- **Security headers** (HSTS, nosniff, frame-deny, referrer, permissions policy) are set in both
  `next.config.ts` files. The dashboard also sends `X-Robots-Tag: noindex`.
- **Preview deployments**: point a landing preview at a dashboard preview by setting `APP_URL` for the
  Preview environment.

## API (`apps/api`) — not on Vercel yet

The API runs a long-lived Soroban event indexer and needs Postgres, so host it on a platform with
persistent processes (Railway, Render, Fly.io) with a managed Postgres (Neon, Supabase, RDS):

```bash
pnpm --filter @milevault/api db:migrate
pnpm --filter @milevault/api start        # PORT, DATABASE_URL, ESCROW_CONTRACT_ID, CORS_ORIGIN
```

Set `CORS_ORIGIN` to the landing domain. Then switch the dashboard to `NEXT_PUBLIC_DATA_SOURCE=live`
and set `NEXT_PUBLIC_API_URL`.

## Contract

See the README (`pnpm contract:deploy`). CI runs `cargo test` on every push.
