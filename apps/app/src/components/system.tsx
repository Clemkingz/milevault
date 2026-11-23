"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Button, Icon, Logo, type IconName } from "@milevault/ui";
import { HeroMediaStatic } from "./shell/hero-static";
import { env } from "@/lib/env";

/** Frame for system screens (error, not found, offline, gate) */
export function SystemFrame({ k, err, code, title, children }: { k: string; err?: boolean; code: string; title: string; children: ReactNode }) {
  return (
    <div className="lp dl sys">
      <div className="lnav dl"><a href={env.landingUrl} aria-label="MileVault home"><Logo /></a></div>
      <div className="dlwrap">
        <div className="dlcard mv-page">
          <HeroMediaStatic k={k} err={err} />
          <span className={`sys-code${err ? " err" : ""}`}>{code}</span>
          <h3>{title}</h3>
          {children}
        </div>
      </div>
    </div>
  );
}

export function SafeList({ items }: { items: string[] }) {
  return <ul className="safe">{items.map((x) => <li key={x}><Icon name="check_circle" size={16} />{x}</li>)}</ul>;
}

/** Jump to an agreement by its MV number */
export function AgreementLookup() {
  const router = useRouter();
  const [v, setV] = useState("");
  const [err, setErr] = useState<string>();
  const go = () => {
    const id = v.trim().toUpperCase().replace(/^MV-?/, "");
    if (!/^\d{1,10}$/.test(id)) return setErr("Enter a number like MV-1042");
    router.push(`/agreements/${id}`);
  };
  return (
    <div className="fld">
      <label className="lbl" htmlFor="lookup">Looking for an agreement?</label>
      <div className={`inp${err ? " err" : ""}`} style={{ padding: "6px 6px 6px 11px" }}>
        <Icon name="search" size={16} color="#A3A3A3" />
        <input id="lookup" value={v} placeholder="MV-1042" onChange={(e) => { setV(e.target.value); setErr(undefined); }} onKeyDown={(e) => e.key === "Enter" && go()} autoCapitalize="characters" />
        <Button h={32} onClick={go}>Open</Button>
      </div>
      {err && <div className="hint err"><Icon name="warning" size={16} />{err}</div>}
    </div>
  );
}

export function QuickLinks({ links }: { links: [string, string, IconName][] }) {
  return (
    <div className="qlinks">
      {links.map(([href, label, icon]) => <a key={href} href={href}><Icon name={icon} size={18} />{label}</a>)}
    </div>
  );
}
