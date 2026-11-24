"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { shortAddr } from "@milevault/api";
import { Icon } from "@milevault/ui";
import { KV, Note } from "../bits";
import { imgUrl } from "../art";
import { usePwa } from "../pwa/install";
import { signIn, signOut } from "@/lib/auth";
import { env } from "@/lib/env";
import { useSession } from "@/lib/session";
import { useUI, type Modal } from "@/lib/ui";
import { device, openAppForPairing, openWalletApp, preparePhonePairing, walletChoices, walletIcon, walletKind, walletLabel, WalletDeclined } from "@/lib/wallet";
import { FB, Foot, Head, HeroDlg, WalletRow } from "./parts";
import { ActionDialog, ConfirmDialog } from "./tx";

function InstallDialog() {
  const { platform } = usePwa();
  const steps: Record<string, string[]> = {
    ios: ["Tap the Share button in Safari’s toolbar", "Choose “Add to Home Screen”", "Tap Add — MileVault opens like an app"],
    "safari-mac": ["In Safari, open the File menu (or Share)", "Choose “Add to Dock…”", "Click Add — MileVault opens in its own window"],
    android: ["Open your browser menu (⋮)", "Tap “Install app” or “Add to Home screen”", "Confirm — it lands on your home screen"],
    desktop: ["Look for the install icon at the right of the address bar", "Or open the browser menu → “Install MileVault…”", "Confirm — it opens in its own window"],
  };
  return (
    <HeroDlg k="W-08">
      <Head title="Install MileVault">It opens in its own window, loads instantly and shows an offline screen when you lose connection.</Head>
      <ol className="isteps">{steps[platform]!.map((t, i) => <li key={i}><span className="seq">{i + 1}</span>{t}</li>)}</ol>
      <Note icon="lock">Installing doesn’t change anything about your wallet or keys.</Note>
      <Foot><FB v="pri" onClick={useUI.getState().close}>Got it</FB></Foot>
    </HeroDlg>
  );
}

/**
 * Wallet picker that adapts to the device: on desktop it detects installed extensions (and links
 * to install the rest); on a phone it offers wallet apps over WalletConnect and web wallets.
 */
function WalletPicker({ sw }: { sw?: boolean }) {
  const [state, setState] = useState<Awaited<ReturnType<typeof walletChoices>> | null>(null);
  useEffect(() => {
    let on = true;
    preparePhonePairing(); // phones: have the Varial pairing link ready before the tap
    walletChoices().then((r) => on && setState(r)).catch(() => on && setState({ mobile: device().mobile, list: [] }));
    return () => { on = false; };
  }, []);
  const mobile = state?.mobile ?? device().mobile;
  return (
    <HeroDlg k="W-01">
      <Head title={sw ? "Switch wallet" : "Connect a wallet"}>
        {mobile ? "Pick the Stellar wallet you use on this phone. You’ll approve the connection, then one sign-in message. It moves no funds." : "Pick a Stellar wallet. You’ll approve the connection, then one sign-in message. It moves no funds."}
      </Head>
      <div className="wlist mv-list" aria-busy={!state}>
        {!state ? [0, 1, 2].map((i) => <div key={i} className="wopt sk-row"><span className="sk" style={{ width: 40, height: 40, borderRadius: 8 }} /><span className="tx"><span className="sk" style={{ width: 110, height: 14 }} /><span className="sk" style={{ width: 160, height: 12, marginTop: 6 }} /></span></div>)
          : state.list.map(({ option: o, available, note }, i) => (
            <WalletRow key={o.name} name={o.name} label={walletLabel(o.name, mobile)} muted={!available}
              sub={<span className="wsub"><span className={`wstat${available ? (note.startsWith("Detected") || note.startsWith("You’re") ? " ok" : "") : " no"}`}>{note}</span>{i === 0 && available && o.name === "Varial" && <span className="rec">Recommended</span>}</span>}
              right={available ? <Icon name="right" size={20} /> : <span className="winst">Install<Icon name="external" size={14} /></span>}
              onClick={() => {
                if (!available) { if (o.install) window.open(o.install, "_blank", "noopener"); return; }
                openAppForPairing(o.name); // must run inside the tap, before anything async
                void signIn(o.name);
              }} />
          ))}
      </div>
      {state?.footnote && <Note icon="info">{state.footnote}</Note>}
      <Note icon="lock">MileVault only reads your public address. We never see your keys.</Note>
    </HeroDlg>
  );
}

