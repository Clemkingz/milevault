import type { Metadata } from "next";
import Link from "next/link";
import { Icon, StatusBadge } from "@milevault/ui";
import { Avatar, Hash, PageHeader, Section } from "@/components/bits";
import { AGREEMENTS, EVENTS, FLAG_COPY, agreement, stats, wallet } from "@/lib/data";
import { compact, relTime, usd } from "@/lib/format";

export const metadata: Metadata = { title: "Overview" };

const KIND: Record<string, string> = { create: "Created", fund: "Funded", approve: "Approved", release: "Released", refund: "Refunded", cancel: "Cancelled", accept: "Accepted", submit: "Submitted" };

export default function Overview() {
  const s = stats();
  const attention = AGREEMENTS.filter((a) => a.flag);
  const kpis: [string, string, string, string][] = [
    ["Locked in escrow", `${compact(s.tvl)} USDC`, "#2EBEF2", `${usd(s.tvl)} across ${s.activeAgreements} open agreements`],
    ["Released · 30 days", `${compact(s.released30)} USDC`, "#00CE5C", "Paid out to contributors"],
    ["Agreements", `${s.activeAgreements} open`, "#4797F6", `${s.totalAgreements} total · ${s.completionRate}% completed`],
    ["Needs attention", String(s.attention), "#F0AF30", `${s.flagged} flagged wallet${s.flagged === 1 ? "" : "s"}`],
  ];
  return (
    <>
      <PageHeader title="Overview" sub="Platform-wide escrow, agreements and on-chain activity on Stellar Testnet." />
      <div className="kpis mv-list">
        {kpis.map(([k, v, c, hint]) => (
          <div className="card kpi" key={k}><small><i style={{ background: c }} />{k}</small><b>{v}</b><em>{hint}</em></div>
        ))}
      </div>
      <Section title="Needs attention" href="/agreements">
        <div className="card mv-list">
          {attention.map((a) => {
            const [t, d] = FLAG_COPY[a.flag!];
            return (
              <div className="trow" key={a.id}>
                <span className="tile" style={{ width: 36, height: 36, background: "#FEFCE6" }}><Icon name="alert" size={18} color="#F0AF30" /></span>
                <div className="tx"><b>{t} · {a.name}</b><small>MV-{a.id} · {d}</small></div>
                <span className="num hide-m">{usd(a.locked || a.total)}</span>
                <div className="col-w"><StatusBadge status={a.status} /></div>
              </div>
            );
          })}
        </div>
      </Section>
      <Section title="Recent on-chain activity" href="/transactions">
        <div className="card mv-list">
          {EVENTS.slice(0, 6).map((e) => {
            const w = wallet(e.actor);
            return (
              <div className="trow" key={e.id}>
                <Avatar w={w} size={32} />
                <div className="tx"><b>{w.name} · {KIND[e.kind]}</b><small>{agreement(e.agreementId).name} · MV-{e.agreementId} · {relTime(e.at)}</small></div>
                {e.amount ? <span className="num">{usd(e.amount)}</span> : null}
                <span className="hide-m"><Hash h={e.hash} /></span>
              </div>
            );
          })}
        </div>
      </Section>
      <p style={{ color: "var(--soft)", fontSize: 12, padding: "0 4px" }}><Link className="link" href="/system">System status</Link> · Data refreshes from the backend indexer.</p>
    </>
  );
}
