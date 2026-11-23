"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Button, Icon, Logo, VaultLoader, useScrolled, type IconName } from "@milevault/ui";
import { env } from "@/lib/env";
import { signIn, signOut, useOperator } from "./session";

const NAV: [string, string, IconName][] = [
  ["/overview", "Overview", "home"],
  ["/agreements", "Agreements", "file"],
  ["/wallets", "Wallets", "user"],
  ["/transactions", "Transactions", "transfer"],
  ["/system", "System", "shield"],
];
const on = (p: string, h: string) => p === h || p.startsWith(`${h}/`);

function Gate() {
  return (
    <div className="lp dl sys">
      <div className="lnav dl"><Logo /><span className="adm-chip">Operator console</span></div>
      <div className="dlwrap">
        <div className="dlcard mv-page">
          <div className="hmedia"><img className="sky" src="/admin/images/sky.webp" alt="" /><img className="hil" src="/admin/images/w-01.webp" alt="" /><span className="knot" /></div>
          <span className="sys-code">Restricted</span>
          <h3>Sign in to the operator console</h3>
          <p>Monitor agreements, escrow and on-chain activity across MileVault. Access is limited to operator wallets approved by the backend.</p>
          {env.dataSource === "mock"
            ? <Button h={44} icon="key" iconSize={16} onClick={signIn}>Continue as demo operator</Button>
            : <Button h={44} icon="key" iconSize={16} disabled>Operator sign-in (connect backend)</Button>}
          <div className="note"><Icon name="lock" size={16} /><span>{env.dataSource === "mock" ? "Demo mode: sample data, no backend calls." : "Sign-in is handled by the external MileVault backend."}</span></div>
        </div>
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { ready, operator } = useOperator();
  const top = useScrolled<HTMLDivElement>();
  if (!ready) return <VaultLoader fullscreen label="Opening the operator console" />;
  if (!operator) return <Gate />;
  const title = NAV.find(([h]) => on(pathname, h))?.[1] ?? "Admin";
  return (
    <div className="app">
      <a href="#main" className="skip">Skip to content</a>
      <aside className="side" aria-label="Admin navigation">
        <div className="top">
          <Link href="/overview" className="side-brand" aria-label="Admin overview">
            <Logo className="full" /><Logo className="mark" markOnly />
          </Link>
          <span className="adm-chip side-adm">Operator console</span>
          <nav className="nav" aria-label="Main">
            <div className="nav-g">
              <span className="nav-l">Monitor</span>
              {NAV.map(([h, l, i]) => (
                <Link key={h} href={h} className={on(pathname, h) ? "on" : undefined} aria-current={on(pathname, h) ? "page" : undefined} title={l}>
                  <Icon name={i} size={24} /><span className="nl">{l}</span>
                </Link>
              ))}
            </div>
          </nav>
        </div>
        <div className="bot">
          <div className="user" style={{ cursor: "default" }}>
            <span className="av" style={{ width: 36, height: 36, background: "#EAF8FE", color: "#1A9ACB" }}><Icon name="shield" size={18} /></span>
            <div className="ut"><div className="nm">{operator.name}</div><div className="wl"><span className="gdot" /><span className="ad">{env.dataSource === "mock" ? "Demo data" : "Live"}</span></div></div>
            <button className="chev" onClick={signOut} title="Sign out" aria-label="Sign out"><Icon name="exit" size={16} /></button>
          </div>
          <div className="flinks"><a href="/app/dashboard">Open app</a><span>·</span><a href="/">Website</a></div>
        </div>
      </aside>
      <div className="main">
        <div className="mtop" ref={top}>
          <h2>{title}</h2>
          <button className="wchip" onClick={signOut} aria-label="Sign out"><Icon name="exit" size={16} />Sign out</button>
        </div>
        <div className="scroll"><main id="main" className="col mv-page">{children}</main></div>
      </div>
      <nav className="tabbar adm-tabs" aria-label="Main">
        {NAV.map(([h, l, i]) => (
          <Link key={h} href={h} className={on(pathname, h) ? "on" : undefined}><Icon name={i} size={24} /><span>{l}</span></Link>
        ))}
      </nav>
    </div>
  );
}
