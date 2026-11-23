import { Hono } from "hono";
import { desc, eq, inArray, or } from "drizzle-orm";
import { stellarAddressSchema, type DashboardSummary } from "@milevault/shared";
import { db, schema } from "../db/client";
import { toActivity, toAgreement } from "../serialize";

export const walletsRoutes = new Hono();

async function agreementsFor(address: string) {
  const rows = await db.query.agreements.findMany({
    where: or(eq(schema.agreements.client, address), eq(schema.agreements.contributor, address)),
    orderBy: desc(schema.agreements.createdAt),
  });
  if (!rows.length) return [];
  const ms = await db.query.milestones.findMany({ where: inArray(schema.milestones.agreementId, rows.map((r) => r.id)) });
  return rows.map((r) => toAgreement(r, ms.filter((m) => m.agreementId === r.id)));
}

walletsRoutes.get("/:address/agreements", async (c) => {
  const address = stellarAddressSchema.parse(c.req.param("address"));
  return c.json(await agreementsFor(address));
});

walletsRoutes.get("/:address/activity", async (c) => {
  const address = stellarAddressSchema.parse(c.req.param("address"));
  const ids = (await agreementsFor(address)).map((a) => BigInt(a.id));
  if (!ids.length) return c.json([]);
  const rows = await db.query.escrowEvents.findMany({
    where: inArray(schema.escrowEvents.agreementId, ids),
    orderBy: desc(schema.escrowEvents.ledger),
    limit: 200,
  });
  return c.json(rows.map(toActivity));
});

walletsRoutes.get("/:address/dashboard", async (c) => {
  const address = stellarAddressSchema.parse(c.req.param("address"));
  const list = await agreementsFor(address);
  const ids = list.map((a) => BigInt(a.id));
  const recent = ids.length
    ? await db.query.escrowEvents.findMany({ where: inArray(schema.escrowEvents.agreementId, ids), orderBy: desc(schema.escrowEvents.ledger), limit: 5 })
    : [];
  const summary: DashboardSummary = {
    totalAgreements: list.length,
    activeAgreements: list.filter((a) => ["created", "funded", "active", "cancel_requested"].includes(a.status)).length,
    fundsInEscrow: list.reduce((s, a) => s + BigInt(a.escrowBalance), 0n).toString(),
    pendingApprovals: list
      .filter((a) => a.client === address)
      .reduce((n, a) => n + a.milestones.filter((m) => m.status === "submitted" || m.status === "approved").length, 0),
    recentActivity: recent.map(toActivity),
  };
  return c.json(summary);
});
