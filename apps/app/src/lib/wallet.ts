"use client";

import { env } from "./env";
import { mock } from "./backend";
import { useUI } from "./ui";

export type WalletName = "Freighter" | "xBull" | "Albedo" | "LOBSTR" | "Hana" | "WalletConnect";
/** Wallets offered in the connect dialog (design order) → Stellar Wallets Kit module ids.
 *  "varial" is the kit's module id for Freighter. WalletConnect needs a Reown project ID. */
export const WALLETS: readonly { name: WalletName; id: string }[] = [
  { name: "Freighter", id: "varial" },
  { name: "xBull", id: "xbull" },
  { name: "Albedo", id: "albedo" },
  { name: "LOBSTR", id: "lobstr" },
  { name: "Hana", id: "hana" },
  ...(env.walletConnectProjectId ? [{ name: "WalletConnect" as const, id: "wallet_connect" }] : []),
];

export class WalletDeclined extends Error { constructor() { super("Declined in the wallet"); } }
/** The wallet's active account isn't the signed-in one (guide §5: compare before every signature) */
export class WalletMismatch extends Error { constructor(public active: string) { super("The wallet switched to another account"); } }

/* ---------- real wallets (Stellar Wallets Kit) ---------- */
let kitReady: Promise<typeof import("@creit.tech/stellar-wallets-kit")> | null = null;
/** The WalletConnect module starts its relay client in the background; wait for it before use. */
let wcModule: { isAvailable: () => Promise<boolean> } | null = null;
async function wcReady(timeoutMs = 15_000) {
  for (const end = Date.now() + timeoutMs; Date.now() < end; await new Promise((r) => setTimeout(r, 250)))
    if (wcModule && (await wcModule.isAvailable())) return;
  throw new Error("WalletConnect couldn’t start. Check the Reown project ID and that this domain is allowed in Reown.");
}
function kit() {
  kitReady ??= (async () => {
    const m = await import("@creit.tech/stellar-wallets-kit");
    const { defaultModules } = await import("@creit.tech/stellar-wallets-kit/modules/utils");
    const mainnet = env.network === "mainnet" || env.network === "public";
    const modules = defaultModules();
    if (env.walletConnectProjectId) {
      const wc = await import("@creit.tech/stellar-wallets-kit/modules/wallet-connect");
      const origin = window.location.origin;
      modules.push(wcModule = new wc.WalletConnectModule({
        projectId: env.walletConnectProjectId,
        metadata: { name: "MileVault", description: "Milestone escrow payments on Stellar", url: origin, icons: [`${origin}/app/icon.svg`] },
        allowedChains: [mainnet ? wc.WalletConnectTargetChain.PUBLIC : wc.WalletConnectTargetChain.TESTNET],
      }));
    }
    m.StellarWalletsKit.init({ modules, network: mainnet ? m.Networks.PUBLIC : m.Networks.TESTNET });
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

/**
 * Wallet adapter. Demo mode signs with a simulated wallet popup (mock backend accepts it);
 * live mode uses the real extension/app via Stellar Wallets Kit.
 */
export const wallet = {
  async connect(name: WalletName, demoAddress?: string): Promise<{ address: string; networkPassphrase: string | null }> {
    if (mock) {
      await useUI.getState().walletPrompt({ kind: "connect", wallet: name });
      return { address: demoAddress!, networkPassphrase: useUI.getState().demoWrongNetwork ? "Public Global Stellar Network ; September 2015" : null };
    }
    const m = await kit();
    const id = WALLETS.find((w) => w.name === name)!.id;
    try {
      m.StellarWalletsKit.setWallet(id);
      if (name === "WalletConnect") await wcReady();
      const { address } = await m.StellarWalletsKit.fetchAddress();
      const net = await m.StellarWalletsKit.getNetwork().catch(() => null);
      return { address, networkPassphrase: net?.networkPassphrase ?? null };
    } catch (e) { throw declined(e); }
  },
  /** Ask the wallet to sign (never submit) a transaction XDR */
  async sign(xdr: string, opts: { networkPassphrase: string; address: string; purpose: "signin" | "action"; title?: string; rows?: [string, string][]; fn?: string }): Promise<string> {
    if (mock) {
      await useUI.getState().walletPrompt({ kind: "sign", ...opts });
      return mock.sign(xdr);
    }
    const m = await kit();
    if (opts.purpose === "action") {
      const active = await m.StellarWalletsKit.fetchAddress().then((x) => x.address).catch(() => null);
      if (active && active !== opts.address) throw new WalletMismatch(active);
    }
    try { return (await m.StellarWalletsKit.signTransaction(xdr, { networkPassphrase: opts.networkPassphrase, address: opts.address })).signedTxXdr; }
    catch (e) { throw declined(e); }
  },
  async disconnect() { if (!mock) { const m = await kit(); await m.StellarWalletsKit.disconnect().catch(() => undefined); } },
};
