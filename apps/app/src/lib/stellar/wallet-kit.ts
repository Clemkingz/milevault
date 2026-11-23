"use client";

import { Networks, StellarWalletsKit } from "@creit.tech/stellar-wallets-kit";
import { defaultModules } from "@creit.tech/stellar-wallets-kit/modules/utils";
import { env } from "../env";

/**
 * Stellar Wallets Kit v2 (static API). Supports Freighter, xBull, Albedo, Lobstr, Hana, …
 * Initialised once on the client; every call below is browser-only.
 */
let initialised = false;

export function initWalletKit() {
  if (initialised || typeof window === "undefined") return;
  StellarWalletsKit.init({
    modules: defaultModules(),
    network: env.network === "public" ? Networks.PUBLIC : Networks.TESTNET,
  });
  initialised = true;
}

/** Opens the kit's wallet picker and returns the connected public key. */
export async function connectWallet(): Promise<string> {
  initWalletKit();
  const { address } = await StellarWalletsKit.authModal();
  return address;
}

export async function disconnectWallet() {
  initWalletKit();
  await StellarWalletsKit.disconnect();
}

/** Signs a transaction XDR with the connected wallet (used by the contract client). */
export async function signTransaction(xdr: string, address: string) {
  initWalletKit();
  return StellarWalletsKit.signTransaction(xdr, {
    networkPassphrase: env.networkPassphrase,
    address,
  });
}

export { StellarWalletsKit };
