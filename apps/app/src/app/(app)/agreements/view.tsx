"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { AgreementFilter } from "@milevault/api";
import { Button, Icon } from "@milevault/ui";
import { AgreementRow } from "@/components/agreements/lists";
import { Empty, ErrorState, PageHeader, Pager } from "@/components/bits";
import { Page } from "@/components/shell/page";
import { ListSkeleton } from "@/components/shell/skeleton";
import { useAgreements } from "@/lib/queries";

const TAGS: [AgreementFilter, string][] = [["all", "All"], ["client", "As client"], ["contributor", "As contributor"], ["needs", "Needs you"], ["completed", "Completed"]];

/** GET /agreements — filter, search (name, reference, address), pagination */
export function AgreementsView() {
  const router = useRouter();
  const params = useSearchParams();
  const filter = (TAGS.find(([k]) => k === params.get("filter"))?.[0] ?? "all") as AgreementFilter;
  const [q, setQ] = useState(params.get("q") ?? "");
  const [search, setSearch] = useState(q);
  const [page, setPage] = useState(1);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { const t = setTimeout(() => { setSearch(q.trim()); setPage(1); }, 300); return () => clearTimeout(t); }, [q]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); input.current?.focus(); } };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, []);
  const { data, isPending, error, refetch, isFetching } = useAgreements({ filter, search, page });
  const setFilter = (f: AgreementFilter) => { setPage(1); router.replace(f === "all" ? "/agreements" : `/agreements?filter=${f}`); };

  return (
    <Page>
      <PageHeader title="Agreements" sub="Every escrow you’re part of, as client or contributor — including your drafts." actions={<Link href="/agreements/new"><Button h={40} icon="add">New agreement</Button></Link>} />
      <div className="toolbar">
        <label className="search"><Icon name={isFetching && !isPending ? "loading" : "search"} size={16} className={isFetching && !isPending ? "spin" : undefined} /><input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, MV reference or address" aria-label="Search agreements" /><span className="kbd">⌘K</span></label>
      </div>
      <div className="filters" role="tablist" aria-label="Filter agreements">
        {TAGS.map(([k, l]) => <button key={k} role="tab" aria-selected={filter === k} className={`tag${filter === k ? " on" : ""}`} onClick={() => setFilter(k)}><b>{l}</b>{filter === k && data && <small>{data.paginationMeta.totalCount}</small>}</button>)}
      </div>
      {isPending ? <ListSkeleton title={0} /> : error ? <ErrorState error={error} retry={() => refetch()} />
        : data!.result.length ? (
          <>
            <div className="card rows agl mv-list" key={`${filter}-${search}-${page}`}>{data!.result.map((a) => <AgreementRow key={a.reference} a={a} />)}</div>
            <Pager meta={data!.paginationMeta} page={page} onPage={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
          </>
        ) : search || filter !== "all"
          ? <Empty title="No agreements match" body="Try another filter or search term." />
          : <Empty k="E-01" title="No agreements yet" body="Agreements you create, or that a client shares with you, show up here." action={<Link href="/agreements/new"><Button h={36} icon="add">New agreement</Button></Link>} />}
    </Page>
  );
}
