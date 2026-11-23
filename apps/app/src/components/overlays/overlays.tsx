"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Icon } from "@milevault/ui";
import { KV, Note } from "../bits";
import { imgUrl } from "../art";
import { env } from "@/lib/env";
import {
  involves, locked, mid, getPerson, short, shortHash, total, usd, useChain, useUI, type Modal, type WalletId,
} from "@/mock";
import { FB, Foot, Head, HeroDlg, Burst, WalletRow } from "./parts";
import { TxContent, txInfo } from "./tx";
import { usePwa } from "../pwa/install";

const WALLETS: WalletId[] = ["Freighter", "xBull", "Albedo", "LOBSTR", "Hana"];

function ModalBody({ md }: { md: Modal }) {
  const ui = useUI.getState();
  const me = useChain((s) => s.me);
  const agreements = useChain((s) => s.agreements);
  const afterConnect = useUI((s) => s.afterConnect);
  const router = useRouter();
  const meP = me ? getPerson(me) : getPerson(useChain.getState().persona);

  switch (md.t) {
    case "connect":
      return (
        <HeroDlg k="W-01">
          <Head title={md.sw ? "Switch wallet" : "Connect a wallet"}>Pick a Stellar wallet. You’ll approve the connection in the wallet itself.</Head>
          <div className="wlist mv-list">
            {WALLETS.map((w, i) => (
              <WalletRow key={w} name={w} sub={i === 0 ? <span className="rec">Recommended</span> : undefined} right={<Icon name="right" size={20} />} onClick={() => ui.pickWallet(w)} />
            ))}
          </div>
          <Note icon="lock">MileVault only reads your public address. We never see your keys.</Note>
        </HeroDlg>
      );
    case "connecting":
      return (
        <HeroDlg k="W-02" className="waiting">
          <Head title={`Waiting for ${md.w}`}>Approve the connection request in {md.w}. MileVault only asks for your public address.</Head>
          <WalletRow name={md.w} sub={<small>Waiting for approval…</small>} right={<Icon name="loading" size={20} color="#2EBEF2" className="spin" />} active />
          <Foot>
            <FB onClick={() => ui.open({ t: "connect" })}>Choose another wallet</FB>
            {env.dataSource === "mock" && <FB onClick={ui.walletDecline}>Simulate decline</FB>}
          </Foot>
        </HeroDlg>
      );
    case "connDeclined":
      return (
        <HeroDlg k="W-05E" err>
          <Head title="Connection declined">You declined the request in {md.w}. Nothing was shared and nothing changed.</Head>
          <Foot><FB onClick={() => ui.open({ t: "connect" })}>Choose another wallet</FB><FB v="pri" onClick={() => ui.pickWallet(md.w)}>Try again</FB></Foot>
        </HeroDlg>
      );
    case "wrongNetwork":
      return (
        <HeroDlg k="W-08" err>
          <Head title={`Switch ${md.w} to Testnet`}>MileVault runs on Stellar Testnet. Your wallet is on Mainnet, so we didn’t connect it. Switch the network in {md.w}, then try again.</Head>
          <KV rows={[["Wallet network", "Public (Mainnet)"], ["MileVault needs", "Stellar Testnet"]]} />
          <Foot>
            <FB onClick={ui.close}>Cancel</FB>
            <FB v="pri" onClick={() => { useChain.getState().setDemo({ wrongNetwork: false }); ui.pickWallet(md.w); }}>I’ve switched</FB>
          </Foot>
        </HeroDlg>
      );
    case "connected": {
      const target = afterConnect ? agreements.find((a) => `/agreements/${a.id}` === afterConnect) : undefined;
      return (
        <HeroDlg k="W-03">
          <Head title="Wallet connected">{md.w} is connected on Stellar Testnet. You can disconnect any time from Wallets.</Head>
          <KV rows={[["Account", `${meP.name} · ${short(meP.addr)}`], ["Network", "Stellar Testnet"], ["Agreements found", String(agreements.filter((a) => me && involves(a, me)).length)]]} />
          <Foot>
            <FB v="pri" onClick={() => { ui.close(); router.push(afterConnect ?? "/dashboard"); ui.setAfterConnect(null); }}>
              {target ? `Open ${target.name}` : "Go to dashboard"}
            </FB>
          </Foot>
        </HeroDlg>
      );
    }
    case "disconnect": {
      const wallet = useChain.getState().wallet ?? "wallet";
      return (
        <HeroDlg k="W-10">
          <Head title={`Disconnect ${wallet}?`}>Your agreements and escrow stay exactly as they are. Connect again any time to pick up where you left off.</Head>
          <Foot>
            <FB onClick={ui.close}>Cancel</FB>
            <FB v="danger" onClick={() => { useChain.getState().disconnect(); ui.close(); ui.toast("Wallet disconnected. Nothing was signed."); window.location.assign(env.landingUrl); }}>Disconnect</FB>
          </Foot>
        </HeroDlg>
      );
    }
    case "install":
      return <InstallDialog />;
    case "received": {
      const a = agreements.find((x) => x.id === md.id)!;
      const m = a.ms[md.i]!;
      const done = a.status === "completed";
      const cl = getPerson(a.client);
      const bal = useChain.getState().balances[me!].usdc;
      return (
        <HeroDlg k={done ? "M-07" : "M-06"}>
          <Burst />
          <Head title={done ? "Paid in full" : `You received ${usd(m.amount)}`}>
            {done ? `${cl.first} released the last milestone. You’ve received ${usd(total(a))} for ${a.name}.` : `${cl.first} released the payment for ${m.title}. It’s in your wallet now.`}
          </Head>
          <KV rows={[["Amount", usd(m.amount)], ["Still locked for you", usd(locked(a))], ["Wallet balance", usd(bal)], ["Transaction", shortHash(m.releaseHash ?? ""), m.releaseHash]]} />
          <Foot><FB v="pri" onClick={ui.close}>Done</FB></Foot>
        </HeroDlg>
      );
    }
    case "tx":
      return <TxContent md={md} />;
  }
}

