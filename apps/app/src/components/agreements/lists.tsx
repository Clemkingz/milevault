"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ActivityRow, Agreement, AgreementActivity, AgreementSummary, WaitingItem } from "@milevault/api";
import { money, relTime, shortAddr, shortHash } from "@milevault/api";
import { Button, Icon, StatusBadge } from "@milevault/ui";
import { Folder, Ring } from "../art";
import { Empty } from "../bits";
import { useActions } from "../use-actions";
import { activityText, agreementBadge, cardLine, counterpart, folderFor, milestoneBadge, milestoneLine } from "@/lib/domain";
import { useSession } from "@/lib/session";
import { useRunIntent } from "./intents";

export function ProjectCard({ a }: { a: AgreementSummary }) {
  const [t, c, f] = cardLine(a);
  return (
    <Link className="card pcard" href={`/agreements/${a.reference}`}>
      <Folder color={folderFor(a.reference)} w={56} />
      <div className="tx"><b>{a.name || "Untitled draft"}</b><small style={{ color: c }}><Ring frac={f} color={c} />{t}</small></div>
    </Link>
  );
}

/** Dashboard "waiting on you" (GET /dashboard → waitingOnYou), routed by `action` */
const WAIT: Record<WaitingItem["action"], [string, string]> = {
  publish: ["Publish", "draft"], fund: ["Fund", "awaiting"], accept: ["Review", "awaitc"], submit: ["Submit", "pending"],
  approve: ["Review", "submitted"], release: ["Release", "approved"], confirm_cancel: ["Respond", "cancel_requested"], recover: ["Recover", "recovered"],
};
export function WaitingRows({ items, asset }: { items: WaitingItem[]; asset?: string }) {
  const router = useRouter();
  return (
    <div className="card rows wait mv-list">
      {items.map((w) => {
        const href = `/agreements/${w.reference}${w.action === "publish" ? "/edit" : ""}`;
        const [label, badge] = WAIT[w.action] ?? ["Open", "pending"];
        return (
          <div key={`${w.reference}-${w.action}-${w.milestonePosition ?? 0}`} className="row click" role="link" tabIndex={0} onClick={() => router.push(href)} onKeyDown={(e) => e.key === "Enter" && router.push(href)}>
            <Folder color={folderFor(w.reference)} w={50.909} />
            <div className="tx">
              <b>{w.milestoneTitle ?? w.agreementName}</b>
              <div className="meta"><span><Icon name="folder_open" size={16} /><em>{w.agreementName}</em></span>{w.milestonePosition ? <><i /><span><Icon name="flag" size={16} />{w.milestonePosition} of {w.milestoneCount}</span></> : null}</div>
            </div>
            <span className="amt w-d">{money(w.amount, asset)}</span>
            <span className="w-d"><StatusBadge status={badge} /></span>
            <div className="rr w-m"><span className="amt">{money(w.amount, asset)}</span><StatusBadge status={badge} iconOnly /></div>
            <Button variant="sec" h={28} onClick={(e) => { e.stopPropagation(); router.push(href); }}>{label}</Button>
          </div>
        );
      })}
    </div>
  );
}

export function ActivityList({ items, noAg, freshIds, agreementName, empty }: { items: (AgreementActivity | ActivityRow)[]; noAg?: boolean; freshIds?: Set<string>; agreementName?: string; empty?: string }) {
  const me = useSession((s) => s.address);
  const { explorer } = useActions();
  if (!items.length) return <Empty title="No activity yet" body={empty ?? "Funding, approvals and payments show up here with their Stellar transaction."} />;
  return (
    <div className="card rows act mv-list">
      {items.map((x) => {
        const t = activityText(x, me, agreementName); const [i, c, b] = t.icon; const h = x.txHash;
        return (
          <div className={`row${freshIds?.has(x.id) ? " fresh" : ""}`} key={x.id}>
            <span className="tile" style={{ width: 36, height: 36, background: b }}><Icon name={i} size={18} color={c} /></span>
            <div className="tx"><b>{t.title}</b><small>{noAg ? "" : `${t.sub} · `}{relTime(x.createdAt)}</small></div>
            {h ? <button className="hash" onClick={() => explorer(h)}>{shortHash(h)}<Icon name="external" size={14} /></button> : null}
          </div>
        );
      })}
    </div>
  );
}

export function MilestoneRows({ a }: { a: Agreement }) {
  const run = useRunIntent(a);
  return (
    <div className="card rows ms mv-list">
      {a.milestones.map((m) => {
        const { sub, action } = milestoneLine(a, m);
        const btn = action && <Button h={28} onClick={() => run(action.intent)}>{action.label}</Button>;
        return (
          <div className="row ms-row" key={m.id}>
            <span className="seq">{m.position}</span>
            <div className="tx">
              <b>{m.title || "Untitled milestone"}</b>
              <small>{sub || " "}</small>
              <div className="ab w-m"><span className="amt">{money(m.amount, a.asset)}</span><StatusBadge status={milestoneBadge(m)} /></div>
              {btn && <div className="w-m">{btn}</div>}
            </div>
            <span className="amt w-d">{money(m.amount, a.asset)}</span>
            <div className="bcol w-d" style={{ width: 150 }}><StatusBadge status={milestoneBadge(m)} /></div>
            {btn && <span className="w-d">{btn}</span>}
          </div>
        );
      })}
    </div>
  );
}

export function AgreementRow({ a }: { a: AgreementSummary }) {
  const b = agreementBadge(a);
  const o = counterpart(a);
  const na = a.nextAction.type;
  const s = b === "draft" ? "draft, not published" : b === "awaiting" ? "not funded yet" : b === "awaitc" ? (a.role === "client" ? "waiting to accept" : "review the terms") : na === "approve" ? "1 to approve" : na === "release" ? "1 to release" : na === "confirm_cancel" ? "cancellation to answer" : na === "recover" ? "recovery available" : `${a.paidCount} of ${a.milestoneCount} paid`;
  const meta = `${o ? shortAddr(o.address) : "No contributor yet"} · ${a.role === "client" ? "As client" : "As contributor"} · ${s}`;
  const sub = a.status === "completed" ? "Paid in full" : Number(a.refunded) > 0 ? `${money(a.refunded, a.asset)} refunded` : Number(a.locked) > 0 ? `${money(a.locked, a.asset)} in escrow` : "Nothing locked";
  return (
    <Link className="row click" href={`/agreements/${a.reference}${a.status === "draft" && a.role === "client" ? "/edit" : ""}`}>
      <Folder color={folderFor(a.reference)} w={50.909} />
      <div className="tx">
        <b>{a.name || "Untitled draft"} <span className="refchip">{a.reference}</span></b>
        <small>{meta}</small>
        <div className="prog">{a.milestoneStatuses.map((m, i) => <i key={i} className={m === "paid" ? "g" : m === "submitted" ? "y" : m === "approved" ? "b" : ""} />)}</div>
      </div>
      <div className="amt w-d">{money(a.total, a.asset)}<small>{sub}</small></div>
      <div className="bcol w-d" style={{ width: 170 }}><StatusBadge status={b} /></div>
      <div className="rc w-m"><div className="amt">{money(a.total, a.asset)}<small>{sub}</small></div><StatusBadge status={b} /></div>
    </Link>
  );
}
