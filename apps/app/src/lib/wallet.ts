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

export type WalletName = "Varial" | "xBull" | "Albedo" | "LOBSTR" | "Hana" | "WalletConnect";
type Kind = "extension" | "web" | "app" | "qr";
export interface WalletOption { name: WalletName; module: string; kind: Kind; icon: string; install?: string; deepLink?: string;
  /** How to reach this wallet on a phone (its app), when that differs from desktop (its extension) */
  mobile?: { module: string; kind: Kind; deepLink: string } }

/** Every wallet MileVault can use. Varial (formerly Freighter) is one entry with two transports. */
const OPTIONS: Record<WalletName, WalletOption> = {
  Varial: {
    name: "Varial", module: "varial", kind: "extension", icon: "wl-freighter", install: "https://varialwallet.com",
    // On a phone (or inside Varial's in-app browser) the extension can't exist: use the app over
    // WalletConnect. Deep link from the Reown registry, in AppKit's format.
    mobile: { module: "wallet_connect", kind: "app", deepLink: "freighterwallet://wc-redirect" },
  },
  xBull: { name: "xBull", module: "xbull", kind: "web", icon: "wl-xbull" },
  Albedo: { name: "Albedo", module: "albedo", kind: "web", icon: "wl-albedo" },
  LOBSTR: { name: "LOBSTR", module: "lobstr", kind: "extension", icon: "wl-lobstr", install: "https://lobstr.co/signer-extension/" },
  Hana: { name: "Hana", module: "hana", kind: "extension", icon: "wl-hana", install: "https://hanawallet.io/" },
  WalletConnect: { name: "WalletConnect", module: "wallet_connect", kind: "qr", icon: "wl-walletconnect" },
};
/** Kept for callers that list names (demo mode, admin parity) */
export const WALLETS = Object.values(OPTIONS);
/** Older sessions stored "Freighter"; treat it as Varial */
const optionOf = (name?: string | null) => OPTIONS[(name === "Freighter" || name === "Freighter Mobile" ? "Varial" : name) as WalletName] ?? OPTIONS.Varial;
/** The transport this wallet uses on this device: Varial is the extension on desktop, the app on a phone */
export function resolve(name?: string | null): WalletOption {
  const o = optionOf(name); const d = device();
  return o.mobile && (d.mobile || d.inFreighterApp) && env.walletConnectProjectId ? { ...o, ...o.mobile } : o;
}
export const walletIcon = (name?: string | null) => optionOf(name).icon;
export const walletKind = (name?: string | null): Kind => resolve(name).kind;
/** How a wallet is named in the picker */
export const walletLabel = (name: WalletName, mobile: boolean) =>
  name === "WalletConnect" ? (mobile ? "Other wallet app" : "Phone wallet (QR code)") : name;
const isWc = (name: WalletName) => resolve(name).module === "wallet_connect";

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
    const mod = (await kit(), mods[resolve(name).module]);
    return mod ? Promise.race([mod.isAvailable().catch(() => false), new Promise<boolean>((r) => setTimeout(() => r(false), 2500))]) : false;
  };
  const pick = (name: WalletName, available: boolean, note: string): WalletChoice => ({ option: OPTIONS[name], available, note });
  if (mobile) {
    if (inFreighterApp && wc) return { mobile, list: [pick("Varial", true, "You’re in the Varial app")] };
    const hana = await avail("Hana"); // Hana's in-app browser injects its wallet
    const list = [
      ...(wc ? [pick("Varial", true, "Opens the Varial app · formerly Freighter")] : []),
      ...(hana && !mock ? [pick("Hana", true, "Detected in this browser")] : []),
      pick("Albedo", true, "Web wallet · works in this browser"),
      pick("xBull", true, "Web wallet · works in this browser"),
      ...(wc ? [pick("WalletConnect", true, MAINNET ? "LOBSTR, Scopuly and other wallet apps" : "Scopuly and other wallet apps")] : []),
    ];
    const footnote = !wc ? "Wallet apps need WalletConnect, which isn’t set up for this site." : !MAINNET ? "LOBSTR’s app connects on Mainnet only, so it can’t be used on Testnet." : undefined;
    return { mobile, list, footnote };
  }
  const [fr, lo, ha] = await Promise.all([avail("Varial"), avail("LOBSTR"), avail("Hana")]);
  const ext = [pick("Varial", fr, fr ? "Detected · browser extension" : "Not installed · formerly Freighter"), pick("LOBSTR", lo, lo ? "Detected" : "Not installed"), pick("Hana", ha, ha ? "Detected" : "Not installed")];
  const list = [
    ...ext.filter((x) => x.available),
    pick("xBull", true, "Extension or web wallet"),
    pick("Albedo", true, "Web wallet · no install"),
    ...ext.filter((x) => !x.available),
    ...(wc ? [pick("WalletConnect", true, "Scan with the Varial app on your phone")] : []),
  ];
  return { mobile, list };
}

