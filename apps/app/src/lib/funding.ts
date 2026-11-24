"use client";

import type { EscrowConfig } from "@milevault/api";
import { mock } from "./backend";
import { env } from "./env";
import { wallet } from "./wallet";

/**
 * Wallet readiness actions (docs/FRONTEND_INTEGRATION.md §6). The backend has no trustline
 * endpoint, so adding a trustline is the one transaction the frontend builds and submits itself.
 * Demo mode uses the mock backend's stand-ins instead of Stellar.
 */
export async function addTrustline(address: string, config: EscrowConfig, horizonUrl = env.horizonUrl, onRequested?: () => void) {
  const [code, issuer] = config.asset.split(":");
  if (mock) {
    await wallet.sign(`MOCKTRUST.${address}`, { networkPassphrase: config.networkPassphrase, address, purpose: "action", title: `Enable ${code}`, fn: "change_trust", rows: [["Asset", `${code}`], ["Issuer", `${issuer!.slice(0, 4)}…${issuer!.slice(-4)}`], ["Network fee", "≈ 0.00001 XLM"]] });
    mock.addTrustline(address);
    return;
  }
  const { Asset, BASE_FEE, Horizon, Operation, TransactionBuilder } = await import("@stellar/stellar-sdk");
  const server = new Horizon.Server(horizonUrl);
  const tx = new TransactionBuilder(await server.loadAccount(address), { fee: BASE_FEE, networkPassphrase: config.networkPassphrase })
    .addOperation(Operation.changeTrust({ asset: new Asset(code!, issuer!) }))
    .setTimeout(120)
    .build();
  const signed = await wallet.sign(tx.toXDR(), { networkPassphrase: config.networkPassphrase, address, purpose: "action", title: `Enable ${code}`, fn: "change_trust", onRequested });
  await server.submitTransaction(TransactionBuilder.fromXDR(signed, config.networkPassphrase));
}

/** Testnet XLM from Friendbot (activates the account) */
export async function fundWithFriendbot(address: string) {
  if (mock) { await new Promise((r) => setTimeout(r, 700)); mock.friendbot(address); return; }
  const res = await fetch(`https://friendbot.stellar.org/?addr=${encodeURIComponent(address)}`);
  if (!res.ok && res.status !== 400) throw new Error("Friendbot didn’t respond. Try again in a moment.");
}

export const CIRCLE_FAUCET = "https://faucet.circle.com";
/** Test USDC: Circle's faucet in live mode (select Stellar Testnet); instant in demo mode */
export async function getTestUsdc(address: string) {
  if (mock) { await new Promise((r) => setTimeout(r, 500)); mock.faucet(address, 1000); return true; }
  window.open(CIRCLE_FAUCET, "_blank", "noopener");
  return false;
}
