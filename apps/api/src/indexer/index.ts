import { rpc } from "@stellar/stellar-sdk";
import { eq } from "drizzle-orm";
import { db, schema } from "../db/client";
import { env } from "../env";
import { applyEvent } from "./apply";
import { decodeEvent } from "./decode";

/**
 * Polls Soroban RPC `getEvents` for the escrow contract and indexes them.
 * Note: RPC only retains ~7 days of events — run continuously, and set
 * INDEXER_START_LEDGER to the contract deployment ledger on first run.
 */
const server = new rpc.Server(env.SOROBAN_RPC_URL);
const contractId = env.ESCROW_CONTRACT_ID;

async function loadCursor(): Promise<{ startLedger?: number; cursor?: string }> {
  const row = await db.query.indexerState.findFirst({ where: eq(schema.indexerState.contractId, contractId) });
  if (row?.cursor) return { cursor: row.cursor };
  if (env.INDEXER_START_LEDGER) return { startLedger: env.INDEXER_START_LEDGER };
  const latest = await server.getLatestLedger();
  return { startLedger: Math.max(1, latest.sequence - 1000) };
}

async function saveCursor(lastLedger: number, cursor: string) {
  await db
    .insert(schema.indexerState)
    .values({ contractId, lastLedger, cursor })
    .onConflictDoUpdate({ target: schema.indexerState.contractId, set: { lastLedger, cursor, updatedAt: new Date() } });
}

async function tick() {
  const { startLedger, cursor } = await loadCursor();
  const filters: rpc.Api.EventFilter[] = [{ type: "contract", contractIds: [contractId] }];
  const res = await server.getEvents(
    cursor ? { cursor, filters, limit: 200 } : { startLedger: startLedger!, filters, limit: 200 },
  );

  for (const raw of res.events) {
    const e = decodeEvent(raw);
    if (e) await applyEvent(e);
  }
  if (res.cursor) await saveCursor(res.latestLedger, res.cursor);
}

export function startIndexer() {
  console.log(`Indexer watching ${contractId}`);
  let running = false;
  const loop = async () => {
    if (running) return;
    running = true;
    try {
      await tick();
    } catch (err) {
      console.error("[indexer]", err);
    } finally {
      running = false;
    }
  };
  void loop();
  return setInterval(loop, env.INDEXER_POLL_INTERVAL_MS);
}
