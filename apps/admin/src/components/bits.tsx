import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@milevault/ui";
import type { Wallet } from "@/lib/data";

export function PageHeader({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
  return (
    <header className="phd">
      <div className="phd-tx"><h1>{title}</h1>{sub && <p>{sub}</p>}</div>
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

export function Empty({ title, body }: { title: string; body?: string }) {
  return <div className="card empty"><div className="ill"><img src="/admin/images/e-03.webp" alt="" /></div><b>{title}</b>{body && <p>{body}</p>}</div>;
}

export function Avatar({ w, size = 32 }: { w: Wallet; size?: number }) {
  if (w.img) return <img className="av" src={`/admin/images/${w.img}.webp`} width={size} height={size} alt="" style={{ width: size, height: size, background: w.bg }} />;
  return <span className="av" style={{ width: size, height: size, background: w.bg, color: w.fg, fontSize: Math.round(size * 0.36) }}>{w.name.split(" ").map((x) => x[0]).join("")}</span>;
}

export function Hash({ h }: { h: string }) {
  return <a className="txh" href={`https://stellar.expert/explorer/testnet/tx/${h}`} target="_blank" rel="noopener">{h.slice(0, 4)}…{h.slice(-4)}<Icon name="external" size={14} /></a>;
}
