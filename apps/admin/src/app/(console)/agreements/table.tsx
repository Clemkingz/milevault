"use client";

import Link from "next/link";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { money, relTime, shortAddr, type AgreementStatus } from "@milevault/api";
import { Icon, StatusBadge } from "@milevault/ui";
import { Empty, ErrorState, PageHeader, Pager, Rows } from "@/components/bits";
import { api } from "@/lib/backend";
import { AGREEMENT_STATUSES, agreementBadge, human } from "@/lib/badge";
import { PAGE_SIZE, useListParams } from "@/lib/use-list";

export function AgreementsTable() {
  const { filters, search, q, setQ, page, set, offset } = useListParams(["status"]);
  const list = useQuery({
    queryKey: ["admin", "agreements", filters.status, search, page],
    queryFn: () => api.admin.agreements({ status: (filters.status || undefined) as AgreementStatus | undefined, search: search || undefined, limit: PAGE_SIZE, offset }),
    placeholderData: keepPreviousData,
  });
  return (
    <>
      <PageHeader title="Agreements" sub="Every escrow agreement on the platform, with its locked and released funds." />
      <div className="toolbar">
        <label className="search"><Icon name="search" size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, MV number or address" aria-label="Search agreements" /></label>
      </div>
      <div className="filters" role="tablist" aria-label="Status">
        {["", ...AGREEMENT_STATUSES].map((s) => (
          <button key={s || "all"} role="tab" aria-selected={filters.status === s} className={`tag${filters.status === s ? " on" : ""}`} onClick={() => set({ status: s || null })}><b>{s ? human(s) : "All"}</b></button>
        ))}
      </div>
      {list.isPending ? <Rows /> : list.error ? <ErrorState error={list.error} retry={() => void list.refetch()} /> : list.data.result.length === 0 ? (
        <Empty title="No agreements match" body="Try another status or search term." />
      ) : (
        <>
          <div className={`card mv-list${list.isPlaceholderData ? " dim" : ""}`}>
            {list.data.result.map((a) => (
              <Link className="trow" key={a.reference} href={`/agreements/${a.reference}`}>
                <div className="tx"><b>{a.name}</b><small>{a.reference} · {a.paidCount}/{a.milestoneCount} paid · created {relTime(a.createdAt)}</small></div>
                <div className="pairs hide-m" title={`${a.client.address} → ${a.contributor?.address ?? "no contributor yet"}`}><span className="meta">{shortAddr(a.client.address)}</span><Icon name="right" size={14} color="#A3A3A3" /><span className="meta">{a.contributor ? shortAddr(a.contributor.address) : "—"}</span></div>
                <span className="num">{money(a.total, a.asset)}<small>{Number(a.locked) > 0 ? `${money(a.locked, a.asset)} locked` : a.status === "completed" ? "Paid in full" : "Nothing locked"}</small></span>
                <div className="col-w"><StatusBadge status={agreementBadge(a)} /></div>
              </Link>
            ))}
          </div>
          <Pager meta={list.data.paginationMeta} page={page} onPage={(p) => set({ page: p })} />
        </>
      )}
    </>
  );
}
