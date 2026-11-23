"use client";

import { useState } from "react";
import { Button, Icon } from "@milevault/ui";
import { Avatar, PageHeader } from "@/components/bits";
import { AGREEMENTS, WALLETS } from "@/lib/data";
import { mid, relTime, usd } from "@/lib/format";

/** Wallets on the platform. Flagging is local in demo mode — the backend owns it in production. */
export function WalletsTable() {
  const [flags, setFlags] = useState<Record<string, boolean>>(() => Object.fromEntries(WALLETS.map((w) => [w.addr, !!w.flagged])));
  const [q, setQ] = useState("");
  const rows = WALLETS.filter((w) => !q.trim() || w.name.toLowerCase().includes(q.toLowerCase()) || w.addr.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHeader title="Wallets" sub="Clients and contributors, their activity, and review flags." />
      <div className="toolbar"><label className="search"><Icon name="search" size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or address" aria-label="Search wallets" /></label></div>
      <div className="card mv-list">
        {rows.map((w) => {
          const asClient = AGREEMENTS.filter((a) => a.client === w.addr);
          const asContrib = AGREEMENTS.filter((a) => a.contributor === w.addr);
          const volume = asClient.reduce((s, a) => s + a.total, 0);
          const flagged = flags[w.addr];
          return (
            <div className="trow" key={w.addr}>
              <Avatar w={w} size={36} />
              <div className="tx"><b>{w.name}</b><small>{mid(w.addr)} · {asClient.length} as client · {asContrib.length} as contributor</small></div>
              <span className="num hide-m">{usd(volume)}<small>funded as client</small></span>
              <span className="meta hide-m">{relTime(w.lastActive)}</span>
              <div className="col-w" style={{ gap: 8 }}>
                {flagged && <span className="badge"><Icon name="alert" size={16} color="#FE393B" />Flagged</span>}
                <Button variant={flagged ? "sec" : "ghost"} h={28} onClick={() => setFlags((f) => ({ ...f, [w.addr]: !f[w.addr] }))}>{flagged ? "Clear" : "Flag"}</Button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
