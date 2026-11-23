import { rpc, scValToNative } from "@stellar/stellar-sdk";
import { ESCROW_EVENT_TYPES, type EscrowEventType } from "@milevault/shared";

/**
 * Contract event layout (see contracts/escrow/src/events.rs):
 *   topics: [Symbol(<event name>), u64 agreement_id]
 *   data:   map { actor?: Address, milestone?: u32, amount?: i128 }
 */
export interface DecodedEvent {
  id: string;
  type: EscrowEventType;
  agreementId: bigint;
  milestoneIndex?: number;
  amount?: string;
  actor?: string;
  txHash: string;
  ledger: number;
  occurredAt: Date;
}

export function decodeEvent(e: rpc.Api.EventResponse): DecodedEvent | null {
  const [nameVal, idVal] = e.topic;
  if (!nameVal || !idVal) return null;
  const name = String(scValToNative(nameVal));
  if (!(ESCROW_EVENT_TYPES as readonly string[]).includes(name)) return null;

  const data = (scValToNative(e.value) ?? {}) as { actor?: string; milestone?: number; amount?: bigint };
  return {
    id: e.id,
    type: name as EscrowEventType,
    agreementId: BigInt(scValToNative(idVal) as bigint | number),
    milestoneIndex: data.milestone !== undefined ? Number(data.milestone) : undefined,
    amount: data.amount !== undefined ? data.amount.toString() : undefined,
    actor: data.actor,
    txHash: e.txHash,
    ledger: e.ledger,
    occurredAt: new Date(e.ledgerClosedAt),
  };
}
