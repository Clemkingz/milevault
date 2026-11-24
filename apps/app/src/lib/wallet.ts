"use client";

import { env } from "./env";
import { mock } from "./backend";
import { useSession } from "./session";
import { useUI } from "./ui";

export class WalletDeclined extends Error { constructor() { super("Declined in the wallet"); } }
/** The wallet's active account isn't the signed-in one (guide §5: compare before every signature) */
export class WalletMismatch extends Error { constructor(public active: string) { super("The wallet switched to another account"); } }
/** A browser-extension wallet that isn't installed in this browser */
export class WalletNotInstalled extends Error { constructor(public wallet: string, public install?: string) { super(`${wallet} isn’t installed in this browser.`); } }

export type WalletName = "Freighter" | "Freighter Mobile" | "xBull" | "Albedo" | "LOBSTR" | "Hana" | "WalletConnect";
type Kind = "extension" | "web" | "app" | "qr";
export interface WalletOption { name: WalletName; module: string; kind: Kind; icon: string; install?: string; deepLink?: string }

/** Every wallet MileVault can use. "varial" is the kit's id for Freighter (renamed Varial). */
const OPTIONS: Record<WalletName, WalletOption> = {
  Freighter: { name: "Freighter", module: "varial", kind: "extension", icon: "wl-freighter", install: "https://www.freighter.app/" },
  // Freighter's phone app, over WalletConnect. Deep link from the Reown registry (AppKit's format).
  "Freighter Mobile": { name: "Freighter Mobile", module: "wallet_connect", kind: "app", icon: "wl-freighter", deepLink: "freighterwallet://wc-redirect", install: "https://www.freighter.app/" },
  xBull: { name: "xBull", module: "xbull", kind: "web", icon: "wl-xbull" },
  Albedo: { name: "Albedo", module: "albedo", kind: "web", icon: "wl-albedo" },
  LOBSTR: { name: "LOBSTR", module: "lobstr", kind: "extension", icon: "wl-lobstr", install: "https://lobstr.co/signer-extension/" },
  Hana: { name: "Hana", module: "hana", kind: "extension", icon: "wl-hana", install: "https://hanawallet.io/" },
  WalletConnect: { name: "WalletConnect", module: "wallet_connect", kind: "qr", icon: "wl-walletconnect" },
};
/** Kept for callers that list names (demo mode, admin parity) */
export const WALLETS = Object.values(OPTIONS);
export const walletIcon = (name?: string | null) => OPTIONS[name as WalletName]?.icon ?? "wl-freighter";
export const walletKind = (name?: string | null): Kind => OPTIONS[name as WalletName]?.kind ?? "extension";
/** How a wallet is named in the picker */
export const walletLabel = (name: WalletName, mobile: boolean) =>
  name === "Freighter Mobile" ? "Freighter app" : name === "WalletConnect" ? (mobile ? "Other wallet app" : "Phone wallet (QR code)") : name;
const isWc = (name: WalletName) => OPTIONS[name].module === "wallet_connect";

const MAINNET = env.network === "mainnet" || env.network === "public";
/** Reown registry ids of Stellar wallets that speak WalletConnect (LOBSTR's app is Mainnet-only) */
const WC_WALLETS = { varial: "997a355c8f682468706a76cff1b004a7115f505fb962dac54b6e9b442dd1c380", lobstr: "76a3d548a08cf402f5c7d021f24fd2881d767084b387a5325df88bc3d4b6f21b", scopuly: "9c78aee7d8a771255942334d06d2cbab89e2178ee49fee4ea3b6c78032fcac76" };

/* ---------- device detection ---------- */
export function device() {
  if (typeof window === "undefined") return { mobile: false, inFreighterApp: false };
  const ua = navigator.userAgent;
  const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|Opera Mini/i.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua));
  const st = (window as unknown as { stellar?: { provider?: string; platform?: string } }).stellar;
  return { mobile, inFreighterApp: !!st && (st.provider === "freighter" || st.provider === "varial") && st.platform === "mobile" };
}

