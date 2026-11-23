"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Icon, StatusBadge, type BadgeKind } from "@milevault/ui";
import { Folder, Ring } from "../art";
import { Empty } from "../bits";
import { useActions } from "../use-actions";
import {
  ACT, accepted, agState, curIdx, fmt, isFunded, locked, otherOf, paidN, getPerson, relTime, shortHash, total, usd, useChain, useNow, useUI,
  type ActivityRow, type MockAgreement, type PersonKey,
} from "@/mock";

const C = { pri: "#2EBEF2", green: "#00CE5C", amber: "#F0AF30", blue: "#4797F6", soft: "#A3A3A3" };

/** Design cardLine(): status line + ring progress for project cards */
function cardLine(a: MockAgreement, me: PersonKey): [string, string, number] {
  const n = a.ms.length, p = paidN(a), st = agState(a), isClient = a.client === me;
  const sub = a.ms.find((m) => m.status === "submitted"), apr = a.ms.find((m) => m.status === "approved");
  if (st === "awaiting") return [isClient ? "Awaiting funding" : "Not funded yet", C.amber, 0.25];
  if (st === "awaitc") return [isClient ? "Awaiting contributor" : "Review the terms", C.blue, 0.25];
  if (st === "cancel_requested") return ["Cancel requested", C.amber, Math.max(p / n, 0.12)];
  if (st === "completed") return [`${n} of ${n} paid`, C.green, 1];
  if (st === "cancelled" || st === "declined") return [st === "cancelled" ? "Cancelled" : "Declined", C.soft, 1];
  if (isClient && sub) return ["1 to approve", C.amber, (p + 0.5) / n];
  if (isClient && apr) return ["1 to release", C.amber, (p + 0.5) / n];
  if (!isClient && apr) return ["Approved · not paid", C.blue, 0.75];
  if (!isClient && !p && !sub) return ["Funded", C.blue, 0.75];
  return [`${p} of ${n} paid`, C.green, Math.max(p / n, 0.12)];
}

export function ProjectCard({ a }: { a: MockAgreement }) {
  const me = useChain((s) => s.me)!;
  const [t, c, f] = cardLine(a, me);
  return (
    <Link className="card pcard" href={`/agreements/${a.id}`}>
      <Folder color={a.color} w={56} />
      <div className="tx"><b>{a.name}</b><small style={{ color: c }}><Ring frac={f} color={c} />{t}</small></div>
    </Link>
  );
}

type Waiting = { a: MockAgreement; title: string; meta: string; amt: number; b: BadgeKind; btn: [string, () => void] };

/** Design waitingRows(): what needs the viewer's action, across agreements */
export function useWaitingRows(): Waiting[] {
  const me = useChain((s) => s.me)!;
  const agreements = useChain((s) => s.agreements);
  const router = useRouter();
  const { startTx } = useUI.getState();
  const rows: Waiting[] = [];
  for (const a of agreements) {
    if (!["created", "funded", "active", "cancel_requested"].includes(a.status)) continue;
    const n = a.ms.length;
    if (a.status === "cancel_requested" && (a.client === me || a.contributor === me) && a.cancelRequestedBy !== me) {
      rows.push({ a, title: "Cancellation requested", meta: `${paidN(a)} of ${n}`, amt: locked(a), b: "cancel_requested", btn: ["Review", () => router.push(`/agreements/${a.id}`)] });
      continue;
    }
    if (a.client === me) {
      if (a.status === "created") rows.push({ a, title: a.name, meta: `1 of ${n}`, amt: total(a), b: "awaiting", btn: ["Fund", () => startTx("fund", { id: a.id })] });
      if (a.status === "active") a.ms.forEach((m, i) => {
        if (m.status === "submitted") rows.push({ a, title: m.title, meta: `${i + 1} of ${n}`, amt: m.amount, b: "submitted", btn: ["Approve", () => startTx("approve", { id: a.id, i })] });
        if (m.status === "approved") rows.push({ a, title: m.title, meta: `${i + 1} of ${n}`, amt: m.amount, b: "approved", btn: ["Release", () => startTx("release", { id: a.id, i })] });
      });
    } else if (a.contributor === me) {
      if (a.status === "funded") rows.push({ a, title: "Review the terms", meta: `0 of ${n}`, amt: total(a), b: "awaitc", btn: ["Review", () => router.push(`/agreements/${a.id}`)] });
      else if (a.status === "active") { const i = curIdx(a); const m = a.ms[i]; if (m?.status === "pending") rows.push({ a, title: m.title, meta: `${i + 1} of ${n}`, amt: m.amount, b: "progress", btn: ["Submit", () => startTx("submit", { id: a.id, i })] }); }
    }
  }
  // Money waiting on a decision first (approve/release/review), then funding
  const pri: Partial<Record<BadgeKind, number>> = { submitted: 0, approved: 0, cancel_requested: 0, awaitc: 1, progress: 1, awaiting: 2 };
  return rows.sort((x, y) => (pri[x.b] ?? 1) - (pri[y.b] ?? 1));
}

