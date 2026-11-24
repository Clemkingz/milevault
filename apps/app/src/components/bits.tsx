"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Button, Icon, type IconName } from "@milevault/ui";
import { parseAsset, shortAddr } from "@milevault/api";
import { Ill } from "./art";
import { useActions } from "./use-actions";

/** Design `sh()` section header with optional "See all" link */
export function SectionHead({ title, href, onClick, label = "See all" }: { title: string; href?: string; onClick?: () => void; label?: string }) {
  return (
    <div className="sh">
      <h3>{title}</h3>
      {href ? <Link className="link" href={href}>{label}</Link> : onClick ? <button className="link" onClick={onClick}>{label}</button> : null}
    </div>
  );
}

/** Design `kv()` key/value block. Third tuple item = explorer hash. */
export function KV({ rows, className }: { rows: [ReactNode, ReactNode, string?][]; className?: string }) {
  const { explorer } = useActions();
  return (
    <div className={className ? `kvs ${className}` : "kvs"}>
      {rows.map(([k, v, hash], i) => (
        <div key={i}>
          <span>{k}</span>
          {hash ? (
            <button className="xl" onClick={() => explorer(hash)}>{v}<Icon name="external" size={14} /></button>
          ) : (
            <b>{v}</b>
          )}
        </div>
      ))}
    </div>
  );
}

export function Note({ children, icon = "info" }: { children: ReactNode; icon?: IconName }) {
  return <div className="note"><Icon name={icon} size={16} /><span>{children}</span></div>;
}

export function Empty({ title, body, k = "E-03", action }: { title: string; body?: string; k?: string; action?: ReactNode }) {
  return (
    <div className="card empty">
      <Ill k={k} />
      <b>{title}</b>
      {body && <p>{body}</p>}
      {action && <div style={{ marginTop: 12 }}>{action}</div>}
    </div>
  );
}

export function Back({ href, label }: { href: string; label: string }) {
  return <Link className="back" href={href}><Icon name="left" size={16} />{label}</Link>;
}

/** Page header: title + supporting line + actions (title moves to the top bar on mobile) */
export function PageHeader({ title, sub, actions, eyebrow }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <header className="phd">
      <div className="phd-tx">
        {eyebrow && <span className="phd-eb">{eyebrow}</span>}
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {actions && <div className="phd-acts">{actions}</div>}
    </header>
  );
}

/** A titled block of content; sections are spaced consistently by the page grid */
export function Section({ title, href, onClick, label, children, className, aside }: { title?: string; href?: string; onClick?: () => void; label?: string; children: ReactNode; className?: string; aside?: ReactNode }) {
  return (
    <section className={className ? `sect ${className}` : "sect"} aria-label={title}>
      {title && <div className="sh"><h3>{title}</h3>{aside}{href ? <Link className="link" href={href}>{label ?? "See all"}</Link> : onClick ? <button className="link" onClick={onClick}>{label ?? "See all"}</button> : null}</div>}
      {children}
    </section>
  );
}

/** Page title (desktop; mobile shows it in the top bar) */
export function PageTitle({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  if (!actions) return <div className="pt">{children}</div>;
  return <div className="phead"><div className="pt" style={{ padding: 0 }}>{children}</div>{actions}</div>;
}

/** Server pagination controls (paginationMeta) */
export function Pager({ meta, page, onPage }: { meta?: { currentPage: number; totalPage: number; totalCount: number; nextPage: boolean; previousPage: boolean }; page: number; onPage: (p: number) => void }) {
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

/** Asset with its issuer (backend asks to always show the issuer next to the code) */
export function AssetPill({ id }: { id: string }) {
  const a = parseAsset(id);
  return <span className="asset-pill" title={a.issuer ?? "Native XLM"}><i><Icon name={a.native ? "coin" : "usdc"} size={14} color={a.native ? "#2EBEF2" : "#2775CA"} /></i>{a.code}{a.issuer && <small>{shortAddr(a.issuer)}</small>}</span>;
}

export function ErrorState({ error, retry }: { error: unknown; retry?: () => void }) {
  const msg = error instanceof Error ? error.message : "Something went wrong loading this.";
  return <Empty k="W-05E" title="Couldn’t load this" body={msg} action={retry ? <Button variant="sec" h={36} icon="refresh" iconSize={16} onClick={retry}>Try again</Button> : undefined} />;
}
