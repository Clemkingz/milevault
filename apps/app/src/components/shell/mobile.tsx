"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Icon, useScrolled } from "@milevault/ui";
import { Avatar } from "../art";
import { useSession } from "@/lib/session";
import { Menu, UserMenuItems } from "./menus";
import { NAVS, navOn, TITLES } from "./nav";
import { NotificationBell } from "./notifications";

export function MobileTop({ title, back, right }: { title?: string; back?: string; right?: ReactNode }) {
  const pathname = usePathname();
  const address = useSession((s) => s.address);
  const short = useSession((s) => s.shortAddress);
  const ref = useScrolled<HTMLDivElement>();
  if (back) return (
    <div className="mtop c" ref={ref}>
      <Link className="ib" href={back} aria-label="Back"><Icon name="back" size={20} /></Link>
      <h2>{title}</h2>{right ?? <span className="ib" />}
    </div>
  );
  const t = title ?? Object.entries(TITLES).find(([k]) => navOn(pathname, k))?.[1] ?? "MileVault";
  return (
    <div className="mtop" ref={ref}>
      <h2>{t}</h2>
      {address && (
        <div className="mtop-r">
          <NotificationBell compact />
          <Menu trigger={<button className="wchip" aria-label="Account menu"><Avatar address={address} size={24} />{short?.slice(-4)}<span className="gdot" /></button>}><UserMenuItems /></Menu>
        </div>
      )}
    </div>
  );
}

/** Mobile tab bar with centre FAB → new agreement */
export function TabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const tab = (i: number) => {
    const [href, label, icon] = NAVS[i]!; const on = navOn(pathname, href);
    return <Link key={href} href={href} className={on ? "on" : undefined} aria-current={on ? "page" : undefined}><Icon name={icon} size={24} /><span>{label}</span></Link>;
  };
  return (
    <nav className="tabbar" aria-label="Main">
      {tab(0)}{tab(1)}
      <div className="fabw"><button className="fab" onClick={() => router.push("/agreements/new")} aria-label="New agreement"><Icon name="add" size={24} /></button></div>
      {tab(2)}{tab(3)}
    </nav>
  );
}