/* ---------- real wallets (Stellar Wallets Kit) ---------- */
type KitModule = { isAvailable: () => Promise<boolean> };
const mods: Record<string, KitModule> = {};
let kitReady: Promise<typeof import("@creit.tech/stellar-wallets-kit")> | null = null;
/** Set right before connecting Varial on a phone: the next WalletConnect URI opens the Varial app */
let deepLinkNext: string | null = null;
let quietPairing = false;
/** The latest pairing link, so "Open Varial" can resend it if the first switch didn't happen */
let lastPairingUri: string | null = null;

/* ---------- phone: pair ahead of the tap ----------
 * Phone browsers only let a page open another app inside a user tap (a few seconds at most).
 * Loading the kit and WalletConnect takes longer than that on a phone, so the pairing link is
 * prepared as soon as the wallet picker opens, and the tap opens Varial synchronously. */
type WcSession = { topic: string; namespaces: Record<string, { accounts: string[] }> };
let prepared: { uri: string; approval: () => Promise<WcSession>; at: number } | null = null;
let preparing: Promise<void> | null = null;
const WC_METHODS = ["stellar_signXDR", "stellar_signAndSubmitXDR", "stellar_signMessage", "stellar_signAuthEntry"];
export function preparePhonePairing() {
  if (mock || !env.walletConnectProjectId || !device().mobile) return;
  if (prepared && Date.now() - prepared.at < 4 * 60_000) return; // proposals expire after 5 minutes
  preparing ??= (async () => {
    await kit(); await wcReady();
    const client = (mods.wallet_connect as unknown as { signClient: { connect: (o: unknown) => Promise<{ uri?: string; approval: () => Promise<WcSession> }> } }).signClient;
    quietPairing = true;
    try {
      const { uri, approval } = await client.connect({ optionalNamespaces: { stellar: { methods: WC_METHODS, chains: [MAINNET ? "stellar:pubnet" : "stellar:testnet"], events: [] } } });
      if (uri) prepared = { uri, approval, at: Date.now() };
    } finally { quietPairing = false; }
  })().catch((e) => console.error("[MileVault] couldn’t prepare the WalletConnect pairing:", e)).finally(() => { preparing = null; });
}
/** Call synchronously inside the tap: opens the wallet app with the prepared pairing link. */
export function openAppForPairing(name: WalletName): boolean {
  const o = resolve(name);
  if (o.kind !== "app" || !o.deepLink || !prepared) return false;
  lastPairingUri = prepared.uri;
  window.location.href = appLink(o.deepLink, prepared.uri);
  return true;
}
/**
 * Call synchronously inside a tap: brings the wallet app forward so a pending request is waiting
 * there. While still pairing, it resends the pairing link.
 */
