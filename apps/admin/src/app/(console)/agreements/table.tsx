"use client";

import { useMemo, useState } from "react";
import { Icon, StatusBadge, type BadgeKind } from "@milevault/ui";
import { Avatar, Empty, PageHeader } from "@/components/bits";
import { AGREEMENTS, wallet } from "@/lib/data";
import { relTime, usd } from "@/lib/format";

const TAGS: [string, string, (s: BadgeKind) => boolean][] = [
  ["all", "All", () => true],
  ["open", "Open", (s) => ["awaiting", "funded", "progress"].includes(s)],
  ["attention", "Cancel pending", (s) => s === "cancel_requested"],
  ["done", "Completed", (s) => s === "completed"],
  ["closed", "Cancelled / declined", (s) => s === "cancelled" || s === "declined"],
];

export function AgreementsTable() {
  const [tag, setTag] = useState("all");
  const [q, setQ] = useState("");
  const fn = TAGS.find((t) => t[0] === tag)![2];
  const items = useMemo(() => {
    const s = q.trim().toLowerCase();
    return AGREEMENTS.filter((a) => fn(a.status)).filter((a) =>
      !s || a.name.toLowerCase().includes(s) || `mv-${a.id}`.includes(s) || [a.client, a.contributor].some((x) => x.toLowerCase().includes(s) || wallet(x).name.toLowerCase().includes(s)));
  }, [fn, q]);
  return (
    <>
      <PageHeader title="Agreements" sub="Every escrow agreement on the platform, with its locked and released funds." />
      <div className="toolbar">
        <label className="search"><Icon name="search" size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, MV number, wallet or address" aria-label="Search agreements" /></label>
      </div>
      <div className="filters" role="tablist">
        {TAGS.map(([k, l, f]) => (
          <button key={k} role="tab" aria-selected={tag === k} className={`tag${tag === k ? " on" : ""}`} onClick={() => setTag(k)}><b>{l}</b><small>{AGREEMENTS.filter((a) => f(a.status)).length}</small></button>
        ))}
      </div>
      {items.length ? (
        <div className="card mv-list" key={tag}>
          {items.map((a) => {
            const c = wallet(a.client), k = wallet(a.contributor);
            return (
              <div className="trow" key={a.id}>
                <div className="tx"><b>{a.name}</b><small>MV-{a.id} · {a.paid}/{a.milestones} paid · created {relTime(a.createdAt)}</small></div>
                <div className="pairs hide-m" title={`${c.name} → ${k.name}`}><Avatar w={c} size={24} /><Icon name="right" size={14} color="#A3A3A3" /><Avatar w={k} size={24} /></div>
                <span className="num">{usd(a.total)}<small>{a.locked ? `${usd(a.locked)} locked` : a.status === "completed" ? "Paid in full" : "Nothing locked"}</small></span>
                <div className="col-w"><StatusBadge status={a.status} /></div>
              </div>
            );
          })}
        </div>
      ) : <Empty title="No agreements match" body="Try another filter or search term." />}
    </>
  );
}
