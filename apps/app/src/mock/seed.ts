import { ago, D, H } from "./format";
import type { MockAgreement, MockEvent, MockMilestone, PersonKey } from "./types";

/** Deterministic 64-hex "hash" so seed data is stable across reloads. */
function seedHash(n: number) {
  let x = (n * 2654435761) >>> 0, out = "";
  while (out.length < 64) { x = (x * 1103515245 + 12345) >>> 0; out += x.toString(16).padStart(8, "0"); }
  return out.slice(0, 64);
}

const ms = (title: string, desc: string, amount: number, status: MockMilestone["status"] = "pending", x: Partial<MockMilestone> = {}): MockMilestone =>
  ({ title, desc, amount, status, ...x });

/**
 * One dataset that contains BOTH prototype journeys:
 * - Aryan Roy (client): Mobile app MVP, Landing page, API integration, Token dashboard, Wallet audit
 * - Kay Finley (contributor): Booking app (Sophia), Brand refresh (Abbas), Landing page (Aryan)
 * The "Website redesign" agreement is created by you during the client journey.
 */
export function seed() {
  const agreements: MockAgreement[] = [
    { id: "1041", name: "Landing page", desc: "Single landing page for the product launch.", client: "aryan", contributor: "kay", status: "created", color: "P", createdAt: ago(2 * D), createHash: seedHash(1),
      ms: [ms("Design", "", 300), ms("Build", "", 400), ms("Launch", "", 200)] },
    { id: "1038", name: "Mobile app MVP", desc: "iOS and Android app for the booking flow.", client: "aryan", contributor: "rhea", status: "active", color: "B", createdAt: ago(21 * D), fundHash: seedHash(2),
      ms: [ms("UI/UX implementation", "Screens and design system in code.", 450, "approved", { submittedAt: ago(1 * D), approvedAt: ago(3 * H), link: "figma.com/proto/mvp-ui" }), ms("Booking flow", "Search, select and pay.", 700), ms("Notifications", "Push and email.", 450), ms("Store release", "App Store and Play listing.", 400)] },
    { id: "1040", name: "API integration", desc: "Payments API and webhooks.", client: "aryan", contributor: "rhea", status: "active", color: "B", createdAt: ago(7 * D), fundHash: seedHash(3),
      ms: [ms("Auth and webhooks", "", 550), ms("Sync and retries", "", 600)] },
    { id: "1035", name: "Token dashboard", desc: "Read-only dashboard for token holders.", client: "aryan", contributor: "abbas", status: "active", color: "Y", createdAt: ago(30 * D), fundHash: seedHash(4),
      ms: [ms("Data layer", "", 400, "paid", { paidAt: ago(21 * D), releaseHash: seedHash(5) }), ms("Charts", "", 400, "paid", { paidAt: ago(4 * D), releaseHash: seedHash(6) }), ms("Launch", "", 400)] },
    { id: "1029", name: "Wallet audit", desc: "Security review of the wallet flows.", client: "aryan", contributor: "abbas", status: "completed", color: "Y", createdAt: ago(60 * D), fundHash: seedHash(7),
      ms: [ms("Threat model", "", 250, "paid", { paidAt: ago(49 * D), releaseHash: seedHash(8) }), ms("Review", "", 350, "paid", { paidAt: ago(42 * D), releaseHash: seedHash(9) }), ms("Report", "", 200, "paid", { paidAt: ago(35 * D), releaseHash: seedHash(10) })] },
    { id: "1036", name: "Booking app", desc: "iOS and Android app for the booking flow.", client: "sophia", contributor: "kay", status: "active", color: "B", createdAt: ago(21 * D), fundHash: seedHash(11),
      ms: [ms("UI/UX implementation", "", 450, "approved", { submittedAt: ago(1 * D), approvedAt: ago(1 * H), link: "figma.com/proto/mvp-ui" }), ms("Booking flow", "", 700), ms("Notifications", "", 450), ms("Store release", "", 400)] },
    { id: "1039", name: "Brand refresh", desc: "Logo cleanup and brand guidelines.", client: "abbas", contributor: "kay", status: "active", color: "Y", createdAt: ago(1 * D), fundHash: seedHash(12),
      ms: [ms("Visual direction", "", 600), ms("Guidelines", "", 600)] },
    { id: "1030", name: "Logo refresh", desc: "Logo cleanup for the new brand.", client: "abbas", contributor: "kay", status: "completed", color: "Y", createdAt: ago(28 * D), fundHash: seedHash(13),
      ms: [ms("Logo", "", 600, "paid", { paidAt: ago(14 * D), releaseHash: seedHash(14) })] },
  ];

  const ev = (n: number, kind: MockEvent["kind"], agreementId: string, actor: PersonKey, at: string, x: Partial<MockEvent> = {}): MockEvent =>
    ({ id: `seed-${n}`, kind, agreementId, actor, at, hash: seedHash(100 + n), ...x });

  const events: MockEvent[] = [
    ev(1, "approve", "1038", "aryan", ago(3 * H), { i: 0 }),
    ev(2, "create", "1041", "aryan", ago(2 * D), { hash: seedHash(1) }),
    ev(3, "release", "1035", "aryan", ago(4 * D), { i: 1, amount: 400, hash: seedHash(6) }),
    ev(4, "fund", "1040", "aryan", ago(6 * D), { amount: 1150, hash: seedHash(3) }),
    ev(5, "release", "1035", "aryan", ago(14 * D), { i: 0, amount: 400, hash: seedHash(5) }),
    ev(6, "fund", "1038", "aryan", ago(21 * D), { amount: 2000, hash: seedHash(2) }),
    ev(7, "fund", "1035", "aryan", ago(30 * D), { amount: 1200, hash: seedHash(4) }),
    ev(8, "approve", "1036", "sophia", ago(1 * H), { i: 0, hash: undefined }),
    ev(9, "fund", "1039", "abbas", ago(1 * D), { amount: 1200, hash: seedHash(12) }),
    ev(10, "release", "1030", "abbas", ago(14 * D), { i: 0, amount: 600, hash: seedHash(14) }),
    ev(11, "accept", "1039", "kay", ago(20 * H)),
    ev(12, "fund", "1029", "aryan", ago(60 * D), { amount: 800, hash: seedHash(7) }),
  ];

  return {
    agreements,
    events,
    balances: { aryan: { usdc: 2450, xlm: 48.2 }, kay: { usdc: 312.4, xlm: 21.75 }, rhea: { usdc: 900, xlm: 30 }, abbas: { usdc: 5200, xlm: 80 }, sophia: { usdc: 4100, xlm: 64 } } as Record<PersonKey, { usdc: number; xlm: number }>,
    nextId: 1042,
  };
}