function InstallDialog() {
  const { platform } = usePwa();
  const steps: Record<string, [string, string][]> = {
    ios: [["1", "Tap the Share button in Safari’s toolbar"], ["2", "Scroll and choose “Add to Home Screen”"], ["3", "Tap Add — MileVault opens like an app"]],
    "safari-mac": [["1", "In Safari, open the File menu (or Share)"], ["2", "Choose “Add to Dock…”"], ["3", "Click Add — MileVault opens in its own window"]],
    android: [["1", "Open your browser menu (⋮)"], ["2", "Tap “Install app” or “Add to Home screen”"], ["3", "Confirm — it lands on your home screen"]],
    desktop: [["1", "Look for the install icon at the right of the address bar"], ["2", "Or open the browser menu → “Install MileVault…”"], ["3", "Confirm — it opens in its own window"]],
  };
  return (
    <HeroDlg k="W-08">
      <Head title="Install MileVault">Get MileVault on your {platform === "ios" || platform === "android" ? "home screen" : "dock or desktop"}. It opens in its own window, loads instantly and shows an offline screen when you lose connection.</Head>
      <ol className="isteps">{steps[platform]!.map(([n, t]) => <li key={n}><span className="seq">{n}</span>{t}</li>)}</ol>
      <Note icon="lock">Installing doesn’t change anything about your wallet or keys.</Note>
      <Foot><FB v="pri" onClick={useUI.getState().close}>Got it</FB></Foot>
    </HeroDlg>
  );
}

/** All dialogs (Radix Dialog → focus trap, Escape, scroll lock) styled as the design `.ovl/.dlg` */
export function Modals() {
  const modal = useUI((s) => s.modal);
  const close = useUI((s) => s.close);
  const locked = modal?.t === "tx" && modal.step === "pending";
  return (
    <Dialog.Root open={!!modal} onOpenChange={(o) => !o && close()}>
      <Dialog.Portal>
        <Dialog.Overlay className="ovl">
          <Dialog.Content
            asChild
            aria-describedby={undefined}
            onPointerDownOutside={(e) => locked && e.preventDefault()}
            onEscapeKeyDown={(e) => locked && e.preventDefault()}
            onOpenAutoFocus={(e) => { if (!(e.currentTarget as HTMLElement)?.querySelector?.("input[autofocus]")) e.preventDefault(); }}
          >
            <div style={{ display: "contents" }}>
              {modal && <ModalBody md={modal} />}
              {/* Simulated wallet popup lives inside the dialog so it stays interactive under the modal focus trap */}
              {env.dataSource === "mock" && <ExtPopup />}
            </div>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Simulated wallet extension popup (mock data source only) */
export function ExtPopup() {
  const ext = useUI((s) => s.ext);
  const modal = useUI((s) => s.modal);
  const me = useChain((s) => s.me);
  const wallet = useChain((s) => s.wallet) ?? "Freighter";
  const a = useChain((s) => (modal?.t === "tx" && modal.id ? s.agreements.find((x) => x.id === modal.id) : undefined));
  const { walletApprove, walletReject } = useUI.getState();
  if (!ext || modal?.t !== "tx" || !me) return null;
  const info = txInfo(modal, a);
  const p = getPerson(me);
  return (
    <>
      <div className="ext" role="dialog" aria-label={`${wallet} signature request`}>
        <div className="arrow" />
        <div className="eh">
          <img src={imgUrl(`wl-${wallet.toLowerCase()}`)} alt="" />
          <div><b>{wallet}</b><small>{p.name} · {mid(p.addr)}</small></div>
          <span className="net">Testnet</span>
        </div>
        <div className="eb">
          <div className="site"><Icon name="lock" size={12} />milevault.app wants you to sign</div>
          <h4>{info.ext}</h4>
          <div className="fn">Contract call · <code>{info.fn}</code></div>
          <KV rows={info.rows} />
        </div>
        <div className="ef">
          <button className="rj" onClick={walletReject}>Reject</button>
          <button className="ok" onClick={walletApprove} autoFocus>Approve</button>
        </div>
      </div>
      <div className="exthint">This is your {wallet} extension (simulated). Approve to sign, or reject to see the declined state.</div>
    </>
  );
}

export function RedirectWatcher() {
  const redirect = useUI((s) => s.redirect);
  const router = useRouter();
  useEffect(() => {
    if (redirect) { router.push(redirect); useUI.getState().go(null); }
  }, [redirect, router]);
  return null;
}
