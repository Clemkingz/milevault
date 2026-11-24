"use client";

import { useEffect, useRef, useState } from "react";
import { ApiError, dayGroup, money, relTime, shortHash, type TxType } from "@milevault/api";
import { Button, Icon, StatusBadge } from "@milevault/ui";
import { Empty, ErrorState, PageHeader, Pager } from "@/components/bits";
import { Page } from "@/components/shell/page";
import { ListSkeleton } from "@/components/shell/skeleton";
import { useActions } from "@/components/use-actions";
import { api } from "@/lib/backend";
import { txLabel } from "@/lib/domain";
import { useTransactions } from "@/lib/queries";
import { useUI } from "@/lib/ui";

const TAGS: [TxType, string][] = [["all", "All"], ["fund", "Funding"], ["release", "Releases"], ["refund", "Refunds"], ["other", "Other"]];

/** GET /transactions (+ /transactions/export) */
export function TransactionsView() {
  const [type, setType] = useState<TxType>("all");
  const [q, setQ] = useState(""); const [search, setSearch] = useState(""); const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const toast = useUI((s) => s.toast);
  const { explorer } = useActions();
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { const t = setTimeout(() => { setSearch(q.trim()); setPage(1); }, 300); return () => clearTimeout(t); }, [q]);
  useEffect(() => { const k = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); input.current?.focus(); } }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, []);
  const { data, isPending, error, refetch, isFetching } = useTransactions({ type, search, page });

  const exportCsv = async () => {
    setExporting(true);
    try {
      const blob = await api.overview.exportCsv({ type, search: search || undefined });
      const url = URL.createObjectURL(blob);
      Object.assign(document.createElement("a"), { href: url, download: "milevault-transactions.csv" }).click();
      URL.revokeObjectURL(url); toast("Transactions exported");
    } catch (e) { toast(e instanceof ApiError ? e.message : "Export failed", { tone: "error" }); }
    finally { setExporting(false); }
  };

  const items = data?.result ?? [];
  const groups = (["Today", "This week", "Earlier"] as const).map((g) => [g, items.filter((x) => dayGroup(x.createdAt) === g)] as const).filter((g) => g[1].length);

  return (
    <Page>
      <PageHeader title="Transactions" sub="Verified on-chain transactions on your agreements, each with its Stellar hash." actions={<Button variant="sec" h={40} icon="file" onClick={exportCsv} loading={exporting} loadingText="Preparing…" disabled={!items.length && !exporting}>Export CSV</Button>} />
      <div className="toolbar"><label className="search"><Icon name={isFetching && !isPending ? "loading" : "search"} size={16} className={isFetching && !isPending ? "spin" : undefined} /><input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search agreement, reference or hash" aria-label="Search transactions" /><span className="kbd">⌘K</span></label></div>
      <div className="filters" role="tablist">{TAGS.map(([k, l]) => <button key={k} role="tab" aria-selected={type === k} className={`tag${type === k ? " on" : ""}`} onClick={() => { setType(k); setPage(1); }}><b>{l}</b>{type === k && data && <small>{data.paginationMeta.totalCount}</small>}</button>)}</div>
      {isPending ? <ListSkeleton title={0} /> : error ? <ErrorState error={error} retry={() => refetch()} /> : groups.length ? (
        <>
          {groups.map(([g, list]) => (
            <div key={g} style={{ display: "contents" }}>
              <div className="tgroup">{g}</div>
              <div className="card rows tx mv-list">
                {list.map((x) => {
                  const t = txLabel(x); const [ic, c, b] = t.icon; const h = x.txHash;
                  const amt = x.amount ? `${t.sign > 0 ? "+" : t.sign < 0 ? "−" : ""}${money(x.amount, x.asset)}` : "—";
                  return (
                    <div className="row" key={x.id}>
                      <span className="typ" style={{ background: b }}><Icon name={ic} size={18} color={c} /></span>
                      <div className="tx"><b>{t.label}</b><small>{x.agreementName} · {x.reference}{x.milestonePosition ? ` · ${x.milestoneTitle ?? `Milestone ${x.milestonePosition}`}` : ""}</small></div>
                      <div className="rc w-m"><span className="amt">{amt}</span><StatusBadge status="confirmed" /></div>
                      <span className="amt w-d" style={t.sign > 0 ? { color: "#00A84B" } : undefined}>{amt}</span>
                      <div className="bcol w-d"><StatusBadge status="confirmed" /></div>
                      <span className="when w-d">{relTime(x.createdAt)}</span>
                      {h ? <button className="txh w-d" onClick={() => explorer(h)}>{shortHash(h)}<Icon name="external" size={14} /></button> : <span className="when w-d">—</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <Pager meta={data!.paginationMeta} page={page} onPage={setPage} />
        </>
      ) : <Empty k={search || type !== "all" ? "E-03" : "T-05"} title={search || type !== "all" ? "No transactions here" : "No transactions yet"} body={search || type !== "all" ? "Try another filter or search term." : "Funding, approvals, releases and refunds appear here once they’re confirmed on Stellar."} />}
    </Page>
  );
}
