import type { Metadata } from "next";
import { Icon, type IconName } from "@milevault/ui";
import { Avatar, Hash, PageHeader } from "@/components/bits";
import { EVENTS, agreement, wallet } from "@/lib/data";
import { relTime, usd } from "@/lib/format";

export const metadata: Metadata = { title: "Transactions" };

const T: Record<string, [string, IconName, string, string]> = {
  create: ["Create agreement", "file_new", "#B36BF2", "#FAF3FE"], fund: ["Fund escrow", "safe_lock", "#2EBEF2", "#EAF8FE"],
  approve: ["Approve milestone", "check_circle", "#4797F6", "#ECF4FE"], release: ["Release", "transfer", "#00CE5C", "#EBFEF3"],
  refund: ["Refund", "refresh", "#B36BF2", "#FAF3FE"], cancel: ["Cancel", "close_circle", "#7B7B7B", "#F5F5F5"],
  accept: ["Accept agreement", "check_circle", "#4797F6", "#ECF4FE"], submit: ["Submit milestone", "flag", "#F0AF30", "#FEFCE6"],
};

export default function Transactions() {
  return (
    <>
      <PageHeader title="Transactions" sub="Indexed escrow contract events, newest first. Every row links to Stellar Expert." />
      <div className="card mv-list">
        {EVENTS.map((e) => {
          const [label, icon, c, b] = T[e.kind]!;
          const w = wallet(e.actor);
          return (
            <div className="trow" key={e.id}>
              <span className="typ" style={{ background: b }}><Icon name={icon} size={18} color={c} /></span>
              <div className="tx"><b>{label}</b><small>{agreement(e.agreementId).name} · MV-{e.agreementId}</small></div>
              <div className="pairs hide-m"><Avatar w={w} size={24} /><span className="meta">{w.name}</span></div>
              <span className="num">{e.amount ? usd(e.amount) : "—"}<small>{relTime(e.at)}</small></span>
              <span className="hide-m"><Hash h={e.hash} /></span>
            </div>
          );
        })}
      </div>
    </>
  );
}
