"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Icon } from "@milevault/ui";
import { AgreementRow } from "@/components/agreements/lists";
import { Empty, PageHeader } from "@/components/bits";
import { Menu, MenuItem } from "@/components/shell/menus";
import { Page } from "@/components/shell/page";
import { ListSkeleton } from "@/components/shell/skeleton";
import { curIdx, otherOf, getPerson, total, useChain, useMyAgreements, useReady, type MockAgreement } from "@/mock";

type Tag = "all" | "client" | "contrib" | "needs" | "done";
type Sort = "recent" | "amount" | "name";
const SORTS: Record<Sort, string> = { recent: "Most recent", amount: "Largest amount", name: "Name A–Z" };

export function AgreementsView() {
  const ready = useReady();
  const me = useChain((s) => s.me)!;
  const mine = useMyAgreements();
  const [tag, setTag] = useState<Tag>("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("recent");
  const search = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); search.current?.focus(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const needs = (a: MockAgreement) =>
    a.client === me
      ? a.status === "created" || (a.status === "active" && a.ms.some((m) => m.status === "submitted" || m.status === "approved")) || (a.status === "cancel_requested" && a.cancelRequestedBy !== me)
      : (a.status === "funded") || (a.status === "active" && a.ms[curIdx(a)]?.status === "pending") || (a.status === "cancel_requested" && a.cancelRequestedBy !== me);
  const tags: [Tag, string, (a: MockAgreement) => boolean][] = [
    ["all", "All", () => true],
    ["client", "As client", (a) => a.client === me],
    ["contrib", "As contributor", (a) => a.contributor === me],
    ["needs", "Needs you", needs],
    ["done", "Completed", (a) => a.status === "completed"],
  ];
  const fn = tags.find((t) => t[0] === tag)![2];
  const items = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = mine.filter(fn).filter((a) => {
      if (!s) return true;
      const o = getPerson(otherOf(a, me));
      return a.name.toLowerCase().includes(s) || o.name.toLowerCase().includes(s) || o.addr.toLowerCase().includes(s) || `mv-${a.id}`.includes(s);
    });
    return list.sort((x, y) => sort === "amount" ? total(y) - total(x) : sort === "name" ? x.name.localeCompare(y.name) : y.createdAt.localeCompare(x.createdAt));
  }, [mine, fn, q, sort, me]);
  const isClientish = mine.some((a) => a.client === me);

  if (!ready) return <Page><ListSkeleton /></Page>;
  return (
    <Page>
      <PageHeader title="Agreements" sub="Every escrow you’re part of, as client or contributor." actions={isClientish ? <Link href="/agreements/new"><Button h={40} icon="add">New agreement</Button></Link> : undefined} />
      <div className="toolbar">
        <label className="search">
          <Icon name="search" size={16} />
          <input ref={search} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or address" aria-label="Search agreements" />
          <span className="kbd">⌘K</span>
        </label>
        <Menu trigger={<button className="dd"><span>{SORTS[sort]}</span><Icon name="down" size={18} /></button>}>
          {(Object.keys(SORTS) as Sort[]).map((k) => <MenuItem key={k} icon={k === sort ? "check" : "menu"} onSelect={() => setSort(k)}>{SORTS[k]}</MenuItem>)}
        </Menu>
      </div>
      <div className="filters" role="tablist" aria-label="Filter agreements">
        {tags.map(([k, l, f]) => (
          <button key={k} role="tab" aria-selected={tag === k} className={`tag${tag === k ? " on" : ""}`} onClick={() => setTag(k)}>
            <b>{l}</b><small>{mine.filter(f).length}</small>
          </button>
        ))}
      </div>
      {items.length ? (
        <div className="card rows agl mv-list" key={tag + sort}>{items.map((a) => <AgreementRow key={a.id} a={a} />)}</div>
      ) : mine.length ? (
        <Empty title="No agreements match" body="Try another filter or search term." />
      ) : (
        <Empty k="E-01" title="No agreements yet" body="Agreements you create, or that a client shares with you, show up here."
          action={<Link href="/agreements/new"><Button h={36} icon="add">New agreement</Button></Link>} />
      )}
    </Page>
  );
}
