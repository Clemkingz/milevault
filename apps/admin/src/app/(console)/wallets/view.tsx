"use client";

import Link from "next/link";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fmtAmount, relTime, shortAddr } from "@milevault/api";
import { Icon } from "@milevault/ui";
import { Empty, ErrorState, PageHeader, Pager, Rows } from "@/components/bits";
import { api } from "@/lib/backend";
import { PAGE_SIZE, useListParams } from "@/lib/use-list";

const num = (v: unknown) => (typeof v === "number" ? v : undefined);
const str = (v: unknown) => (typeof v === "string" ? v : undefined);

export function WalletsView() {
  const { search, q, setQ, page, set, offset } = useListParams([]);
  const list = useQuery({
    queryKey: ["admin", "wallets", search, page],
    queryFn: () => api.admin.wallets({ search: search || undefined, limit: PAGE_SIZE, offset }),
    placeholderData: keepPreviousData,
  });
  return (
    <>
      <PageHeader title="Wallets" sub="Every wallet that is a party to an agreement, with its activity as client and contributor." />
      <div className="toolbar"><label className="search"><Icon name="search" size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search address" aria-label="Search wallets" /></label></div>
      {list.isPending ? <Rows /> : list.error ? <ErrorState error={list.error} retry={() => void list.refetch()} /> : list.data.result.length === 0 ? (
        <Empty title="No wallets match" body="Search by the full address or part of it." />
      ) : (
        <>
          <div className={`card mv-list${list.isPlaceholderData ? " dim" : ""}`}>
            {list.data.result.map((w) => {
              const asC = num(w.asClient), asK = num(w.asContributor), last = str(w.lastActiveAt);
              return (
                <Link className="trow" key={w.address} href={`/wallets/${w.address}`}>
                  <span className="av" style={{ width: 36, height: 36, background: "#F5F5F4", color: "#525252" }}><Icon name="wallet" size={18} /></span>
                  <div className="tx"><b title={w.address}>{w.shortAddress ?? shortAddr(w.address)}</b><small>{w.agreements ?? 0} agreement{w.agreements === 1 ? "" : "s"}{asC !== undefined ? ` · ${asC} as client · ${asK ?? 0} as contributor` : ""}</small></div>
                  {w.funded !== undefined && <span className="num hide-m">{fmtAmount(String(w.funded))}<small>funded as client</small></span>}
                  {w.earned !== undefined && <span className="num hide-m">{fmtAmount(String(w.earned))}<small>earned</small></span>}
                  <span className="meta hide-m">{last ? relTime(last) : ""}</span>
                </Link>
              );
            })}
          </div>
          <Pager meta={list.data.paginationMeta} page={page} onPage={(p) => set({ page: p })} />
        </>
      )}
    </>
  );
}