export function openWalletApp(name?: string | null, { pairing = false } = {}): boolean {
  const o = resolve(name);
  if (o.kind !== "app" || !o.deepLink) return false;
  window.location.href = appLink(o.deepLink, pairing ? lastPairingUri ?? undefined : undefined);
  return true;
}
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
    // Only the wallets MileVault offers. (The kit's defaultModules() would also load MetaMask and
    // others: a bigger download on phones, and the MetaMask adapter times out on every load.)
    const [{ VarialModule }, { xBullModule }, { AlbedoModule }, { LobstrModule }, { HanaModule }] = await Promise.all([
      import("@creit.tech/stellar-wallets-kit/modules/varial"), import("@creit.tech/stellar-wallets-kit/modules/xbull"),
      import("@creit.tech/stellar-wallets-kit/modules/albedo"), import("@creit.tech/stellar-wallets-kit/modules/lobstr"),
      import("@creit.tech/stellar-wallets-kit/modules/hana"),
    ]);
    const modules: unknown[] = [new VarialModule(), new xBullModule(), new AlbedoModule(), new LobstrModule(), new HanaModule()];
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
      modal.open = (o) => {
        if (o?.uri && quietPairing) return; // pairing prepared in the background for a phone: no QR modal
        if (o?.uri) lastPairingUri = o.uri;
        if (o?.uri && deepLinkNext) { const link = appLink(deepLinkNext, o.uri); deepLinkNext = null; window.location.href = link; }
        return open(o);
      };
      modules.push(mod);
    }
    for (const x of modules) mods[(x as unknown as { productId: string }).productId] = x as unknown as KitModule;
    m.StellarWalletsKit.init({ modules: modules as never, network: MAINNET ? m.Networks.PUBLIC : m.Networks.TESTNET });
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
    const opt = resolve(name);
    if (opt.kind === "extension" && !(await mods[opt.module]?.isAvailable().catch(() => false)))
      throw new WalletNotInstalled(name, opt.install);
    if (opt.kind === "app" && prepared) {
      const p = prepared; prepared = null;
      try {
        const session = await p.approval(); // resolves when the user approves in the wallet app
        const address = session.namespaces.stellar!.accounts[0]!.split(":")[2]!;
        const st = await import("@creit.tech/stellar-wallets-kit/state");
        st.wcSessionPaths.value = [...st.wcSessionPaths.value, { publicKey: address, topic: session.topic }];
        m.StellarWalletsKit.setWallet(opt.module); st.activeAddress.value = address;
        return { address, networkPassphrase: null };
      } catch (e) { throw declined(e); }
    }
    try {
      m.StellarWalletsKit.setWallet(opt.module);
      if (isWc(name)) { await wcReady(); deepLinkNext = device().mobile ? opt.deepLink ?? null : null; }
      const { address } = await m.StellarWalletsKit.fetchAddress();
      const net = await m.StellarWalletsKit.getNetwork().catch(() => null);
      return { address, networkPassphrase: net?.networkPassphrase ?? null };
    } catch (e) { throw declined(e); }
  },
  /** Ask the wallet to sign (never submit) a transaction XDR */
  async sign(xdr: string, opts: { networkPassphrase: string; address: string; purpose: "signin" | "action"; title?: string; rows?: [string, string][]; fn?: string; wallet?: string; onRequested?: () => void }): Promise<string> {
    if (mock) {
      await useUI.getState().walletPrompt({ kind: "sign", ...opts });
      return mock.sign(xdr);
    }
    const m = await kit();
    const name = (opts.wallet ?? useSession.getState().walletId ?? "Varial") as WalletName, opt = resolve(name);
    m.StellarWalletsKit.setWallet(opt.module);
    if (isWc(name)) await wcReady();
    // Only extensions can report their active account silently; asking WalletConnect or a web
    // wallet would start a new pairing or open a popup.
    if (opts.purpose === "action" && opt.kind === "extension") {
      const active = await m.StellarWalletsKit.fetchAddress().then((x) => x.address).catch(() => null);
      if (active && active !== opts.address) throw new WalletMismatch(active);
    }
    // Phones: the request is sent first; the user then taps "Open Varial" (a browser only lets a page
    // switch apps inside a tap, and switching suspends the page before it could send anything).
    try {
      // Tell the UI once the request has actually left: for WalletConnect that's the relay's publish
      // event (a phone page is suspended the moment the user switches apps).
      let told = false; const tell = () => { if (!told) { told = true; opts.onRequested?.(); } };
      const relay = isWc(name) ? (mods.wallet_connect as unknown as { signClient?: { core?: { relayer?: { events?: { once: (e: string, f: () => void) => void } } } } }).signClient?.core?.relayer?.events : undefined;
      relay?.once("relayer_publish", tell);
      const pending = m.StellarWalletsKit.signTransaction(xdr, { networkPassphrase: opts.networkPassphrase, address: opts.address });
      setTimeout(tell, relay ? 4000 : 150);
      return (await pending).signedTxXdr;
    }
    catch (e) { throw declined(e); }
  },
  async disconnect() { if (!mock) { const m = await kit(); await m.StellarWalletsKit.disconnect().catch(() => undefined); } },
};
