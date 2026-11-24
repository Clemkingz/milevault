"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Dashboard } from "@milevault/api";
import { Icon, type IconName } from "@milevault/ui";
import { Pattern } from "../art";
import { usePrefs } from "@/lib/prefs";
import { useSession } from "@/lib/session";
import { useActions } from "../use-actions";
import { CountUp } from "./count-up";

/** Balance card from GET /dashboard — client and contributor views (toggle when the wallet is both) */
export function BalanceCard({ d, code }: { d: Dashboard; code: string }) {
  const router = useRouter();
  const hideBal = usePrefs((s) => s.hideBal);
  const set = usePrefs((s) => s.set);
  const address = useSession((s) => s.address)!;
  const { copy } = useActions();
  const hasClient = Number(d.client.totalFunded) > 0 || d.activeAgreements.some((a) => a.role === "client");
  const hasContrib = Number(d.contributor.paid) + Number(d.contributor.stillToEarn) > 0 || d.activeAgreements.some((a) => a.role === "contributor");
  const [view, setView] = useState<"client" | "contributor">(hasClient || !hasContrib ? "client" : "contributor");
  const sfx = ` ${code}`;

  const isClient = view === "client";
  const amount = isClient ? d.client.fundsInEscrow : d.contributor.paid;
  const sub = isClient ? `Funds in escrow across ${d.totals.active} active agreement${d.totals.active === 1 ? "" : "s"}` : "Paid to your wallet so far";
  const stats: [string, string, string, string][] = isClient
    ? [["Awaiting approval", "#F0AF30", d.client.awaitingApproval, "Submitted work waiting for your review"], ["Released to contributors", "#00CE5C", d.client.released, "Paid out of escrow so far"], ["Total funded", "#D9D9D9", d.client.totalFunded, "Everything you’ve locked into escrow"]]
    : [["Awaiting approval", "#F0AF30", d.contributor.awaitingApproval, "Work you’ve submitted that’s being reviewed"], ["Approved, not paid", "#00CE5C", d.contributor.approvedNotPaid, "Paid when the client releases it"], ["Still to earn", "#D9D9D9", d.contributor.stillToEarn, "Locked in escrow for your remaining milestones"]];
  const acts: { icon: IconName; label: string; short: string; run: () => void }[] = isClient
    ? [{ icon: "add", label: "New agreement", short: "New", run: () => router.push("/agreements/new") }, { icon: "file", label: "Agreements", short: "Agreements", run: () => router.push("/agreements?filter=client") }, { icon: "transfer", label: "Transactions", short: "History", run: () => router.push("/transactions") }]
    : [{ icon: "flag", label: "Work to submit", short: "Submit", run: () => router.push("/agreements?filter=needs") }, { icon: "file", label: "Agreements", short: "Agreements", run: () => router.push("/agreements?filter=contributor") }, { icon: "copy", label: "Copy address", short: "Copy", run: () => copy(address) }];

  return (
    <div className="card bal">
      <Pattern />
      <div>
        {hasClient && hasContrib && (
          <div className="tabs bal-role" role="tablist" aria-label="View as">
            <button role="tab" aria-selected={isClient} className={isClient ? "on" : ""} onClick={() => setView("client")}>As client</button>
            <button role="tab" aria-selected={!isClient} className={!isClient ? "on" : ""} onClick={() => setView("contributor")}>As contributor</button>
          </div>
        )}
        <div className="amt">
          <b><CountUp value={amount} suffix={sfx} hidden={hideBal} /></b>
          <button className="eyebox" onClick={() => set({ hideBal: !hideBal })} aria-label={hideBal ? "Show balance" : "Hide balance"} title={hideBal ? "Show balance" : "Hide balance"}><Icon name={hideBal ? "eye" : "eye_close"} size={16} /></button>
        </div>
        <div className="sub">{sub}</div>
      </div>
      <div className="acts bal-d">
        {acts.map((x) => <button key={x.label} className="btn tint" onClick={x.run}><Icon name={x.icon} size={18} /><span>{x.label}</span></button>)}
      </div>
      <div className="macts bal-m">{acts.map((x) => <button key={x.label} onClick={x.run}><span className="c"><Icon name={x.icon} size={20} /></span>{x.short}</button>)}</div>
      <div className="div" />
      <div className="legend bal-d">{stats.map(([k, c, v, tip]) => <div className="stat" key={k}><div className="k"><span><i style={{ background: c }} />{k}</span><span title={tip}><Icon name="info" size={14} /></span></div><b><CountUp value={v} suffix={sfx} hidden={hideBal} /></b></div>)}</div>
      <div className="mstats bal-m">{stats.map(([k, c, v, tip]) => <div key={k}><span className="k"><i style={{ background: c }} />{k}<span title={tip}><Icon name="info" size={14} /></span></span><b><CountUp value={v} suffix={sfx} hidden={hideBal} /></b></div>)}</div>
    </div>
  );
}
