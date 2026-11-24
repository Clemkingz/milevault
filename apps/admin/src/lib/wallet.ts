"use client";

import { env } from "./env";
import { mock } from "./backend";

/** Wallets offered on the sign-in screen → Stellar Wallets Kit module ids */
export const WALLETS = [
  { name: "Freighter", id: "varial" },
  { name: "xBull", id: "xbull" },
  { name: "Albedo", id: "albedo" },
  { name: "LOBSTR", id: "lobstr" },
  { name: "Hana", id: "hana" },
] as const;
export type WalletName = (typeof WALLETS)[number]["name"];

export class WalletDeclined extends Error { constructor() { super("Declined in the wallet"); } }

let kitReady: Promise<typeof import("@creit.tech/stellar-wallets-kit")> | null = null;
function kit() {
  kitReady ??= (async () => {
    const m = await import("@creit.tech/stellar-wallets-kit");
    const { defaultModules } = await import("@creit.tech/stellar-wallets-kit/modules/utils");
    m.StellarWalletsKit.init({ modules: defaultModules(), network: env.network === "mainnet" || env.network === "public" ? m.Networks.PUBLIC : m.Networks.TESTNET });
    return m;
  })();
  return kitReady;
}
/**
 * Wallet errors arrive as Error instances or plain `{ code, message }` objects (Freighter rejects
 * with code -4). Treat any user rejection as "declined"; anything else is a real failure.
 */
const declined = (e: unknown) => {
  const o = (e && typeof e === "object" ? e : {}) as { code?: unknown; message?: unknown; error?: { code?: unknown; message?: unknown } };
  const code = o.code ?? o.error?.code;
  const msg = String((e instanceof Error ? e.message : o.message ?? o.error?.message) ?? e);
  return code === -4 || /declin|reject|denied|cancel|closed|dismiss/i.test(msg) ? new WalletDeclined() : e instanceof Error ? e : new Error(msg === "[object Object]" ? "The wallet returned an error." : msg);
};

/** Demo mode signs instantly for the chosen demo address; live mode uses the real wallet. */
export const wallet = {
  async connect(name: WalletName, demoAddress?: string): Promise<{ address: string; networkPassphrase: string | null }> {
    if (mock) return { address: demoAddress!, networkPassphrase: null };
    const m = await kit();
    try {
      m.StellarWalletsKit.setWallet(WALLETS.find((w) => w.name === name)!.id);
      const { address } = await m.StellarWalletsKit.fetchAddress();
      const net = await m.StellarWalletsKit.getNetwork().catch(() => null);
      return { address, networkPassphrase: net?.networkPassphrase ?? null };
    } catch (e) { throw declined(e); }
  },
  async sign(xdr: string, opts: { networkPassphrase: string; address: string }): Promise<string> {
    if (mock) return mock.sign(xdr);
    const m = await kit();
    try { return (await m.StellarWalletsKit.signTransaction(xdr, opts)).signedTxXdr; }
    catch (e) { throw declined(e); }
  },
  async disconnect() { if (!mock) { const m = await kit(); await m.StellarWalletsKit.disconnect().catch(() => undefined); } },
};
