import { bigint, index, integer, jsonb, pgTable, primaryKey, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

/**
 * Off-chain data only. The Soroban contract is the source of truth for balances,
 * authorisation, milestone payment state and refunds — the `status`/amount columns
 * here are an indexed *cache* rebuilt from contract events.
 */

export const agreements = pgTable(
  "agreements",
  {
    /** On-chain agreement id (u64) */
    id: bigint("id", { mode: "bigint" }).primaryKey(),
    projectName: text("project_name").notNull(),
    description: text("description"),
    client: text("client").notNull(),
    contributor: text("contributor").notNull(),
    token: text("token").notNull(),
    totalAmount: text("total_amount").notNull(),
    releasedAmount: text("released_amount").notNull().default("0"),
    status: text("status").notNull().default("created"),
    createdTxHash: text("created_tx_hash"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("agreements_client_idx").on(t.client), index("agreements_contributor_idx").on(t.contributor)],
);

export const milestones = pgTable(
  "milestones",
  {
    agreementId: bigint("agreement_id", { mode: "bigint" }).notNull().references(() => agreements.id, { onDelete: "cascade" }),
    index: integer("index").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    amount: text("amount").notNull(),
    status: text("status").notNull().default("pending"),
    /** Contributor-supplied link to the delivered work (off-chain) */
    submissionRef: text("submission_ref"),
    releasedTxHash: text("released_tx_hash"),
  },
  (t) => [primaryKey({ columns: [t.agreementId, t.index] })],
);

/** Raw indexed contract events — the audit trail behind "Transactions" and activity feeds. */
export const escrowEvents = pgTable(
  "escrow_events",
  {
    /** RPC event id (unique per ledger/tx/op/event) */
    id: text("id").primaryKey(),
    agreementId: bigint("agreement_id", { mode: "bigint" }).notNull(),
    type: text("type").notNull(),
    milestoneIndex: integer("milestone_index"),
    amount: text("amount"),
    actor: text("actor"),
    txHash: text("tx_hash").notNull(),
    ledger: integer("ledger").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    raw: jsonb("raw"),
  },
  (t) => [index("events_agreement_idx").on(t.agreementId), uniqueIndex("events_tx_type_idx").on(t.txHash, t.type, t.milestoneIndex)],
);

/** Wallet display profiles (name + avatar) — shown to the other side of an agreement. */
export const profiles = pgTable("profiles", {
  address: text("address").primaryKey(),
  name: text("name"),
  avatar: text("avatar"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Indexer cursor (single row keyed by contract id). */
export const indexerState = pgTable("indexer_state", {
  contractId: text("contract_id").primaryKey(),
  lastLedger: integer("last_ledger").notNull(),
  cursor: text("cursor"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