export interface WalletChoice { option: WalletOption; available: boolean; note: string }
/**
 * What to offer on this device. Desktop: browser extensions (detected live) and web wallets,
 * plus a QR code for phone wallets. Phone: wallet apps over WalletConnect and web wallets;
 * extensions can't exist there, unless we're inside a wallet's own in-app browser.
 */
export async function walletChoices(): Promise<{ mobile: boolean; list: WalletChoice[]; footnote?: string }> {
  const { mobile, inFreighterApp } = device();
  const wc = !!env.walletConnectProjectId;
  const avail = mock ? async () => true : async (name: WalletName) => {
    const mod = (await kit(), mods[OPTIONS[name].module]);
    return mod ? Promise.race([mod.isAvailable().catch(() => false), new Promise<boolean>((r) => setTimeout(() => r(false), 2500))]) : false;
  };
  const pick = (name: WalletName, available: boolean, note: string): WalletChoice => ({ option: OPTIONS[name], available, note });
  if (mobile) {
    if (inFreighterApp && wc) return { mobile, list: [pick("Freighter Mobile", true, "You’re in the Freighter app")] };
    const hana = await avail("Hana"); // Hana's in-app browser injects its wallet
    const list = [
      ...(wc ? [pick("Freighter Mobile", true, "Opens the Freighter app")] : []),
      ...(hana && !mock ? [pick("Hana", true, "Detected in this browser")] : []),
      pick("Albedo", true, "Web wallet · works in this browser"),
      pick("xBull", true, "Web wallet · works in this browser"),
      ...(wc ? [pick("WalletConnect", true, MAINNET ? "LOBSTR, Scopuly and other wallet apps" : "Scopuly and other wallet apps")] : []),
    ];
    const footnote = !wc ? "Wallet apps need WalletConnect, which isn’t set up for this site." : !MAINNET ? "LOBSTR’s app connects on Mainnet only, so it can’t be used on Testnet." : undefined;
    return { mobile, list, footnote };
  }
  const [fr, lo, ha] = await Promise.all([avail("Freighter"), avail("LOBSTR"), avail("Hana")]);
  const ext = [pick("Freighter", fr, fr ? "Detected" : "Not installed"), pick("LOBSTR", lo, lo ? "Detected" : "Not installed"), pick("Hana", ha, ha ? "Detected" : "Not installed")];
  const list = [
    ...ext.filter((x) => x.available),
    pick("xBull", true, "Extension or web wallet"),
    pick("Albedo", true, "Web wallet · no install"),
    ...ext.filter((x) => !x.available),
    ...(wc ? [pick("WalletConnect", true, "Scan with Freighter Mobile on your phone")] : []),
  ];
  return { mobile, list };
}

