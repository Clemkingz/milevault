"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, Logo } from "@milevault/ui";
import { Avatar } from "../art";
import { InstallCard } from "../pwa/install";
import { short, useChain, useMe } from "@/mock";
import { Menu, UserMenuItems } from "./menus";
import { NAV_GROUPS, navOn } from "./nav";

/** Desktop sidebar: 264px (≥1280px) or a 76px icon rail (1024–1279px). Hidden below 1024px. */
export function Sidebar() {
  const pathname = usePathname();
  const me = useMe();
  const agreements = useChain((s) => s.agreements);
  if (!me) return null;
  const isClientish = agreements.filter((a) => a.client === me.key).length >= agreements.filter((a) => a.contributor === me.key).length;
  return (
    <aside className="side" aria-label="Sidebar">
      <div className="top">
        <Link href="/dashboard" className="side-brand" aria-label="MileVault dashboard">
          <Logo className="full" />
          <Logo className="mark" markOnly />
        </Link>
        {isClientish && (
          <Link href="/agreements/new" className="btn pri h40 side-cta" title="New agreement">
            <Icon name="add" size={18} /><span>New agreement</span>
          </Link>
        )}
        <nav className="nav" aria-label="Main">
          {NAV_GROUPS.map((g) => (
            <div className="nav-g" key={g.label}>
              <span className="nav-l">{g.label}</span>
              {g.items.map(([href, label, icon]) => {
                const on = navOn(pathname, href);
                return (
                  <Link key={href} href={href} className={on ? "on" : undefined} aria-current={on ? "page" : undefined} title={label}>
                    <Icon name={icon} size={24} />
                    <span className="nl">{label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>
      <div className="bot">
        <div className="side-install"><InstallCard /></div>
        <Menu
          align="start"
          side="top"
          trigger={
            <button className="user" aria-label="Account menu">
              <Avatar p={me} size={36} />
              <div className="ut">
                <div className="nm">{me.name}</div>
                <div className="wl"><span className="gdot" /><span className="ad">{short(me.addr)}</span><span className="sbadge">Testnet</span></div>
              </div>
              <span className="chev"><Icon name="down_line" size={16} /></span>
            </button>
          }
        >
          <UserMenuItems />
        </Menu>
        <div className="flinks"><a href="/#security">Developers</a><span>·</span><a href="/privacy">Privacy</a><span>·</span><a href="/terms">Terms</a></div>
      </div>
    </aside>
  );
}
