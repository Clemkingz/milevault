# Deploying MileVault (frontend)

This repo deploys as **one Vercel project with three Next.js services**, configured in the root
[`vercel.json`](../vercel.json) ([Vercel services](https://vercel.com/docs/services), Beta).
The MileVault backend is an **external service** owned separately. The frontends call it from the
browser at `NEXT_PUBLIC_API_URL`.

| Service | Root | basePath | Public paths |
|---|---|---|---|
| `web` | `apps/web` | — | `/` and everything not matched below (landing, legal, sitemap, OG images) |
| `app` | `apps/app` | `/app` | `/app`, `/app/*`, `/a/*` (short share links redirect to `/app/a/*`) |
| `admin` | `apps/admin` | `/admin` | `/admin`, `/admin/*` |

Vercel passes each service the **original request path**, which is why `app` and `admin` use a
`basePath` matching their public prefix. Rewrites run from most to least specific, with `web` as the
catch-all.

**Bindings: none.** No service calls another server-side. The three apps only link to each other in
the browser (same domain), and the backend is outside Vercel. A binding would only be needed if one
of these services started calling another from server code.

## Project setup

1. Import the repo into Vercel as **one** project (Root Directory: repository root).
2. Vercel reads `vercel.json` → `services`. pnpm is pinned via `packageManager` (`pnpm@12.14.0`).
3. Environment variables (Project → Settings → Environment Variables). See `.env.example`:

| Variable | Needed for | Notes |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | all | Public domain, e.g. `https://milevault.app`. Falls back to the Vercel URL |
| `NEXT_PUBLIC_DATA_SOURCE` | app, admin | `mock` (default, in-browser demo backend) or `live` |
| `NEXT_PUBLIC_API_URL` | app, admin | Backend URL, with or without `/api/v1`. Required for `live` |
| `NEXT_PUBLIC_STELLAR_NETWORK` | app, admin | `testnet` (default) |

**CORS:** the backend must allow the site's origin (its `FRONTEND_URL` / `CORS_ORIGINS` setting).
It currently allows `localhost` only, so a Vercel deployment in `live` mode gets CORS errors until
the production domain (and preview domains, if wanted) is added there.

## Admin access

The console signs in with the same wallet flow as the dashboard, then calls `GET /admin/me`:
`200` opens the console, `403 NOT_ADMIN` shows "This wallet does not have admin access". The
allowlist is the backend's `ADMIN_WALLETS`. `/admin` is public on Vercel, so access control is the
backend's job; optionally add Vercel Deployment Protection or Firewall rules on `/admin` too.

## Local development

- `pnpm dev`: web :3000 (open this), app :3001, admin :3002. The landing proxies `/app`, `/a/*`,
  `/admin` in dev only (`LOCAL_APP_URL`, `LOCAL_ADMIN_URL`).
- `vercel dev`: all services with the real `vercel.json` routing.

## Notes

- **Security headers** on all three apps. `app` and `admin` also send `X-Robots-Tag: noindex`.
- **PWA**: the dashboard's service worker (`/app/sw.js`) registers in production builds only.
- Services are a Beta feature. Fallback: deploy each app as its own Vercel project and restore an
  external-URL proxy in `apps/web/next.config.ts`.
