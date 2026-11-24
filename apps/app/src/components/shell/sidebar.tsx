"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, Logo } from "@milevault/ui";
import { Avatar } from "../art";
import { InstallCard } from "../pwa/install";
import { useDashboard } from "@/lib/queries";
import { useSession } from "@/lib/session";
import { Menu, UserMenuItems } from "./menus";
import { NAV_GROUPS, navOn } from "./nav";
import { NotificationBell } from "./notifications";

export function Sidebar() {
  const pathname = usePathname();
  const address = useSession((s) => s.address);
  const short = useSession((s) => s.shortAddress);
  const { data } = useDashboard();
  if (!address) return null;
  const pending = data?.totals.pendingApprovals ?? 0;
  return (
    <aside className="side" aria-label="Sidebar">
      <div className="top">
        <div className="side-head">
          <Link href="/dashboard" className="side-brand" aria-label="MileVault dashboard"><Logo className="full" /><Logo className="mark" markOnly /></Link>
          <span className="side-bell"><NotificationBell /></span>
        </div>
        <Link href="/agreements/new" className="btn pri h40 side-cta" title="New agreement"><Icon name="add" size={18} /><span>New agreement</span></Link>
        <nav className="nav" aria-label="Main">
          {NAV_GROUPS.map((g) => (
            <div className="nav-g" key={g.label}>
              <span className="nav-l">{g.label}</span>
              {g.items.map(([href, label, icon]) => {
                const on = navOn(pathname, href);
                return (
                  <Link key={href} href={href} className={on ? "on" : undefined} aria-current={on ? "page" : undefined} title={label}>
                    <Icon name={icon} size={24} /><span className="nl">{label}</span>
                    {href === "/agreements" && pending > 0 && <span className="nav-count" title={`${pending} waiting for approval`}>{pending}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>
      <div className="bot">
        <div className="side-install"><InstallCard /></div>
        <Menu align="start" side="top" trigger={
          <button className="user" aria-label="Account menu">
            <Avatar address={address} size={36} />
            <div className="ut"><div className="nm" style={{ fontFamily: "var(--inter)" }}>{short}</div><div className="wl"><span className="gdot" /><span className="ad">Signed in</span><span className="sbadge">Testnet</span></div></div>
            <span className="chev"><Icon name="down_line" size={16} /></span>
          </button>
        }><UserMenuItems /></Menu>
        <div className="flinks"><a href="/#security">Security</a><span>·</span><a href="/privacy">Privacy</a><span>·</span><a href="/terms">Terms</a></div>
      </div>
    </aside>
  );
}
