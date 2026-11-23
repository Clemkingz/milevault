"use client";

import { Button, Icon, StatusBadge } from "@milevault/ui";
import { imgUrl } from "@/components/art";
import { KV, PageHeader, Section } from "@/components/bits";
import { CountUp } from "@/components/agreements/count-up";
import { Page } from "@/components/shell/page";
import { ListSkeleton } from "@/components/shell/skeleton";
import { useActions } from "@/components/use-actions";
import { locked, plural, useChain, useMe, useMyAgreements, useReady, useUI } from "@/mock";

/** Design walletsPage(): connected wallet, balances, escrow exposure */
export function WalletsView() {
  const ready = useReady();
  const me = useMe()!;
  const wallet = useChain((s) => s.wallet) ?? "Freighter";
  const connectedAt = useChain((s) => s.connectedAt);
  const bal = useChain((s) => s.balances[me.key]);
  const mine = useMyAgreements();
  const open = useUI((s) => s.open);
  const { copy, faucet } = useActions();
  if (!ready) return <Page><ListSkeleton title={100} /></Page>;

  const lk = mine.filter((a) => a.client === me.key).reduce((s, a) => s + locked(a), 0);
  const wait = mine.filter((a) => a.contributor === me.key && (a.status === "funded" || a.status === "active")).reduce((s, a) => s + locked(a), 0);
  const isClientish = mine.filter((a) => a.client === me.key).length >= mine.filter((a) => a.contributor === me.key).length;
  const since = connectedAt ? new Date(connectedAt) : null;
  const sinceTxt = since ? `${since.toDateString() === new Date().toDateString() ? "Today" : since.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${since.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}` : "—";

  return (
    <Page>
      <PageHeader title="Wallets" sub="Your connected wallet, balances and what’s locked in escrow." />
      <div className="layout-2 main-first">
      <div className="l-main">
      <div className="card wcard">
        <div className="wtop">
          <span className="wlogo" style={{ padding: 0, overflow: "hidden" }}><img src={imgUrl(`wl-${wallet.toLowerCase()}`)} alt="" width={44} height={44} /></span>
          <div className="tx">
            <div className="n">{wallet}<StatusBadge status="connected" /></div>
            <button className="a" onClick={() => copy(me.addr)} title="Copy address">
              <span className="w-d">{me.addr.slice(0, 9)}…{me.addr.slice(-6)}</span><span className="w-m">{me.addr.slice(0, 4)}…{me.addr.slice(-3)}</span>
              <Icon name="copy" size={14} />
            </button>
          </div>
          <div className="wbtns">
            <Button variant="sec" h={32} onClick={() => open({ t: "connect", sw: true })}>Switch wallet</Button>
            <Button variant="dsoft" h={32} onClick={() => open({ t: "disconnect" })}>Disconnect</Button>
          </div>
        </div>
        <KV rows={[["Network", "Stellar Testnet"], ["Connected", sinceTxt], ["Used for", plural(mine.length, "agreement")]]} />
      </div>
      <Section title="Balances" onClick={faucet} label="Get test USDC">
      <div className="card rows bals mv-list">
        <div className="row">
          <span className="btile" style={{ background: "#ECF4FE" }}><Icon name="usdc" size={20} color="#4797F6" /></span>
          <div className="tx"><b>USDC</b><small>Test USDC · Circle Testnet issuer</small></div>
          <div className="bv"><b><CountUp value={bal.usdc} /></b><small>{isClientish ? "Available to fund" : "In your wallet"}</small></div>
        </div>
        <div className="row">
          <span className="btile" style={{ background: "#EAF8FE" }}><Icon name="coin" size={20} color="#2EBEF2" /></span>
          <div className="tx"><b>XLM</b><small>Pays network fees</small></div>
          <div className="bv"><b>{bal.xlm.toFixed(2)} XLM</b><small>Enough for ~{Math.floor(bal.xlm / 0.01).toLocaleString()} transactions</small></div>
        </div>
      </div>
      </Section>
      </div>
      <aside className="l-side">
        <Section title="In escrow">
        <KV className="esc" rows={[["Locked as client", <CountUp key="l" value={lk} />], ["Waiting to be released to you", <CountUp key="w" value={wait} />]]} />
        </Section>
        <div className="card side-card">
          <b>Need test funds?</b>
          <p style={{ color: "var(--sub)" }}>Testnet USDC has no real value. Top up from the faucet, and keep a little XLM for network fees.</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Button variant="tint" h={32} onClick={faucet}>Get test USDC</Button>
            <Button variant="sec" h={32} onClick={() => window.open(`https://friendbot.stellar.org/?addr=${me.addr}`, "_blank", "noopener")}>Fund XLM</Button>
          </div>
        </div>
      </aside>
      </div>
    </Page>
  );
}