export function WaitingRows({ rows }: { rows: Waiting[] }) {
  const router = useRouter();
  return (
    <div className="card rows wait mv-list">
      {rows.map((r, idx) => (
        <div key={`${r.a.id}-${idx}`} className="row click" role="link" tabIndex={0} onClick={() => router.push(`/agreements/${r.a.id}`)} onKeyDown={(e) => e.key === "Enter" && router.push(`/agreements/${r.a.id}`)}>
          <Folder color={r.a.color} w={50.909} />
          <div className="tx">
            <b>{r.title}</b>
            <div className="meta"><span><Icon name="folder_open" size={16} /><em>{r.a.name}</em></span><i /><span><Icon name="flag" size={16} />{r.meta}</span></div>
          </div>
          <span className="amt w-d">{usd(r.amt)}</span>
          <span className="w-d"><StatusBadge status={r.b} /></span>
          <div className="rr w-m"><span className="amt">{usd(r.amt)}</span><StatusBadge status={r.b} iconOnly /></div>
          <Button variant="sec" h={28} onClick={(e) => { e.stopPropagation(); r.btn[1](); }}>{r.btn[0]}</Button>
        </div>
      ))}
    </div>
  );
}

/** Design activityHtml(): icon tile, title, sub · when, hash */
export function ActivityList({ items, noAg, freshIds }: { items: ActivityRow[]; noAg?: boolean; freshIds?: Set<string> }) {
  const now = useNow();
  const { explorer } = useActions();
  if (!items.length) return <Empty title="No activity yet" body="Funding, approvals and payments show up here with their Stellar transaction." />;
  return (
    <div className="card rows act mv-list">
      {items.map((x) => {
        const [i, c, b] = ACT[x.e.kind] ?? ACT.create!;
        const sub = noAg ? x.sub.replace(/^[^·]+· /, "") : x.sub;
        const when = relTime(x.e.at, now);
        return (
          <div className={`row${freshIds?.has(x.e.id) ? " fresh" : ""}`} key={x.e.id}>
            <span className="tile" style={{ width: 36, height: 36, background: b }}><Icon name={i} size={18} color={c} /></span>
            <div className="tx"><b>{x.title}</b><small>{sub}{x.e.hash ? ` · ${when}` : ""}</small></div>
            {x.e.hash
              ? <button className="hash" onClick={() => explorer(x.e.hash!)}>{shortHash(x.e.hash)}<Icon name="external" size={14} /></button>
              : <span className="when">{when}</span>}
          </div>
        );
      })}
    </div>
  );
}

