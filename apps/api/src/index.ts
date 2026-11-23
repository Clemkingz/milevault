import { serve } from "@hono/node-server";
import { app } from "./app";
import { env } from "./env";
import { startIndexer } from "./indexer";

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`MileVault API listening on http://localhost:${info.port}`);
});

if (env.INDEXER_ENABLED && env.ESCROW_CONTRACT_ID) {
  startIndexer();
} else {
  console.warn("Indexer disabled (set ESCROW_CONTRACT_ID and INDEXER_ENABLED=true to enable).");
}