function ModalBody({ md }: { md: Modal }) {
  const ui = useUI.getState();
  const router = useRouter();
  const afterConnect = useUI((s) => s.afterConnect);
  const short = useSession((s) => s.shortAddress);
  switch (md.t) {
    case "connect": return <WalletPicker sw={md.sw} />;
    case "connecting": return (
      <HeroDlg k={md.step === "address" ? "W-02" : "T-02"} className="waiting">
        <Head title={md.step === "address" ? `Waiting for ${md.wallet}` : "Sign in to MileVault"}>
          {md.step === "address"
            ? walletKind(md.wallet) === "app" ? "Approve the connection in the Varial app, then come back to this page. MileVault only asks for your public address."
            : walletKind(md.wallet) === "qr" ? (device().mobile ? "Choose your wallet app and approve the connection, then come back to this page." : "Scan the QR code with the Varial app (or another Stellar wallet app) and approve the connection.")
            : `Approve the connection request in ${md.wallet}. MileVault only asks for your public address.`
            : `Approve the sign-in message in ${walletKind(md.wallet) === "app" ? "the Varial app" : md.wallet}. It proves this wallet is yours; it can’t move funds and is never sent to the network.`}
        </Head>
        <WalletRow name={md.wallet} sub={<small>{md.step === "address" ? "Waiting for approval…" : "Waiting for your signature…"}</small>} right={<Icon name="loading" size={20} color="#2EBEF2" className="spin" />} active />
        <Foot>
          <FB onClick={() => ui.open({ t: "connect" })}>Choose another wallet</FB>
          {walletKind(md.wallet) === "app" && (md.step === "address" || md.requested) && <FB v="pri" onClick={() => openWalletApp(md.wallet, { pairing: md.step === "address" })}>Open {md.wallet}</FB>}
        </Foot>
      </HeroDlg>);
    case "connDeclined": return (
      <HeroDlg k="W-05E" err>
        <Head title="Connection declined">You declined the request in {md.wallet}. Nothing was shared and nothing changed.</Head>
        <Foot><FB onClick={() => ui.open({ t: "connect" })}>Choose another wallet</FB><FB v="pri" onClick={() => void signIn(md.wallet as never)}>Try again</FB></Foot>
      </HeroDlg>);
    case "wrongNetwork": return (
      <HeroDlg k="W-08" err>
        <Head title={`Switch ${md.wallet} to ${md.required.replace("Stellar ", "")}`}>MileVault runs on {md.required}. Your wallet is on a different network, so we didn’t ask it to sign anything. Switch networks in {md.wallet}, then try again.</Head>
        <KV rows={[["Wallet network", md.walletNetwork.split(";")[0]!.trim()], ["MileVault needs", md.required]]} />
        <Foot><FB onClick={ui.close}>Cancel</FB><FB v="pri" onClick={() => { ui.set({ demoWrongNetwork: false }); void signIn(md.wallet as never); }}>I’ve switched</FB></Foot>
      </HeroDlg>);
    case "connected": return (
      <HeroDlg k="W-03">
        <Head title="Signed in">{md.wallet} is connected on Stellar Testnet as {short}. Your session lasts 12 hours; you can disconnect any time.</Head>
        <Foot><FB v="pri" onClick={() => { ui.close(); router.push(afterConnect ?? "/dashboard"); ui.setAfterConnect(null); }}>{afterConnect ? "Open agreement" : "Go to dashboard"}</FB></Foot>
      </HeroDlg>);
    case "disconnect": return (
      <HeroDlg k="W-10">
        <Head title="Disconnect your wallet?">This ends your MileVault session. Your agreements and escrow stay exactly as they are on Stellar.</Head>
        <Foot><FB onClick={ui.close}>Cancel</FB><FB v="danger" onClick={async () => { ui.close(); await signOut(); window.location.assign(env.landingUrl); }}>Disconnect</FB></Foot>
      </HeroDlg>);
    case "install": return <InstallDialog />;
    case "action": return <ActionDialog refId={md.ref} kind={md.kind} position={md.position} />;
    case "confirm": return <ConfirmDialog op={md.op} refId={md.ref} position={md.position} />;
  }
}

