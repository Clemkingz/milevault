"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError, fmtAmount, assetCode, shortAddr } from "@milevault/api";
import { Button, Icon, StatusBadge } from "@milevault/ui";
import { imgUrl } from "@/components/art";
import { AssetPill, ErrorState, KV, PageHeader, Section } from "@/components/bits";
import { CountUp } from "@/components/agreements/count-up";
import { Page } from "@/components/shell/page";
import { ListSkeleton } from "@/components/shell/skeleton";
import { useActions } from "@/components/use-actions";
import { addTrustline, fundWithFriendbot, getTestUsdc } from "@/lib/funding";
import { useEscrowConfig, useNetwork, useWalletOverview } from "@/lib/queries";
import { openWalletApp, walletIcon, walletKind, WalletDeclined } from "@/lib/wallet";
import { useSession } from "@/lib/session";
import { useUI } from "@/lib/ui";

/** GET /wallet — balances, trustline/account state, escrow exposure */
export function WalletsView() {
  const { data: w, isPending, error, refetch } = useWalletOverview();
  const { data: net } = useNetwork();
  const walletName = useSession((s) => s.walletId) ?? "Wallet";
  const expiresAt = useSession((s) => s.expiresAt);
  const open = useUI((s) => s.open);
  const { data: cfg } = useEscrowConfig();
  const toast = useUI((s) => s.toast);
  const qc = useQueryClient();
  const { copy, explorer } = useActions();
  const [busy, setBusy] = useState<"xlm" | "trust" | "usdc" | null>(null);
  const [trustReq, setTrustReq] = useState(false);
  const act = async (k: "xlm" | "trust" | "usdc", fn: () => Promise<unknown>, done: string) => {
    setBusy(k);
    try { const r = await fn(); if (r !== false) { toast(done); } await qc.invalidateQueries({ queryKey: ["wallet"] }); }
    catch (e) { if (!(e instanceof WalletDeclined)) toast(e instanceof ApiError || e instanceof Error ? e.message : "That didn’t work. Try again.", { tone: "error" }); }
    finally { setBusy(null); }
  };
  if (isPending) return <Page><ListSkeleton title={100} /></Page>;
  if (error || !w) return <Page><ErrorState error={error} retry={() => refetch()} /></Page>;
  const code = assetCode(w.asset);
  const testnet = (net?.network ?? w.network) !== "mainnet";

  return (
    <Page>
      <PageHeader title="Wallet" sub="Your connected wallet, balances and what’s locked in escrow." />
      <div className="layout-2 main-first">
        <div className="l-main">
          <div className="card wcard">
            <div className="wtop">
              <span className="wlogo" style={{ padding: 0, overflow: "hidden" }}><img src={imgUrl(walletIcon(walletName))} alt="" width={44} height={44} /></span>
              <div className="tx">
                <div className="n">{walletName}<StatusBadge status="connected" /></div>
                <button className="a" onClick={() => copy(w.address)} title="Copy address"><span className="w-d">{w.address.slice(0, 9)}…{w.address.slice(-6)}</span><span className="w-m">{shortAddr(w.address)}</span><Icon name="copy" size={14} /></button>
              </div>
              <div className="wbtns"><Button variant="sec" h={32} onClick={() => open({ t: "connect", sw: true })}>Switch wallet</Button><Button variant="dsoft" h={32} onClick={() => open({ t: "disconnect" })}>Disconnect</Button></div>
            </div>
            <KV rows={[["Network", testnet ? "Stellar Testnet" : "Stellar Mainnet"], ["Session ends", expiresAt ? new Date(expiresAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—"], ["Used for", `${w.agreementsCount} agreement${w.agreementsCount === 1 ? "" : "s"}`]]} />
          </div>
          {w.balancesAvailable && !w.accountExists && (
            <div className="warnbox act"><Icon name="alert" size={16} /><span>This account isn’t active on Stellar yet, so it can’t hold {code} or pay network fees. {testnet ? "Fund it with test XLM first." : "Send it some XLM first."}</span>
              {testnet && <Button h={32} loading={busy === "xlm"} loadingText="Funding…" onClick={() => act("xlm", () => fundWithFriendbot(w.address), "Test XLM added. Your account is active.")}>Fund with test XLM</Button>}</div>
          )}
          {w.balancesAvailable && w.accountExists && !w.hasTrustline && (
            <div className="warnbox act"><Icon name="alert" size={16} /><span>This wallet can’t hold {code} yet. Enable {code} ({shortAddr(w.asset.split(":")[1] ?? "")} issuer) before funding or receiving payments. Your wallet signs it.</span>
              <Button h={32} loading={busy === "trust"} loadingText="Check your wallet…" disabled={!cfg} onClick={() => act("trust", () => { setTrustReq(false); return addTrustline(w.address, cfg!, net?.horizonUrl, () => setTrustReq(true)); }, `${code} enabled. This wallet can now hold ${code}.`)}>Enable {code}</Button>
              {busy === "trust" && trustReq && walletKind(walletName) === "app" && <Button h={32} variant="sec" onClick={() => openWalletApp(walletName)}>Open {walletName}</Button>}</div>
          )}
          {w.balancesAvailable && w.accountExists && w.xlmBalance !== null && Number(w.xlmBalance) < 1 && (
            <div className="warnbox"><Icon name="alert" size={16} /><span>Your XLM balance is low. Every signer pays its own small network fee, so add test XLM before signing.</span></div>
          )}
          <Section title="Balances">
            {!w.balancesAvailable ? <div className="warnbox"><Icon name="info" size={16} /><span>Balances are temporarily unavailable from Stellar. Try again in a moment.</span></div> : (
              <div className="card rows bals mv-list">
                <div className="row"><span className="btile" style={{ background: "#ECF4FE" }}><Icon name="usdc" size={20} color="#4797F6" /></span><div className="tx"><b>{code}</b><small><AssetPill id={w.asset} /></small></div><div className="bv"><b>{w.assetBalance != null ? <CountUp value={w.assetBalance} suffix={` ${code}`} /> : "—"}</b><small>{w.hasTrustline ? "Available" : "No trustline"}</small></div></div>
                <div className="row"><span className="btile" style={{ background: "#EAF8FE" }}><Icon name="coin" size={20} color="#2EBEF2" /></span><div className="tx"><b>XLM</b><small>Pays network fees</small></div><div className="bv"><b>{w.xlmBalance != null ? `${fmtAmount(w.xlmBalance)} XLM` : "—"}</b><small>{w.accountExists ? "Native" : "Account not funded"}</small></div></div>
              </div>
            )}
          </Section>
        </div>
        <aside className="l-side">
          <Section title="In escrow"><KV rows={[["Locked as client", <CountUp key="l" value={w.lockedAsClient} suffix={` ${code}`} />], ["Waiting to be released to you", <CountUp key="w" value={w.waitingForYou} suffix={` ${code}`} />]]} /></Section>
          <div className="card side-card">
            <b>{testnet ? "Need test funds?" : "Account"}</b>
            <p style={{ color: "var(--sub)" }}>{testnet ? `Test assets have no real value. Fund XLM for fees, enable ${code}, then get test ${code} (Circle faucet: choose Stellar Testnet).` : "View this account on the explorer."}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {testnet && <Button variant="tint" h={32} loading={busy === "xlm"} loadingText="Funding…" onClick={() => act("xlm", () => fundWithFriendbot(w.address), "Test XLM added")}>Fund XLM</Button>}
              {testnet && code === "USDC" && <Button variant="sec" h={32} disabled={!w.hasTrustline} title={w.hasTrustline ? undefined : `Enable ${code} first`} loading={busy === "usdc"} loadingText="Adding…" onClick={() => act("usdc", () => getTestUsdc(w.address), `1,000 test ${code} added`)}>Get test USDC</Button>}
              <Button variant="ghost" h={32} icon="external" iconSize={16} onClick={() => explorer(w.address, "account")}>Explorer</Button>
            </div>
          </div>
        </aside>
      </div>
    </Page>
  );
}
