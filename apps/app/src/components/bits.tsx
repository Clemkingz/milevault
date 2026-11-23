"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@milevault/ui";
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