/** Design msRows(): milestone list with role-aware inline actions */
export function MilestoneRows({ a, withActions = true }: { a: MockAgreement; withActions?: boolean }) {
  const me = useChain((s) => s.me)!;
  const now = useNow();
  const { startTx } = useUI.getState();
  const ci = curIdx(a);
  const isClient = a.client === me;
  const acc = accepted(a);
  return (
    <div className="card rows ms mv-list">
      {a.ms.map((m, i) => {
        let sub = m.desc || "";
        if (m.status === "paid") sub = `Released ${m.paidAt ? relTime(m.paidAt, now).toLowerCase() : ""}`;
        else if (m.status === "submitted") sub = `Submitted ${relTime(m.submittedAt!, now).toLowerCase()} · ${m.link}`;
        else if (m.status === "approved") sub = "Approved, waiting for release";
        else if (isFunded(a) && acc && i > ci) sub = `Starts after milestone ${i}`;
        else if (isFunded(a) && acc && i === ci) sub = isClient ? "In progress" : "Ready for you";
        let btn: React.ReactNode = null;
        if (withActions && a.status === "active") {
          if (isClient && m.status === "submitted") btn = <Button h={28} onClick={() => startTx("approve", { id: a.id, i })}>Approve</Button>;
          if (isClient && m.status === "approved") btn = <Button h={28} onClick={() => startTx("release", { id: a.id, i })}>Release</Button>;
          if (!isClient && i === ci && m.status === "pending") btn = <Button h={28} onClick={() => startTx("submit", { id: a.id, i })}>Submit</Button>;
        }
        return (
          <div className="row ms-row" key={i}>
            <span className="seq">{i + 1}</span>
            <div className="tx">
              <b>{m.title}</b>
              <small>{sub || " "}</small>
              <div className="ab w-m"><span className="amt">{usd(m.amount)}</span><StatusBadge status={m.status} /></div>
              {btn && <div className="w-m">{btn}</div>}
            </div>
            <span className="amt w-d">{usd(m.amount)}</span>
            <div className="bcol w-d" style={{ width: 110 }}><StatusBadge status={m.status} /></div>
            {btn && <span className="w-d">{btn}</span>}
          </div>
        );
      })}
    </div>
  );
}

/** Design agreements list row */
export function AgreementRow({ a }: { a: MockAgreement }) {
  const me = useChain((s) => s.me)!;
  const st = agState(a), p = paidN(a), n = a.ms.length;
  const isClient = a.client === me;
  let s = `${p} of ${n} paid`;
  if (st === "awaitc") s = isClient ? "waiting to accept" : "review the terms";
  if (st === "awaiting") s = "not funded yet";
  if (st === "cancel_requested") s = "cancellation requested";
  if (isClient && a.ms.some((m) => m.status === "submitted")) s = "1 to approve";
  if (isClient && a.ms.some((m) => m.status === "approved") && !a.ms.some((m) => m.status === "submitted")) s = "1 to release";
  const meta = `${getPerson(otherOf(a, me)).name} · ${isClient ? "As client" : "As contributor"} · ${s}`;
  const esc2 = a.status === "completed" ? "Paid in full" : a.status === "cancelled" || a.status === "declined" ? (a.refunded ? `${fmt(a.refunded)} refunded` : "Nothing locked") : `${fmt(locked(a))} in escrow`;
  return (
    <Link className="row click" href={`/agreements/${a.id}`}>
      <Folder color={a.color} w={50.909} />
      <div className="tx">
        <b>{a.name}</b>
        <small>{meta}</small>
        <div className="prog">{a.ms.map((m, i) => <i key={i} className={m.status === "paid" ? "g" : m.status === "submitted" ? "y" : m.status === "approved" ? "b" : ""} />)}</div>
      </div>
      <div className="amt w-d">{usd(total(a))}<small>{esc2}</small></div>
      <div className="bcol w-d" style={{ width: 150 }}><StatusBadge status={st} /></div>
      <div className="rc w-m"><div className="amt">{usd(total(a))}<small>{esc2}</small></div><StatusBadge status={st} /></div>
    </Link>
  );
}
