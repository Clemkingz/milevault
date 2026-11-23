"use client";

import { useRouter } from "next/navigation";
import { Icon, type IconName } from "@milevault/ui";
import { Pattern } from "../art";
import { Menu, MenuItem } from "../shell/menus";
import { useActions } from "../use-actions";
import { CountUp } from "./count-up";
import { curIdx, isFunded, locked, plural, total, useChain, useMe, useMyAgreements, useUI } from "@/mock";

type Act = { key: string; icon: IconName; label: string; short: string; run: () => void };

/** Design balanceCard(): role-aware headline figure, quick actions, 3-stat legend */
export function BalanceCard() {
  const router = useRouter();
  const me = useMe()!;
  const hideBal = useChain((s) => s.hideBal);
  const set = useChain((s) => s.set);
  const all = useMyAgreements();
  const { startTx, toast } = useUI.getState();
  const { copy } = useActions();
  const asClient = all.filter((a) => a.client === me.key);
  const asContrib = all.filter((a) => a.contributor === me.key);
  const isClient = asClient.length >= asContrib.length;
  const mine = isClient ? asClient : asContrib;
  const sum = (f: (s: string) => boolean) => mine.flatMap((a) => a.ms.filter((m) => f(m.status))).reduce((s, m) => s + m.amount, 0);

  let amount: number, sub: string, stats: [string, string, number, string][], acts: Act[];
  if (isClient) {
    const active = mine.filter((a) => a.status === "funded" || a.status === "active");
    amount = mine.reduce((s, a) => s + locked(a), 0);
    sub = `Funds in escrow across ${plural(active.length, "active agreement")}`;
    stats = [
      ["Awaiting approval", "#F0AF30", sum((s) => s === "submitted"), "Submitted milestones waiting for your review"],
      ["Released to contributors", "#00CE5C", sum((s) => s === "paid"), "Paid out of escrow so far"],
      ["Total spent", "#D9D9D9", mine.filter(isFunded).reduce((s, a) => s + total(a), 0), "Everything you’ve funded into escrow"],
    ];
    const fundFirst = () => { const a = mine.find((x) => x.status === "created"); if (!a) return toast("Nothing is waiting for funding", { tone: "info" }); router.push(`/agreements/${a.id}`); startTx("fund", { id: a.id }); };
    const releaseAny = () => { for (const a of mine) { const i = a.ms.findIndex((m) => m.status === "approved"); if (i > -1) { router.push(`/agreements/${a.id}`); return startTx("release", { id: a.id, i }); } } toast("Nothing is approved and ready to release", { tone: "info" }); };
    acts = [
      { key: "fund", icon: "safe_lock", label: "Fund escrow", short: "Fund escrow", run: fundFirst },
      { key: "new", icon: "add", label: "New agreement", short: "New", run: () => router.push("/agreements/new") },
      { key: "rel", icon: "transfer", label: "Release payment", short: "Release", run: releaseAny },
    ];
  } else {
    amount = sum((s) => s === "paid");
    sub = "Paid to your wallet so far";
    stats = [
      ["Awaiting approval", "#F0AF30", sum((s) => s === "submitted"), "Work you’ve submitted that’s being reviewed"],
      ["Approved, not paid", "#00CE5C", sum((s) => s === "approved"), "Approved — paid when the client releases it"],
      ["Still to earn", "#D9D9D9", mine.filter((a) => a.status === "funded" || a.status === "active").reduce((s, a) => s + locked(a), 0), "Locked in escrow for your remaining milestones"],
    ];
    const submitAny = () => {
      const a = mine.find((x) => x.status === "active" && x.ms[curIdx(x)]?.status === "pending");
      if (a) { router.push(`/agreements/${a.id}`); return startTx("submit", { id: a.id, i: curIdx(a) }); }
      const n = mine.find((x) => x.status === "funded");
      toast(n ? `Accept ${n.name} first, then submit your work` : "Nothing is ready to submit right now", { tone: "info" });
    };
    acts = [
      { key: "sub", icon: "send", label: "Submit milestone", short: "Submit", run: submitAny },
      { key: "ag", icon: "file", label: "Agreements", short: "Agreements", run: () => router.push("/agreements") },
      { key: "copy", icon: "copy", label: "Copy address", short: "Copy", run: () => copy(me.addr) },
    ];
  }

  const more = (
    <Menu trigger={<button className="btn tint more" aria-label="More"><Icon name="more" size={18} /></button>}>
      <MenuItem icon="transfer" onSelect={() => router.push("/transactions")}>Transactions</MenuItem>
      <MenuItem icon="wallet" onSelect={() => router.push("/wallets")}>Wallets and balances</MenuItem>
      <MenuItem icon="copy" onSelect={() => copy(me.addr)}>Copy my address</MenuItem>
    </Menu>
  );

  return (
    <div className="card bal">
      <Pattern />
      <div>
        <div className="amt">
          <b><CountUp value={amount} hidden={hideBal} /></b>
          <button className="eyebox" onClick={() => set({ hideBal: !hideBal })} title={hideBal ? "Show balance" : "Hide balance"} aria-label={hideBal ? "Show balance" : "Hide balance"}>
            <Icon name={hideBal ? "eye" : "eye_close"} size={16} />
          </button>
        </div>
        <div className="sub">{sub}</div>
      </div>

      {/* desktop / tablet actions */}
      <div className="acts bal-d">
        {isClient
          ? acts.map((x) => <button key={x.key} className="btn tint" onClick={x.run}><Icon name={x.icon} size={18} /><span>{x.label}</span></button>)
          : acts.slice(0, 2).map((x) => <button key={x.key} className="btn tint" onClick={x.run}><span>{x.label}</span></button>)}
        {isClient ? more : <button className="btn tint more" onClick={() => copy(me.addr)} aria-label="Copy address" title="Copy address"><Icon name="copy_line" size={18} /></button>}
      </div>
      {/* mobile round actions */}
      <div className="macts bal-m">
        {acts.map((x) => <button key={x.key} onClick={x.run}><span className="c"><Icon name={x.icon} size={20} /></span>{x.short}</button>)}
        <Menu trigger={<button><span className="c"><Icon name="more" size={20} /></span>More</button>}>
          <MenuItem icon="transfer" onSelect={() => router.push("/transactions")}>Transactions</MenuItem>
          <MenuItem icon="wallet" onSelect={() => router.push("/wallets")}>Wallets and balances</MenuItem>
        </Menu>
      </div>

      <div className="div" />
      <div className="legend bal-d">
        {stats.map(([k, c, v, tip]) => (
          <div className="stat" key={k}>
            <div className="k"><span><i style={{ background: c }} />{k}</span><span title={tip}><Icon name="info" size={14} /></span></div>
            <b><CountUp value={v} hidden={hideBal} /></b>
          </div>
        ))}
      </div>
      <div className="mstats bal-m">
        {stats.map(([k, c, v, tip]) => (
          <div key={k}><span className="k"><i style={{ background: c }} />{k}<span title={tip}><Icon name="info" size={14} /></span></span><b><CountUp value={v} hidden={hideBal} /></b></div>
        ))}
      </div>
    </div>
  );
}
