#!/usr/bin/env bash
# Build + deploy the escrow contract to Stellar Testnet.
# Requires: Rust (wasm32v1-none target) and the Stellar CLI (`stellar`).
# Usage: SOURCE_ACCOUNT=milevault-deployer pnpm contract:deploy
set -euo pipefail

SOURCE_ACCOUNT="${SOURCE_ACCOUNT:-milevault-deployer}"
NETWORK="${STELLAR_NETWORK:-testnet}"
cd "$(dirname "$0")/../contracts"

if ! stellar keys address "$SOURCE_ACCOUNT" >/dev/null 2>&1; then
  echo "→ Creating + funding identity '$SOURCE_ACCOUNT' via Friendbot"
  stellar keys generate "$SOURCE_ACCOUNT" --network "$NETWORK" --fund
fi

echo "→ Building"
stellar contract build

WASM="target/wasm32v1-none/release/milevault_escrow.wasm"
echo "→ Deploying $WASM to $NETWORK"
CONTRACT_ID=$(stellar contract deploy --wasm "$WASM" --source-account "$SOURCE_ACCOUNT" --network "$NETWORK" --alias milevault-escrow)

echo
echo "✓ Deployed: $CONTRACT_ID"
echo "  Explorer: https://stellar.expert/explorer/testnet/contract/$CONTRACT_ID"
echo "  Set ESCROW_CONTRACT_ID / NEXT_PUBLIC_ESCROW_CONTRACT_ID to this value,"
echo "  and INDEXER_START_LEDGER to the current ledger for the API indexer."