/** Simulated wallet popup — demo mode only (real wallets show their own UI) */
function WalletPopup() {
  const prompt = useUI((s) => s.prompt);
  const wallet = useSession((s) => s.walletId) ?? (prompt?.wallet ?? "Varial");
  if (!prompt) return null;
  const name = prompt.wallet ?? wallet;
  return (
    <>
      <div className="ext" role="dialog" aria-label={`${name} request`}>
        <div className="arrow" />
        <div className="eh"><img src={imgUrl(walletIcon(name))} alt="" /><div><b>{name}</b><small>{prompt.address ? shortAddr(prompt.address) : "Demo wallet"}</small></div><span className="net">Testnet</span></div>
        <div className="eb">
          <div className="site"><Icon name="lock" size={12} />milevault.app wants you to {prompt.kind === "connect" ? "connect" : "sign"}</div>
          <h4>{prompt.kind === "connect" ? "Share your public address" : prompt.title}</h4>
          {prompt.kind === "sign" && <div className="fn">{prompt.purpose === "signin" ? "Sign-in challenge · " : "Transaction · "}<code>{prompt.fn}</code></div>}
          {prompt.rows && <KV rows={prompt.rows} />}
          {prompt.kind === "connect" && <KV rows={[["Shares", "Public address only"], ["Network", "Testnet"]]} />}
        </div>
        <div className="ef"><button className="rj" onClick={() => prompt.reject(new WalletDeclined())}>Reject</button><button className="ok" onClick={prompt.resolve} autoFocus>Approve</button></div>
      </div>
      <div className="exthint">This is your wallet (simulated in demo mode). Approve to continue, or reject to see the declined state.</div>
    </>
  );
}

export function Modals() {
  const modal = useUI((s) => s.modal);
  const close = useUI((s) => s.close);
  const prompt = useUI((s) => s.prompt);
  const locked = modal?.t === "connecting" || (modal?.t === "action" && !!prompt);
  return (
    <Dialog.Root open={!!modal} onOpenChange={(o) => !o && close()}>
      <Dialog.Portal>
        <Dialog.Overlay className="ovl">
          <Dialog.Content asChild aria-describedby={undefined} onPointerDownOutside={(e) => (locked || prompt) && e.preventDefault()} onEscapeKeyDown={(e) => locked && e.preventDefault()}
            onOpenAutoFocus={(e) => { if (!(e.currentTarget as HTMLElement)?.querySelector?.("input[autofocus],textarea[autofocus]")) e.preventDefault(); }}>
            <div style={{ display: "contents" }}>
              {modal && <ModalBody md={modal} />}
              {env.dataSource === "mock" && <WalletPopup />}
            </div>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
      {/* Signatures outside a dialog (e.g. Enable USDC on the Wallet page) still get the demo wallet */}
      {!modal && prompt && env.dataSource === "mock" && <div className="ovl ext-only"><WalletPopup /></div>}
    </Dialog.Root>
  );
}

export function RedirectWatcher() {
  const redirect = useUI((s) => s.redirect);
  const router = useRouter();
  useEffect(() => { if (redirect) { router.push(redirect); useUI.getState().go(null); } }, [redirect, router]);
  return null;
}
