import type { ActivityItem, Agreement, AgreementStatus, EscrowEventType, MilestoneStatus } from "@milevault/shared";
import type { schema } from "./db/client";

type AgreementRow = typeof schema.agreements.$inferSelect;
type MilestoneRow = typeof schema.milestones.$inferSelect;
type EventRow = typeof schema.escrowEvents.$inferSelect;

export function toAgreement(a: AgreementRow, ms: MilestoneRow[]): Agreement {
  const funded = !["created", "cancelled", "declined"].includes(a.status);
  return {
    id: a.id.toString(),
    projectName: a.projectName,
    description: a.description ?? undefined,
    client: a.client,
    contributor: a.contributor,
    token: a.token,
    totalAmount: a.totalAmount,
    releasedAmount: a.releasedAmount,
    escrowBalance: funded ? (BigInt(a.totalAmount) - BigInt(a.releasedAmount)).toString() : "0",
    status: a.status as AgreementStatus,
    milestones: ms
      .sort((x, y) => x.index - y.index)
      .map((m) => ({
        index: m.index,
        title: m.title,
        description: m.description ?? undefined,
        amount: m.amount,
        status: m.status as MilestoneStatus,
        submissionRef: m.submissionRef ?? undefined,
        releasedTxHash: m.releasedTxHash ?? undefined,
      })),
    createdTxHash: a.createdTxHash ?? undefined,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

export function toActivity(e: EventRow): ActivityItem {
  return {
    id: e.id,
    agreementId: e.agreementId.toString(),
    type: e.type as EscrowEventType,
    milestoneIndex: e.milestoneIndex ?? undefined,
    amount: e.amount ?? undefined,
    actor: e.actor ?? undefined,
    txHash: e.txHash,
    ledger: e.ledger,
    occurredAt: e.occurredAt.toISOString(),
  };
}
