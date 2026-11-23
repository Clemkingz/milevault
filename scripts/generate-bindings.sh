#!/usr/bin/env bash
# Generate a typed TypeScript client for the deployed contract into packages/escrow-client.
# Usage: ESCROW_CONTRACT_ID=C... pnpm contract:bindings
set -euo pipefail
: "${ESCROW_CONTRACT_ID:?Set ESCROW_CONTRACT_ID}"
cd "$(dirname "$0")/.."

stellar contract bindings typescript \
  --network "${STELLAR_NETWORK:-testnet}" \
  --contract-id "$ESCROW_CONTRACT_ID" \
  --output-dir packages/escrow-client \
  --overwrite

echo "✓ Bindings written to packages/escrow-client — run pnpm install, then use it in apps/app/src/lib/stellar/escrow.ts"
