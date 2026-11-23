"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Icon, StatusBadge } from "@milevault/ui";
import { ActivityList, MilestoneRows } from "@/components/agreements/lists";
import { NextAction } from "@/components/agreements/next-action";
import { Avatar } from "@/components/art";
import { Back, Empty, SectionHead } from "@/components/bits";
import { AgreementMenuItems, Menu } from "@/components/shell/menus";
import { Page } from "@/components/shell/page";
import { AgreementSkeleton } from "@/components/shell/skeleton";
import { useActions } from "@/components/use-actions";
import { agState, ESCROW_CONTRACT, fmt, involves, locked, getPerson, released, relLong, short, total, usd, useActivity, useAgreement, useChain, useReady } from "@/mock";
import Link from "next/link";

type Tab = "overview" | "milestones" | "activity";

/** PRD screens 3–5: funding, milestone management, details & history (design agreementPage()) */
export function AgreementView({ id }: { id: string }) {
  const ready = useReady();
  const a = useAgreement(id);
  const me = useChain((s) => s.me)!;
  const bal = useChain((s) => s.balances[me].usdc);
  const acts = useActivity(id);
  const [tab, setTab] = useState<Tab>("overview");
  const { copy, explorer, agreementLink } = useActions();

  // Highlight rows that arrive while the page is open (e.g. the other side acting)
  const seen = useRef<Set<string> | null>(null);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!ready) return;
    if (!seen.current) { seen.current = new Set(acts.map((x) => x.e.id)); return; }
    const n = acts.filter((x) => !seen.current!.has(x.e.id)).map((x) => x.e.id);
    if (n.length) { n.forEach((i) => seen.current!.add(i)); setFresh(new Set(n)); }
  }, [acts, ready]);

  if (!ready) return <Page back="/agreements" title="Agreement"><AgreementSkeleton /></Page>;
  if (!a || !involves(a, me))
    return (
      <Page back="/agreements" title="Agreement">
        <Back href="/agreements" label="Agreements" />
        <Empty k="E-01" title="Agreement not found" body={a ? "This wallet isn’t part of that agreement. Only the client and contributor can open it." : `There’s no agreement MV-${id} for this wallet. Check the link, or switch to the wallet that’s part of it.`}
          action={<Link href="/agreements"><Button variant="sec" h={36}>Back to agreements</Button></Link>} />
      </Page>
    );

  const c = getPerson(a.client), k = getPerson(a.contributor);
  const st = agState(a);
  const youRole = a.client === me ? "client" : "contributor";
  const history = () => { setTab("activity"); requestAnimationFrame(() => document.querySelector(".tabs")?.scrollIntoView({ behavior: "smooth", block: "start" })); };
  const party = (role: string, p: typeof c, isMe: boolean) => (
    <div className="party">
      <Avatar p={p} size={40} />
      <div className="tx"><small>{role}</small><b>{p.name}{isMe ? " (you)" : ""}</b></div>
      <button className="chip" onClick={() => copy(p.addr)} title="Copy address">{short(p.addr)}<Icon name="copy" size={14} /></button>
    </div>
  );
  const seg = a.ms.map((m, i) => <i key={i} className={m.status === "paid" ? "g" : m.status === "approved" ? "b" : m.status === "submitted" ? "y" : ""} />);
  const more = (
    <Menu trigger={<button className="btn sec h32" style={{ width: 32, padding: 0 }} aria-label="More actions"><Icon name="more" size={18} /></button>}>
      <AgreementMenuItems a={a} onHistory={history} />
    </Menu>
  );
  const moreMobile = (
    <Menu trigger={<button className="ib" aria-label="More actions"><Icon name="more" size={20} /></button>}>
      <AgreementMenuItems a={a} onHistory={history} />
    </Menu>
  );

  return (
    <Page back="/agreements" title="Agreement" right={moreMobile}>
      <Back href="/agreements" label="Agreements" />
      <div className="ahead">
        <div className="tr">
          <span className="pt" style={{ padding: 0, display: "block" }}>{a.name}</span>
          <StatusBadge status={st} key={st} />
          <span className="more">{more}</span>
        </div>
        <p>You’re the {youRole} · MV-{a.id} · created {relLong(a.createdAt)}</p>
      </div>

      <div className="layout-2">
        <aside className="l-side" aria-label="Parties and details">
        <div className="card">
          {party("Client", c, a.client === me)}
          {party("Contributor", k, a.contributor === me)}
          <div className="party">
            <span className="tile" style={{ width: 40, height: 40, background: "#ECF4FE" }}><Icon name="file" size={20} color="#4797F6" /></span>
            <div className="tx"><small>Agreement ID</small><b>Escrow contract</b></div>
            <div className="rt">
              <button className="chip" onClick={() => copy(ESCROW_CONTRACT)}>{short(ESCROW_CONTRACT)}<Icon name="copy" size={14} /></button>
              <button className="link" onClick={() => explorer(ESCROW_CONTRACT, "contract")}><span className="lt">Explorer</span><Icon name="external" size={16} /></button>
            </div>
          </div>
        </div>
        <div className="card side-card only-wide">
          <b>Agreement details</b>
          <div className="sumrow"><span>Agreement</span><b>MV-{a.id}</b></div>
          <div className="sumrow"><span>Created</span><b>{new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</b></div>
          <div className="sumrow"><span>Milestones</span><b>{a.ms.filter((m) => m.status === "paid").length} of {a.ms.length} paid</b></div>
          <div className="sumrow"><span>Network</span><b>Stellar Testnet</b></div>
          <div className="sumrow"><span>Asset</span><b>Test USDC</b></div>
          <div className="div" />
          <button className="link" style={{ alignSelf: "flex-start" }} onClick={() => copy(agreementLink(a.id), "Agreement link copied")}><Icon name="link" size={16} />Copy agreement link</button>
        </div>
        </aside>
        <div className="l-main">
        <div className="card fund">
          <b>Funding</b>
          <div className="figs">
            <div><small>Escrow total</small><b>{usd(total(a))}</b></div>
            <div><small>Released</small><b style={{ color: "#00CE5C" }}>{usd(released(a))}</b></div>
            <div><small>{youRole === "client" ? "Locked in escrow" : "Locked for you"}</small><b>{usd(locked(a))}</b></div>
            {!!a.refunded && <div><small>Refunded</small><b style={{ color: "#B36BF2" }}>{usd(a.refunded)}</b></div>}
          </div>
          <div className="prog full">{seg}</div>
          {a.status === "created" && youRole === "client" && (
            <div className="hint"><Icon name="info" size={16} />Fund the full {usd(total(a))} to start. You have {fmt(bal)} test USDC.</div>
          )}
        </div>
  
        <NextAction a={a} onHistory={history} />
          <div className="tabs" role="tablist">
            {(["overview", "milestones", "activity"] as Tab[]).map((t) => (
              <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>{t[0]!.toUpperCase() + t.slice(1)}</button>
            ))}
          </div>
          {tab === "overview" && (
            <>
              <SectionHead title="Milestones" onClick={() => setTab("milestones")} label="View all" />
              <MilestoneRows a={a} />
              <SectionHead title="Recent activity" onClick={() => setTab("activity")} label="View all" />
              <ActivityList items={acts.slice(0, 3)} noAg freshIds={fresh} />
            </>
          )}
          {tab === "milestones" && (
            <>
              <MilestoneRows a={a} />
              <div className="card" style={{ padding: "4px 16px" }}>
                <div className="rcpt" style={{ padding: 0 }}>
                  {a.ms.map((m, i) => <div key={i}><span>{i + 1}. {m.title}</span><b>{usd(m.amount)}</b></div>)}
                  <div><span>Total</span><b>{usd(total(a))}</b></div>
                </div>
              </div>
            </>
          )}
          {tab === "activity" && <ActivityList items={acts} noAg freshIds={fresh} />}
        </div>
      </div>
    </Page>
  );
}
