"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { ApiError, relTime, shortAddr, shortHash, type PaginationMeta } from "@milevault/api";
import { Button, Icon } from "@milevault/ui";
import { api } from "@/lib/backend";
import { ARBITER, human } from "@/lib/badge";
import { toast } from "@/lib/toast";

export function PageHeader({ title, sub, actions, back }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode; back?: [string, string] }) {
  return (
    <header className="phd">
      <div className="phd-tx">
        {back && <Link className="adm-back" href={back[0]}><Icon name="left" size={16} />{back[1]}</Link>}
        <h1>{title}</h1>{sub && <p>{sub}</p>}
      </div>
      {actions && <div className="phd-acts">{actions}</div>}
    </header>
  );
}

export function Section({ title, href, children, aside }: { title: string; href?: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="sect" aria-label={title}>
      <div className="sh"><h3>{title}</h3>{aside}{href && <Link className="link" href={href}>See all</Link>}</div>
      {children}
    </section>
  );
}

export function KV({ rows }: { rows: [ReactNode, ReactNode][] }) {
  return <div className="kvs">{rows.map(([k, v], i) => <div key={i}><span>{k}</span><b>{v}</b></div>)}</div>;
}

export function Empty({ title, body, img = "e-03", action }: { title: string; body?: string; img?: string; action?: ReactNode }) {
  return <div className="card empty"><div className="ill"><img src={`/admin/images/${img}.webp`} alt="" /></div><b>{title}</b>{body && <p>{body}</p>}{action}</div>;
}

export function ErrorState({ error, retry }: { error: unknown; retry?: () => void }) {
  const msg = error instanceof Error ? error.message : "Something went wrong loading this.";
  const ref = error instanceof ApiError && error.requestId ? ` (ref ${error.requestId})` : "";
  return <Empty img="w-05e" title="Couldn’t load this" body={msg + ref} action={retry ? <Button variant="sec" h={36} icon="refresh" iconSize={16} onClick={retry}>Try again</Button> : undefined} />;
}

/** Shimmer rows while a list loads */
export function Rows({ n = 5 }: { n?: number }) {
  return <div className="card" aria-busy="true" aria-label="Loading">{Array.from({ length: n }, (_, i) => <div className="trow" key={i}><span className="sk" style={{ width: 36, height: 36, borderRadius: 10 }} /><div className="tx"><span className="sk" style={{ width: "40%", height: 14 }} /><span className="sk" style={{ width: "60%", height: 12, marginTop: 6 }} /></div><span className="sk" style={{ width: 80, height: 14 }} /></div>)}</div>;
}

export function Pager({ meta, page, onPage }: { meta?: PaginationMeta; page: number; onPage: (p: number) => void }) {
  if (!meta || meta.totalPage <= 1) return null;
  return (
    <div className="pager">
      <span>Page {meta.currentPage} of {meta.totalPage} · {meta.totalCount} total</span>
      <div className="btns">
        <Button variant="sec" h={32} icon="left" disabled={!meta.previousPage} onClick={() => onPage(page - 1)}>Previous</Button>
        <Button variant="sec" h={32} trailingIcon="right" disabled={!meta.nextPage} onClick={() => onPage(page + 1)}>Next</Button>
      </div>
    </div>
  );
}

/** Full address, shortened, click to copy */
export function Addr({ a, link = true }: { a?: string | null; link?: boolean }) {
  if (!a) return <>—</>;
  const copy = () => { void navigator.clipboard?.writeText(a); toast("Address copied", "info"); };
  return (
    <span className="addr" title={a}>
      {link ? <Link href={`/wallets/${a}`}>{shortAddr(a)}</Link> : shortAddr(a)}
      <button type="button" onClick={copy} aria-label="Copy address"><Icon name="copy" size={14} /></button>
    </span>
  );
}

export function useExplorer() {
  const { data } = useQuery({ queryKey: ["network"], queryFn: api.stellar.network, staleTime: Infinity });
  return data?.explorerUrl ?? "https://stellar.expert/explorer/testnet";
}

export function Hash({ h, url }: { h?: string | null; url?: string | null }) {
  const base = useExplorer();
  if (!h) return <span className="meta">—</span>;
  return <a className="txh" href={url ?? `${base}/tx/${h}`} target="_blank" rel="noopener">{shortHash(h)}<Icon name="external" size={14} /></a>;
}

/* ---------- tolerant renderer for undocumented admin payloads ---------- */
const ISO = /^\d{4}-\d{2}-\d{2}T/;
const ADDR = /^G[A-Z2-7]{55}$/;
function Value({ v }: { v: unknown }) {
  if (v === null || v === undefined || v === "") return <>—</>;
  if (typeof v === "boolean") return <span className={`statusdot ${v ? "" : "down"}`}><i />{v ? "Yes" : "No"}</span>;
  if (typeof v === "string") {
    if (["up", "ok", "healthy"].includes(v)) return <span className="statusdot"><i />{human(v)}</span>;
    if (["down", "error", "unhealthy"].includes(v)) return <span className="statusdot down"><i />{human(v)}</span>;
    if (["degraded", "warn", "lagging", "low_xlm"].includes(v)) return <span className="statusdot warn"><i />{ARBITER[v]?.[1] ?? human(v)}</span>;
    if (["missing_trustline", "missing_account", "not_configured", "failed"].includes(v)) return <span className="statusdot down"><i />{ARBITER[v]?.[1] ?? human(v)}</span>;
    if (v === "unknown") return <span className="statusdot idle"><i />Unknown</span>;
    if (ISO.test(v)) { const d = new Date(v); return <span title={d.toLocaleString()}>{d.getTime() > Date.now() + 60e3 ? d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : relTime(v)}</span>; }
    if (ADDR.test(v)) return <Addr a={v} link={false} />;
    if (/^[A-Z0-9]{1,12}:G[A-Z2-7]{55}$/.test(v)) return <>{v.split(":")[0]} <span className="meta">· {shortAddr(v.split(":")[1])}</span></>;
    return <>{v}</>;
  }
  if (typeof v === "number") return <>{v.toLocaleString()}</>;
  if (Array.isArray(v)) return <>{v.length ? v.map((x) => (typeof x === "object" ? JSON.stringify(x) : String(x))).join(", ") : "None"}</>;
  return <code className="json">{JSON.stringify(v)}</code>;
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

/** Renders any JSON object as labelled sections: flat values as one card, nested objects as their own. */
export function DataView({ data, skip = [] }: { data: unknown; skip?: string[] }) {
  if (!isObj(data)) return <KV rows={[["Value", <Value key="v" v={data} />]]} />;
  const entries = Object.entries(data).filter(([k]) => !skip.includes(k));
  const flat = entries.filter(([, v]) => !isObj(v));
  const nested = entries.filter(([, v]) => isObj(v)) as [string, Record<string, unknown>][];
  return (
    <>
      {flat.length > 0 && <KV rows={flat.map(([k, v]) => [human(k), <Value key={k} v={v} />])} />}
      {nested.map(([k, v]) => (
        <Section key={k} title={human(k)}>
          <KV rows={Object.entries(v).map(([k2, v2]) => [human(k2), isObj(v2) ? <Value key={k2} v={v2} /> : <Value key={k2} v={v2} />])} />
        </Section>
      ))}
    </>
  );
}

/** Read a dotted path from an unknown payload */
export function pick(o: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((x, k) => (isObj(x) ? x[k] : undefined), o);
}
