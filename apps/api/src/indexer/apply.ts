import { and, eq, sql } from "drizzle-orm";
import type { AgreementStatus, MilestoneStatus } from "@milevault/shared";
import { db, schema } from "../db/client";
import type { DecodedEvent } from "./decode";

const AGREEMENT_STATUS: Partial<Record<DecodedEvent["type"], AgreementStatus>> = {
  agreement_funded: "funded",
  agreement_accepted: "active",
  agreement_declined: "declined",
  cancel_requested: "cancel_requested",
  agreement_cancelled: "cancelled",
};

const MILESTONE_STATUS: Partial<Record<DecodedEvent["type"], MilestoneStatus>> = {
  milestone_submitted: "submitted",
  milestone_approved: "approved",
  milestone_released: "paid",
};

/** Persist an event (idempotent) and update the cached agreement/milestone state. */
export async function applyEvent(e: DecodedEvent) {
  await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(schema.escrowEvents)
      .values({ ...e, raw: null })
      .onConflictDoNothing()
      .returning({ id: schema.escrowEvents.id });
    if (!inserted.length) return; // already processed

    const agreementStatus = AGREEMENT_STATUS[e.type];
    if (agreementStatus) {
      await tx.update(schema.agreements).set({ status: agreementStatus, updatedAt: e.occurredAt }).where(eq(schema.agreements.id, e.agreementId));
    }

    const milestoneStatus = MILESTONE_STATUS[e.type];
    if (milestoneStatus && e.milestoneIndex !== undefined) {
      await tx
        .update(schema.milestones)
        .set({ status: milestoneStatus, ...(e.type === "milestone_released" ? { releasedTxHash: e.txHash } : {}) })
        .where(and(eq(schema.milestones.agreementId, e.agreementId), eq(schema.milestones.index, e.milestoneIndex)));
    }

    if (e.type === "milestone_released" && e.amount) {
      await tx
        .update(schema.agreements)
        .set({ releasedAmount: sql`(${schema.agreements.releasedAmount}::numeric + ${e.amount}::numeric)::text`, updatedAt: e.occurredAt })
        .where(eq(schema.agreements.id, e.agreementId));
      // Completed once every milestone is paid
      await tx.execute(sql`
        update agreements set status = 'completed'
        where id = ${e.agreementId}
          and not exists (select 1 from milestones where agreement_id = ${e.agreementId} and status <> 'paid')`);
    }
  });
}
