"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ApiError, money, shortAddr, txHash } from "@milevault/api";
import { Button, Icon, StatusBadge } from "@milevault/ui";
import { ActivityList, MilestoneRows } from "@/components/agreements/lists";
import { NextAction } from "@/components/agreements/next-action";
import { Avatar } from "@/components/art";
import { AssetPill, Back, Empty, ErrorState, SectionHead } from "@/components/bits";
import { AgreementMenuItems, Menu } from "@/components/shell/menus";
import { Page } from "@/components/shell/page";
import { AgreementSkeleton } from "@/components/shell/skeleton";
import { useActions } from "@/components/use-actions";
import { agreementBadge } from "@/lib/domain";
import { useActivity, useAgreement, useEscrowConfig } from "@/lib/queries";
import { useSession } from "@/lib/session";

type Tab = "overview" | "milestones" | "activity";

/** PRD screens 3–5 — GET /agreements/{ref} + /activity */
export function AgreementView({ refId }: { refId: string }) {
  const me = useSession((s) => s.address)!;
  const { data: a, isPending, error, refetch } = useAgreement(refId);
  const { data: acts = [] } = useActivity(refId);
  const { data: cfg } = useEscrowConfig();
  const [tab, setTab] = useState<Tab>("overview");
  const { copy, explorer } = useActions();
  const seen = useRef<Set<string> | null>(null);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!acts.length) return;
    if (!seen.current) { seen.current = new Set(acts.map((x) => x.id)); return; }
    const n = acts.filter((x) => !seen.current!.has(x.id)).map((x) => x.id);
    if (n.length) { n.forEach((i) => seen.current!.add(i)); setFresh(new Set(n)); }
  }, [acts]);

  if (isPending) return <Page back="/agreements" title="Agreement"><AgreementSkeleton /></Page>;
  if (error) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <Page back="/agreements" title="Agreement">
        <Back href="/agreements" label="Agreements" />
        {notFound ? <Empty k="E-01" title="This wallet isn’t part of this agreement" body={`Only the client and contributor wallets can open ${refId.toUpperCase()}. If you expected access, switch to the wallet that’s part of it.`} action={<Link href="/agreements"><Button variant="sec" h={36}>Back to agreements</Button></Link>} />
          : <ErrorState error={error} retry={() => refetch()} />}
      </Page>
    );
  }
  const ag = a!;
  const badge = agreementBadge(ag);
  const history = () => { setTab("activity"); requestAnimationFrame(() => document.querySelector(".tabs")?.scrollIntoView({ behavior: "smooth", block: "start" })); };
  const party = (role: string, addr: string) => (
    <div className="party">
      <Avatar address={addr || "G"} size={40} />
      <div className="tx"><small>{role}</small><b style={{ fontFamily: "var(--inter)" }}>{addr ? shortAddr(addr) : "Not set"}{addr === me ? " (you)" : ""}</b></div>
      {addr && <div className="rt"><button className="chip" onClick={() => copy(addr)} title="Copy address">Copy<Icon name="copy" size={14} /></button><button className="link" onClick={() => explorer(addr, "account")} aria-label="View account on explorer"><Icon name="external" size={16} /></button></div>}
    </div>
  );
  const fundHash = txHash(ag.fundTx);
  const menu = (cls: string) => <Menu trigger={<button className={cls} aria-label="More actions" style={cls.includes("btn") ? { width: 32, padding: 0 } : undefined}><Icon name="more" size={cls.includes("btn") ? 18 : 20} /></button>}><AgreementMenuItems a={ag} onHistory={history} /></Menu>;
  const recoveryNote = ag.recoveryAt && ["funded", "in_progress"].includes(ag.status);

  return (
    <Page back="/agreements" title="Agreement" right={menu("ib")}>
      <Back href="/agreements" label="Agreements" />
      <div className="ahead">
        <div className="tr"><span className="pt" style={{ padding: 0, display: "block" }}>{ag.name || "Untitled draft"}</span><StatusBadge status={badge} key={String(badge)} /><span className="more">{menu("btn sec h32")}</span></div>
        <p>You’re the {ag.role} · {ag.reference} · created {new Date(ag.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}</p>
      </div>
      {ag.recoverySoon && ag.recoveryAt && <div className="warnbox"><Icon name="alert" size={16} /><span>{ag.role === "contributor"
        ? `After ${new Date(ag.recoveryAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}, the client can reclaim any milestone that hasn’t been paid.`
        : `The recovery date (${new Date(ag.recoveryAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}) is close. After it, you can reclaim any milestone that hasn’t been paid, and no other action is possible.`}</span></div>}

      <div className="layout-2">
        <aside className="l-side" aria-label="Parties and details">
          <div className="card">{party("Client", ag.client.address)}{party("Contributor", ag.contributor?.address ?? "")}</div>
          <div className="card side-card only-wide">
            <b>Agreement details</b>
            <div className="sumrow"><span>Reference</span><b>{ag.reference}</b></div>
            <div className="sumrow"><span>Paid in</span><b><AssetPill id={ag.asset} /></b></div>
            <div className="sumrow"><span>Milestones</span><b>{ag.paidCount} of {ag.milestoneCount} paid</b></div>
            {ag.fundedAt && <div className="sumrow"><span>Funded</span><b>{new Date(ag.fundedAt).toLocaleDateString()}</b></div>}
            {recoveryNote && <div className="sumrow"><span>Recoverable after</span><b>{new Date(ag.recoveryAt!).toLocaleDateString()}</b></div>}
            {ag.closedAt && <div className="sumrow"><span>Closed</span><b>{new Date(ag.closedAt).toLocaleDateString()}</b></div>}
            <div className="sumrow"><span>Escrow</span><b>Stellar claimable balances</b></div>
            {cfg?.arbiter && <div className="sumrow"><span>Arbiter</span><b style={{ fontFamily: "var(--inter)" }}>{shortAddr(cfg.arbiter)}</b></div>}
            {fundHash && <><div className="div" /><button className="link" style={{ alignSelf: "flex-start" }} onClick={() => explorer(fundHash)}><Icon name="external" size={16} />View funding transaction</button></>}
          </div>
        </aside>
        <div className="l-main">
          <div className="card fund">
            <b>Funding</b>
            <div className="figs">
              <div><small>Escrow total</small><b>{money(ag.total, ag.asset)}</b></div>
              <div><small>Released</small><b style={{ color: "#00CE5C" }}>{money(ag.released, ag.asset)}</b></div>
              <div><small>{ag.role === "client" ? "Locked in escrow" : "Locked for you"}</small><b>{money(ag.locked, ag.asset)}</b></div>
              {Number(ag.refunded) > 0 && <div><small>Refunded</small><b style={{ color: "#B36BF2" }}>{money(ag.refunded, ag.asset)}</b></div>}
            </div>
            <div className="prog full">{ag.milestoneStatuses.map((s, i) => <i key={i} className={s === "paid" ? "g" : s === "approved" ? "b" : s === "submitted" ? "y" : ""} />)}</div>
          </div>
          <NextAction a={ag} me={me} onHistory={history} />
          <div className="tabs" role="tablist">
            {(["overview", "milestones", "activity"] as Tab[]).map((t) => <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>{t[0]!.toUpperCase() + t.slice(1)}</button>)}
          </div>
          {tab === "overview" && (<><SectionHead title="Milestones" onClick={() => setTab("milestones")} label="View all" /><MilestoneRows a={ag} /><SectionHead title="Recent activity" onClick={() => setTab("activity")} label="View all" /><ActivityList items={acts.slice(0, 4)} noAg freshIds={fresh} agreementName={ag.name} /></>)}
          {tab === "milestones" && (<>
            <MilestoneRows a={ag} />
            {ag.milestones.some((m) => m.workNote || m.changesNote) && (
              <div className="card rows">{ag.milestones.filter((m) => m.workNote || m.changesNote).map((m) => (
                <div className="row" key={m.id}><span className="seq">{m.position}</span><div className="tx"><b>{m.title}</b>{m.workNote && <small style={{ whiteSpace: "normal" }}>Contributor: “{m.workNote}”</small>}{m.changesNote && <small style={{ whiteSpace: "normal" }}>Client: “{m.changesNote}”</small>}</div></div>
              ))}</div>
            )}
            <div className="card" style={{ padding: "4px 16px" }}><div className="rcpt" style={{ padding: 0 }}>{ag.milestones.map((m) => <div key={m.id}><span>{m.position}. {m.title}</span><b>{money(m.amount, ag.asset)}</b></div>)}<div><span>Total</span><b>{money(ag.total, ag.asset)}</b></div></div></div>
          </>)}
          {tab === "activity" && <ActivityList items={acts} noAg freshIds={fresh} agreementName={ag.name} />}
        </div>
      </div>
    </Page>
  );
}
