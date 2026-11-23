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
| Cancellation / refund interface | Cancel only for **unfunded** agreements; contributor **Decline** refunds a funded one | ✅ Mutual cancellation **built in code** in the design's style (request → other party confirms or requester withdraws), using the unused C-04 / C-07 illustrations. Still needs a designer pass. |

## Designer deliverable states (PRD §A)

| State | Prototype |
|---|---|
| Empty | ✅ ("All caught up", "No activity yet", …) |
| Success | ✅ (created, funded, released, toasts) |
| Wallet disconnected | ✅ (landing, invite link, disconnect confirm) |
| User rejects in wallet | ✅ ("You declined in Freighter", "Connection declined") |
| **Transaction failed on-chain** (contract error, network/RPC error) | ✅ Built in code: "Transaction failed" dialog (W-05E, sunset sky), retry. Needs a designer pass. |
| **Loading** (data fetching) | ✅ Built in code: shimmer skeletons shaped like each screen. |
| Wrong network (wallet on Mainnet) | ✅ Built in code: "Switch to Testnet" dialog (W-08). |
| 404 / error pages | ✅ Built in code: "Nothing in this vault" (E-01) and error page (W-05E). |

## New in the design (not in the PRD), now in code

- **Contributor accept / decline** of a funded agreement. Implemented in the contract (`accept`, `decline`) and status model (`Funded → Active`, `Declined`).
- **Invite deep link** `milevault.app/a/MV-1042`. Implemented at `apps/app/src/app/a/[ref]`, and the landing page rewrites `/a/*` to it.
- Agreement refs shown as `MV-<id>`. Implemented with `agreementRef()` in `@milevault/shared`.
- Submission link on submit (`https://…`). Stored off-chain by the external backend.

## Backend gaps the design implies (external backend)

| Design element | Gap |
|---|---|
| Party names + avatars ("Aryan Roy", "Kay Finley") | No profile/name data in the PRD or API. Today the UI shows short addresses. Needs a decision: add optional display names to the API, or keep addresses only. |
| "Only the client and contributor wallets can open this agreement" | API reads are public by wallet address. This needs wallet-signature auth (SEP-10 / signed message) on the API. |
| Transactions: search by name or address, Export CSV | Working in the UI against mock data (search by name/address/hash, CSV export). Needs API endpoints for live data. |
| "We'll let you know when…" | No notification channel in the PRD (toasts only while the app is open). |
| Wallet page: USDC / XLM balances, "Locked as client / for you" | Shown from mock balances today; live version reads the token contract + Horizon, not the API. |

## Additions beyond the prototype (need a designer pass)

- **Sidebar**: logo top, "New agreement" action, grouped nav (Workspace / Account), account chip at the bottom; icon rail on small laptops.
- **Install card** replaces "Available on iOS" — the app is a PWA (native install prompt, iOS/Safari instructions dialog with W-08).
- **Profile & settings** screen (name, photo upload with square crop, preferences, wallet session).
- **Branded loader** (vault mark + drawing ring), stacked toasts with tones and countdown, error screen with reference code, 404 with MV-number lookup, offline screen.

## Layout beyond the prototype

The prototype renders inside fixed 1440×900 / 390×844 frames with a 700px column. Production widens it:
content up to 1120px (1280px on ≥1600px screens); dashboard, agreement detail, new agreement and wallets
use a main column + side panel on ≥1200px; tablet (768–1023px) uses the mobile chrome with a centred column.
