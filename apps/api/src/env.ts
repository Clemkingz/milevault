import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  CORS_ORIGIN: z.string().default("http://localhost:3000,http://localhost:3001"),
  SOROBAN_RPC_URL: z.string().url().default("https://soroban-testnet.stellar.org"),
  ESCROW_CONTRACT_ID: z.string().default(""),
  INDEXER_ENABLED: z.stringbool().default(true),
  INDEXER_POLL_INTERVAL_MS: z.coerce.number().default(6000),
  INDEXER_START_LEDGER: z.coerce.number().optional(),
});

export const env = schema.parse(process.env);
