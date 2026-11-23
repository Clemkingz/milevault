import { Hono } from "hono";
import { and, asc, desc, eq } from "drizzle-orm";
import { agreementMetadataSchema, milestoneSubmissionSchema, toBaseUnits } from "@milevault/shared";
import { db, schema } from "../db/client";
import { toActivity, toAgreement } from "../serialize";

export const agreementsRoutes = new Hono();

/**
 * Store off-chain metadata after the client's `create_agreement` tx succeeds.
 * TODO(security): verify `createdTxHash` on-chain (RPC getTransaction) and that the
 * agreement id/parties/amounts match the contract before persisting.
 */
agreementsRoutes.post("/", async (c) => {
  const body = agreementMetadataSchema.parse(await c.req.json());
  const id = BigInt(body.agreementId);
  const amounts = body.milestones.map((m) => toBaseUnits(m.amount));
  const total = amounts.reduce((a, b) => a + b, 0n);

  await db.transaction(async (tx) => {
    await tx
      .insert(schema.agreements)
      .values({
        id,
        projectName: body.projectName,
        description: body.description,
        client: body.client,
        contributor: body.contributor,
        token: "USDC",
        totalAmount: total.toString(),
        createdTxHash: body.createdTxHash,
      })
      .onConflictDoUpdate({
        target: schema.agreements.id,
        set: { projectName: body.projectName, description: body.description, updatedAt: new Date() },
      });
    await tx
      .insert(schema.milestones)
      .values(body.milestones.map((m, i) => ({ agreementId: id, index: i, title: m.title, description: m.description, amount: amounts[i]!.toString() })))
      .onConflictDoNothing();
  });

  return c.json(await loadAgreement(id), 201);
});

agreementsRoutes.get("/:id{[0-9]+}", async (c) => {
  const a = await loadAgreement(BigInt(c.req.param("id")));
  return a ? c.json(a) : c.json({ error: "Agreement not found" }, 404);
});

agreementsRoutes.get("/:id{[0-9]+}/activity", async (c) => {
  const rows = await db.query.escrowEvents.findMany({
    where: eq(schema.escrowEvents.agreementId, BigInt(c.req.param("id"))),
    orderBy: desc(schema.escrowEvents.ledger),
  });
  return c.json(rows.map(toActivity));
});

/** Contributor's off-chain submission link. The on-chain `submit_milestone` call is what changes status. */
agreementsRoutes.put("/:id{[0-9]+}/milestones/:index{[0-9]+}/submission", async (c) => {
  const { submissionRef } = milestoneSubmissionSchema.parse(await c.req.json());
  // TODO(security): require a signed message from the contributor wallet (SEP-53 / signMessage).
  await db
    .update(schema.milestones)
    .set({ submissionRef })
    .where(and(eq(schema.milestones.agreementId, BigInt(c.req.param("id"))), eq(schema.milestones.index, Number(c.req.param("index")))));
  return c.json({ ok: true });
});

export async function loadAgreement(id: bigint) {
  const a = await db.query.agreements.findFirst({ where: eq(schema.agreements.id, id) });
  if (!a) return null;
  const ms = await db.query.milestones.findMany({ where: eq(schema.milestones.agreementId, id), orderBy: asc(schema.milestones.index) });
  return toAgreement(a, ms);
}
