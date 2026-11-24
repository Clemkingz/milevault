# Design guide → PRD & API alignment

Source: the two MileVault prototypes (client journey, contributor journey), saved in full in
[`prototype/`](prototype/). Open `client-journey.html` / `contributor-journey.html` in a browser.
`styles.css` and `client.js` / `contributor.js` are the extracted stylesheet and screen code.

Tokens, fonts (Open Runde for the app, Inter for marketing) and illustrations (`apps/app/public/images`)
are already applied in code — see `packages/ui/src/theme.css`.

## Screens: PRD vs prototype

| PRD screen | Prototype | Status |
|---|---|---|
| 1. Landing, connect wallet, dashboard | Landing, wallet picker (Freighter, xBull, Albedo, Lobstr, Hana), connecting / connected / declined states, dashboard | ✅ Covered |
| 1. Dashboard metrics: total, active, funds in escrow, pending approvals, recent activity | Funds in escrow, awaiting approval, released, total spent, active cards, "waiting on you", activity | ⚠️ "Total agreements" count isn't on the dashboard (the Agreements page shows it) |
| 2. Create agreement + preview | 3 steps: Project → Milestones → Preview, max 10 milestones | ✅ Covered |
| 3. Escrow funding (balance, authorisation, confirmation, tx ref) | Fund dialog with balance, insufficient-balance warning, wallet signature, pending, done | ✅ Covered |
| 4. Milestone management (submit / approve / release / remaining) | "Next action" card per role; approve and release kept separate | ✅ Covered |
| 5. Details & history (ID, parties, hashes, explorer, refund state) | Agreement page tabs: Overview, Milestones, Activity; Transactions page | ✅ Covered |
| Cancellation / refund interface | Cancel only for **unfunded** agreements; contributor **Decline** refunds a funded one | ✅ Mutual cancellation **built in code** in the design's style (propose → other party confirms or rejects, or the proposer withdraws), plus **Recover** after the recovery date, using the unused C-04 / C-07 illustrations. Still needs a designer pass. |

## Designer deliverable states (PRD §A)

| State | Prototype |
|---|---|
| Empty | ✅ ("All caught up", "No activity yet", …) |
| Success | ✅ (created, funded, released, toasts) |
| Wallet disconnected | ✅ (landing, invite link, disconnect confirm) |
| User rejects in wallet | ✅ ("You declined in Freighter", "Connection declined") |
| **Transaction failed on-chain** (`status: "failed"` with `failure`, expired, or still pending) | ✅ Built in code: "Transaction didn’t go through" (W-05E) with the API’s reason and a fix-it action, plus a "Still confirming" state with no retry. Needs a designer pass. |
| **Loading** (data fetching) | ✅ Built in code: shimmer skeletons shaped like each screen. |
| Wrong network (wallet on Mainnet) | ✅ Built in code: "Switch to Testnet" dialog (W-08). |
| 404 / error pages | ✅ Built in code: "Nothing in this vault" (E-01) and error page (W-05E). |

## New in the design (not in the PRD), now in code

- **Contributor accept / decline** of a funded agreement. Accept is an API call; decline is a signed on-chain action that refunds the client.
- **Invite deep link** `milevault.app/a/MV-1042`. Implemented at `apps/app/src/app/a/[ref]`, and the landing page rewrites `/a/*` to it.
- Agreement refs shown as `MV-<id>`, exactly as the API returns them.
- Submission link on submit. The API requires the full `https://…` link (the prototype accepted bare domains).

## Differences from the prototype (from the API guide, now in code)

| Prototype | Now |
|---|---|
| Soroban contract wording, "Escrow contract C…E2M" row | Stellar escrow (claimable balances); details show the reference, asset, arbiter and funding transaction |
| Wallet popup on create / accept / submit | Plain API calls; only fund, approve, release, decline, cancellation and recover are signed |
| Names and photos ("Aryan Roy", "Kay Finley") | Short addresses and generated avatars (the API has no profiles) |
| No way to reject work | **Request changes** with a required note, shown to the contributor |
| Share page shows the agreement before connecting | "Connect to view this agreement"; non-parties see "This wallet isn't part of this agreement" |
| No recovery | Recovery date, a warning when it's close, and a client **Recover** action after it |
| Single asset implied | Asset comes from `/escrow/config` and is shown with its issuer. Choosing an asset per agreement needs an API change (the API rejects an `asset` field today) |

## Additions beyond the prototype (need a designer pass)

- **Sidebar**: logo top, "New agreement" action, grouped nav (Workspace / Account), account chip at the bottom; icon rail on small laptops.
- **Install card** replaces "Available on iOS" — the app is a PWA (native install prompt, iOS/Safari instructions dialog with W-08).
- **Settings** screen (preferences and wallet session; no profiles, since the API has none).
- **Notifications** page and bell (`/notifications`), **Wallet** readiness actions (Friendbot, Enable USDC, test USDC).
- **Branded loader** (vault mark + drawing ring), stacked toasts with tones and countdown, error screen with reference code, 404 with MV-number lookup, offline screen.

## Layout beyond the prototype

The prototype renders inside fixed 1440×900 / 390×844 frames with a 700px column. Production widens it:
content up to 1120px (1280px on ≥1600px screens); dashboard, agreement detail, new agreement and wallets
use a main column + side panel on ≥1200px; tablet (768–1023px) uses the mobile chrome with a centred column.