/* ---------- real wallets (Stellar Wallets Kit) ---------- */
type KitModule = { isAvailable: () => Promise<boolean> };
const mods: Record<string, KitModule> = {};
let kitReady: Promise<typeof import("@creit.tech/stellar-wallets-kit")> | null = null;
/** Set right before connecting "Freighter Mobile": the next WalletConnect URI opens that app */
let deepLinkNext: string | null = null;
/** AppKit's native-link format: `scheme://path/wc?uri=…` */
const appLink = (app: string, uri?: string) => {
  let base = app.includes("://") ? app : `${app.replace(/[/:]/g, "")}://`;
  if (!base.endsWith("/")) base += "/";
  return uri ? `${base}wc?uri=${encodeURIComponent(uri)}` : base;
};
/** The WalletConnect module starts its relay client in the background; wait for it before use. */
async function wcReady(timeoutMs = 15_000) {
  for (const end = Date.now() + timeoutMs; Date.now() < end; await new Promise((r) => setTimeout(r, 250)))
    if (mods.wallet_connect && (await mods.wallet_connect.isAvailable())) return;
  throw new Error("WalletConnect couldn’t start. Check the Reown project ID and that this domain is allowed in Reown.");
}
function kit() {
  kitReady ??= (async () => {
    const m = await import("@creit.tech/stellar-wallets-kit");
    const { defaultModules } = await import("@creit.tech/stellar-wallets-kit/modules/utils");
    const modules = defaultModules();
    if (env.walletConnectProjectId) {
      const wc = await import("@creit.tech/stellar-wallets-kit/modules/wallet-connect");
      const origin = window.location.origin;
      const ids = MAINNET ? [WC_WALLETS.varial, WC_WALLETS.lobstr, WC_WALLETS.scopuly] : [WC_WALLETS.varial, WC_WALLETS.scopuly];
      const mod = new wc.WalletConnectModule({
        projectId: env.walletConnectProjectId,
        metadata: { name: "MileVault", description: "Milestone escrow payments on Stellar", url: origin, icons: [`${origin}/app/icon.svg`] },
        allowedChains: [MAINNET ? wc.WalletConnectTargetChain.PUBLIC : wc.WalletConnectTargetChain.TESTNET],
        // Only list wallet apps that support this Stellar network (not hundreds of EVM wallets)
        appKitOptions: { featuredWalletIds: ids, includeWalletIds: ids } as never,
      });
      // Deep-link straight into the chosen app when it asks for a pairing URI
      const modal = (mod as unknown as { modal: { open: (o?: { uri?: string }) => unknown } }).modal;
      const open = modal.open.bind(modal);
      modal.open = (o) => { if (o?.uri && deepLinkNext) { const link = appLink(deepLinkNext, o.uri); deepLinkNext = null; window.location.href = link; } return open(o); };
      modules.push(mod);
    }
    for (const x of modules) mods[(x as unknown as { productId: string }).productId] = x as unknown as KitModule;
    m.StellarWalletsKit.init({ modules, network: MAINNET ? m.Networks.PUBLIC : m.Networks.TESTNET });
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
    const opt = OPTIONS[name];
    if (opt.kind === "extension" && !(await mods[opt.module]?.isAvailable().catch(() => false)))
      throw new WalletNotInstalled(name, opt.install);
    try {
      m.StellarWalletsKit.setWallet(opt.module);
      if (isWc(name)) { await wcReady(); deepLinkNext = device().mobile ? opt.deepLink ?? null : null; }
      const { address } = await m.StellarWalletsKit.fetchAddress();
      const net = await m.StellarWalletsKit.getNetwork().catch(() => null);
      return { address, networkPassphrase: net?.networkPassphrase ?? null };
    } catch (e) { throw declined(e); }
  },
  /** Ask the wallet to sign (never submit) a transaction XDR */
  async sign(xdr: string, opts: { networkPassphrase: string; address: string; purpose: "signin" | "action"; title?: string; rows?: [string, string][]; fn?: string; wallet?: string }): Promise<string> {
    if (mock) {
      await useUI.getState().walletPrompt({ kind: "sign", ...opts });
      return mock.sign(xdr);
    }
    const m = await kit();
    const name = (opts.wallet ?? useSession.getState().walletId ?? "Freighter") as WalletName, opt = OPTIONS[name] ?? OPTIONS.Freighter;
    m.StellarWalletsKit.setWallet(opt.module);
    if (isWc(name)) await wcReady();
    // Only extensions can report their active account silently; asking WalletConnect or a web
    // wallet would start a new pairing or open a popup.
    if (opts.purpose === "action" && opt.kind === "extension") {
      const active = await m.StellarWalletsKit.fetchAddress().then((x) => x.address).catch(() => null);
      if (active && active !== opts.address) throw new WalletMismatch(active);
    }
    // On a phone, bring the wallet app forward so the request is waiting there
    if (opt.deepLink && device().mobile) setTimeout(() => { window.location.href = appLink(opt.deepLink!); }, 400);
    try { return (await m.StellarWalletsKit.signTransaction(xdr, { networkPassphrase: opts.networkPassphrase, address: opts.address })).signedTxXdr; }
    catch (e) { throw declined(e); }
  },
  async disconnect() { if (!mock) { const m = await kit(); await m.StellarWalletsKit.disconnect().catch(() => undefined); } },
};
