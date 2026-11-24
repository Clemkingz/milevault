"use client";

import Link from "next/link";
import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, money, relTime, type ActionKind, type ActionStatus, type AdminTransaction } from "@milevault/api";
import { Button, Icon, StatusBadge } from "@milevault/ui";
import { Addr, Empty, ErrorState, Hash, PageHeader, Pager, Rows } from "@/components/bits";
import { api } from "@/lib/backend";
import { TX_KINDS, TX_STATUSES, human, txBadge } from "@/lib/badge";
import { toast } from "@/lib/toast";
import { PAGE_SIZE, useListParams } from "@/lib/use-list";

/** Re-check only applies to open transactions; settled ones answer 409 ACTION_ALREADY_SETTLED. */
const open = (t: AdminTransaction) => t.status === "pending" || t.status === "prepared" || !!t.stuck;

export function TransactionsView() {
  const qc = useQueryClient();
  const { filters, search, q, setQ, page, set, offset } = useListParams(["status", "kind", "stuck"]);
  const stuck = filters.stuck === "1";
  const list = useQuery({
    queryKey: ["admin", "transactions", filters, search, page],
    queryFn: () => api.admin.transactions({ status: (filters.status || undefined) as ActionStatus | undefined, kind: (filters.kind || undefined) as ActionKind | undefined, stuck, search: search || undefined, limit: PAGE_SIZE, offset }),
    placeholderData: keepPreviousData,
  });
  const [busy, setBusy] = useState<string | null>(null);
  const reconcile = useMutation({
    mutationFn: (id: string) => { setBusy(id); return api.admin.reconcile(id); },
    onSuccess: (t) => { toast(`Re-checked on Stellar · now ${human(String(t.status ?? "updated"))}`); void qc.invalidateQueries({ queryKey: ["admin"] }); },
    onError: (e) => {
      if (e instanceof ApiError && e.code === "ACTION_ALREADY_SETTLED") { toast("Already settled. Refreshed the list.", "info"); void qc.invalidateQueries({ queryKey: ["admin"] }); return; }
      toast(e instanceof ApiError ? e.message : "Couldn’t re-check this transaction.", "error");
    },
    onSettled: () => setBusy(null),
  });

  return (
    <>
      <PageHeader title="Transactions" sub="Every on-chain escrow action submitted through MileVault. A transaction pending for over 5 minutes is stuck: Re-check asks Stellar for its final state." />
      <div className="toolbar">
        <label className="search"><Icon name="search" size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search MV number, hash or signer" aria-label="Search transactions" /></label>
        <select className="adm-select" value={filters.kind} onChange={(e) => set({ kind: e.target.value || null })} aria-label="Kind">
          <option value="">All kinds</option>
          {TX_KINDS.map((k) => <option key={k} value={k}>{human(k)}</option>)}
        </select>
        <button className={`tag${stuck ? " on" : ""}`} aria-pressed={stuck} onClick={() => set({ stuck: stuck ? null : "1" })}><Icon name="alert" size={14} /><b>Stuck only</b></button>
      </div>
      <div className="filters" role="tablist" aria-label="Status">
        {["", ...TX_STATUSES].map((s) => (
          <button key={s || "all"} role="tab" aria-selected={filters.status === s} className={`tag${filters.status === s ? " on" : ""}`} onClick={() => set({ status: s || null })}><b>{s ? human(s) : "All"}</b></button>
        ))}
      </div>
      {list.isPending ? <Rows /> : list.error ? <ErrorState error={list.error} retry={() => void list.refetch()} /> : list.data.result.length === 0 ? (
        <Empty title={stuck ? "Nothing stuck" : "No transactions match"} body={stuck ? "Every submitted transaction has settled." : "Try another filter or search term."} />
      ) : (
        <>
          <div className={`card mv-list${list.isPlaceholderData ? " dim" : ""}`}>
            {list.data.result.map((t) => {
              const ref = t.reference ?? t.agreement?.reference;
              return (
                <div className="trow" key={t.id}>
                  <div className="tx">
                    <b>{human(String(t.kind ?? "Transaction"))}{t.milestonePosition ? ` · milestone ${t.milestonePosition}` : ""}</b>
                    <small>{ref ? <Link className="link" href={`/agreements/${ref}`}>{t.agreementName ?? t.agreement?.name ?? ref} · {ref}</Link> : "—"} · {relTime(t.createdAt)}{t.status === "failed" && (t.failureCode || t.failure) ? <span className="adm-err" title={t.failure ?? undefined}> · {t.failureCode ?? t.failure}</span> : null}</small>
                  </div>
                  <span className="hide-m">{t.wallet ?? t.signer ? <Addr a={String(t.wallet ?? t.signer)} /> : null}</span>
                  <span className="num">{t.amount ? money(t.amount, typeof t.asset === "string" ? t.asset : undefined) : "—"}</span>
                  <div className="col-w">{t.stuck ? <StatusBadge status="cancel_requested" label="Stuck" /> : <StatusBadge status={txBadge(t.status)} />}</div>
                  <span className="hide-m"><Hash h={t.hash} url={t.explorerUrl} /></span>
                  {open(t) ? (
                    <Button variant="sec" h={28} loading={busy === t.id} loadingText="Checking…" disabled={!!busy} onClick={() => reconcile.mutate(t.id)}>Re-check</Button>
                  ) : <span className="adm-rc-sp" />}
                </div>
              );
            })}
          </div>
          <Pager meta={list.data.paginationMeta} page={page} onPage={(p) => set({ page: p })} />
        </>
      )}
    </>
  );
}
