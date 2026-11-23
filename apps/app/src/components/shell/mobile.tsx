"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Icon, useScrolled } from "@milevault/ui";
import { Avatar } from "../art";
import { curIdx, short, useChain, useMe, useUI } from "@/mock";
import { Menu, UserMenuItems } from "./menus";
import { NAVS, navOn, TITLES } from "./nav";

/** Design `.mtop` (< 1024px). Inner pages pass a back target + optional right slot. */
export function MobileTop({ title, back, right }: { title?: string; back?: string; right?: ReactNode }) {
  const pathname = usePathname();
  const me = useMe();
  const ref = useScrolled<HTMLDivElement>();
  if (back) {
    return (
      <div className="mtop c" ref={ref}>
        <Link className="ib" href={back} aria-label="Back"><Icon name="back" size={20} /></Link>
        <h2>{title}</h2>
        {right ?? <span className="ib" />}
      </div>
    );
  }
  const t = title ?? Object.entries(TITLES).find(([k]) => navOn(pathname, k))?.[1] ?? "MileVault";
  return (
    <div className="mtop" ref={ref}>
      <h2>{t}</h2>
      {me && (
        <Menu trigger={<button className="wchip" aria-label="Wallet menu"><Avatar p={me} size={24} />{short(me.addr)}<span className="gdot" /></button>}>
          <UserMenuItems />
        </Menu>
      )}
    </div>
  );
}

/** Design `.tabbar` with centre FAB (client: new agreement · contributor: submit milestone) */
export function TabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const me = useChain((s) => s.me);
  const agreements = useChain((s) => s.agreements);
  const { startTx, toast } = useUI.getState();
  const asClient = agreements.filter((a) => a.client === me).length;
  const asContrib = agreements.filter((a) => a.contributor === me).length;
  const contributorFirst = asContrib > asClient;

  const fab = () => {
    if (!contributorFirst) return router.push("/agreements/new");
    const a = agreements.find((x) => x.contributor === me && x.status === "active" && x.ms[curIdx(x)]?.status === "pending");
    if (a) { router.push(`/agreements/${a.id}`); return startTx("submit", { id: a.id, i: curIdx(a) }); }
    const n = agreements.find((x) => x.contributor === me && x.status === "funded");
    toast(n ? `Accept ${n.name} first, then submit your work` : "Nothing is ready to submit right now", { tone: "info" });
  };

  const tab = (i: number) => {
    const [href, label, icon] = NAVS[i]!;
    const on = navOn(pathname, href);
    return (
      <Link key={href} href={href} className={on ? "on" : undefined} aria-current={on ? "page" : undefined}>
        <Icon name={icon} size={24} />
        <span>{label}</span>
      </Link>
    );
  };
  return (
    <nav className="tabbar" aria-label="Main">
      {tab(0)}{tab(1)}
      <div className="fabw">
        <button className="fab" onClick={fab} aria-label={contributorFirst ? "Submit milestone" : "New agreement"}>
          <Icon name="add" size={24} />
        </button>
      </div>
      {tab(2)}{tab(3)}
    </nav>
  );
}
