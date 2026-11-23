"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Icon, StatusBadge } from "@milevault/ui";
import { Empty, PageHeader } from "@/components/bits";
import { Menu, MenuItem } from "@/components/shell/menus";
import { Page } from "@/components/shell/page";
import { ListSkeleton } from "@/components/shell/skeleton";
import { useActions } from "@/components/use-actions";
import { dayGroup, getPerson, relTime, shortHash, txType, usd, useActivity, useChain, useNow, useReady, useUI, type ActivityRow } from "@/mock";

type Kind = "all" | "fund" | "rel" | "ref" | "oth";
const kindOf = (x: ActivityRow): Exclude<Kind, "all"> => (x.e.kind === "fund" ? "fund" : x.e.kind === "release" ? "rel" : x.e.kind === "refund" || x.e.kind === "decline" ? "ref" : "oth");

/** PRD screen 5 — transaction history with explorer links (design txPage()) */
export function TransactionsView() {
  const ready = useReady();
  const me = useChain((s) => s.me)!;
  const now = useNow();
  const all = useActivity().filter((x) => x.e.hash);
  const [f, setF] = useState<Kind>("all");
  const [q, setQ] = useState("");
  const [role, setRole] = useState<"all" | "client" | "contributor">("all");
  const { explorer } = useActions();
  const toast = useUI((s) => s.toast);
  const search = useRef<HTMLInputElement>(null);
  const isClientish = all.some((x) => x.a.client === me);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); search.current?.focus(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const items = useMemo(() => {
    const s = q.trim().toLowerCase();
    return all
      .filter((x) => f === "all" || kindOf(x) === f)
      .filter((x) => role === "all" || (role === "client" ? x.a.client === me : x.a.contributor === me))
      .filter((x) => !s || x.a.name.toLowerCase().includes(s) || x.tsub.toLowerCase().includes(s) || getPerson(x.e.actor).addr.toLowerCase().includes(s) || x.e.hash!.includes(s));
  }, [all, f, q, role, me]);
  const groups = (["Today", "This week", "Earlier"] as const).map((g) => [g, items.filter((x) => dayGroup(x.e.at, now) === g)] as const).filter((g) => g[1].length);

  const [exporting, setExporting] = useState(false);
  const exportCsv = async () => {
    setExporting(true);
    await new Promise((r) => setTimeout(r, 500));
    const head = ["date", "type", "agreement", "agreement_id", "details", "amount_usdc", "status", "tx_hash"];
    const lines = items.map((x) => [x.e.at, txType(x.e.kind, x.incoming)[0], x.a.name, `MV-${x.a.id}`, x.tsub, x.signed ?? "", "confirmed", x.e.hash].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const blob = new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement("a"), { href: url, download: `milevault-transactions-${new Date().toISOString().slice(0, 10)}.csv` }).click();
    URL.revokeObjectURL(url);
    setExporting(false);
    toast(`Exported ${items.length} transactions`);
  };

  if (!ready) return <Page><ListSkeleton title={150} /></Page>;
  const tags: [Kind, string][] = [["all", "All"], ["fund", "Funding"], ["rel", isClientish ? "Releases" : "Payments"], ["ref", "Refunds"], ["oth", "Other"]];
  const ROLE = { all: "All roles", client: "As client", contributor: "As contributor" } as const;

  return (
    <Page>
      <PageHeader title="Transactions" sub="Every on-chain movement on your agreements, with its Stellar transaction hash." actions={<Button variant="sec" h={40} icon="file" onClick={exportCsv} disabled={!items.length} loading={exporting} loadingText="Preparing…">Export CSV</Button>} />
      <div className="toolbar">
        <label className="search"><Icon name="search" size={16} /><input ref={search} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, address or hash" aria-label="Search transactions" /><span className="kbd">⌘K</span></label>
        <Menu trigger={<button className="dd"><span>{ROLE[role]}</span><Icon name="down" size={18} /></button>}>
          {(Object.keys(ROLE) as (keyof typeof ROLE)[]).map((k) => <MenuItem key={k} icon={k === role ? "check" : "user"} onSelect={() => setRole(k)}>{ROLE[k]}</MenuItem>)}
        </Menu>
      </div>
      <div className="filters" role="tablist" aria-label="Filter transactions">
        {tags.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={f === k} className={`tag${f === k ? " on" : ""}`} onClick={() => setF(k)}>
            <b>{l}</b><small>{k === "all" ? all.length : all.filter((x) => kindOf(x) === k).length}</small>
          </button>
        ))}
      </div>
      {groups.length ? groups.map(([g, list]) => (
        <div key={g} style={{ display: "contents" }}>
          <div className="tgroup">{g}</div>
          <div className="card rows tx mv-list">
            {list.map((x) => {
              const [lab, i, c, b] = txType(x.e.kind, x.incoming);
              const amt = x.signed !== undefined ? `${x.signed > 0 ? "+" : "−"}${usd(Math.abs(x.signed))}` : "—";
              return (
                <div className="row" key={x.e.id}>
                  <span className="typ" style={{ background: b }}><Icon name={i} size={18} color={c} /></span>
                  <div className="tx"><b>{lab}</b><small>{x.tsub}</small></div>
                  <div className="rc w-m"><span className="amt">{amt}</span><StatusBadge status="confirmed" /></div>
                  <span className="amt w-d" style={x.signed && x.signed > 0 ? { color: "#00A84B" } : undefined}>{amt}</span>
                  <div className="bcol w-d"><StatusBadge status="confirmed" /></div>
                  <span className="when w-d">{relTime(x.e.at, now)}</span>
                  <button className="txh w-d" onClick={() => explorer(x.e.hash!)}>{shortHash(x.e.hash!)}<Icon name="external" size={14} /></button>
                </div>
              );
            })}
          </div>
        </div>
      )) : <Empty k={all.length ? "E-03" : "T-05"} title={all.length ? "No transactions here" : "No transactions yet"} body={all.length ? "Try another filter or search term." : "Create, fund, release and refund transactions appear here with their Stellar hash."} />}
    </Page>
  );
}
