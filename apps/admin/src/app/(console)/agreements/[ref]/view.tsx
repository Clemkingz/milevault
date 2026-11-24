"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiError, fmtAmount, money, relTime, txHash, txUrl } from "@milevault/api";
import { StatusBadge } from "@milevault/ui";
import { Addr, Empty, ErrorState, Hash, KV, PageHeader, Rows, Section, useExplorer } from "@/components/bits";
import { api } from "@/lib/backend";
import { agreementBadge, human, milestoneBadge, txBadge } from "@/lib/badge";

const date = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return <span title={d.toLocaleString()}>{d.getTime() > Date.now() ? d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : relTime(iso)}</span>;
};

export function AgreementDetail({ ref_ }: { ref_: string }) {
  const base = useExplorer();
  const q = useQuery({ queryKey: ["admin", "agreement", ref_], queryFn: () => api.admin.agreement(ref_) });
  const back: [string, string] = ["/agreements", "Agreements"];
  if (q.isPending) return <><PageHeader back={back} title={ref_} /><Rows n={4} /></>;
  if (q.error instanceof ApiError && q.error.status === 404) return <><PageHeader back={back} title={ref_} /><Empty img="e-01" title="No such agreement" body={`The backend has no agreement ${ref_}.`} /></>;
  if (q.error) return <><PageHeader back={back} title={ref_} /><ErrorState error={q.error} retry={() => void q.refetch()} /></>;
  const a = q.data;
  const fundHash = txHash(a.fundTx);
  return (
    <>
      <PageHeader back={back} title={<>{a.name} <span className="refchip">{a.reference}</span></>} sub={a.description || undefined} actions={<StatusBadge status={agreementBadge(a)} />} />
      <div className="adm-2col">
        <Section title="Parties & funds">
          <KV rows={[
            ["Client", <Addr key="c" a={a.client.address} />],
            ["Contributor", a.contributor ? <Addr key="k" a={a.contributor.address} /> : "Not set yet"],
            ["Total", money(a.total, a.asset)],
            ["Locked", money(a.locked, a.asset)],
            ["Released", money(a.released, a.asset)],
            ["Refunded", money(a.refunded, a.asset)],
            ["Asset", <span key="as" title={a.asset}>{a.asset.includes(":") ? `${a.asset.split(":")[0]} · ${a.asset.split(":")[1]!.slice(0, 4)}…` : a.asset}</span>],
          ]} />
        </Section>
        <Section title="Timeline">
          <KV rows={[
            ["Status", a.displayStatus ? human(a.displayStatus) : human(a.status)],
            ["Created", date(a.createdAt)],
            ["Funded", fundHash ? <span key="f">{date(a.fundedAt)} · <Hash h={fundHash} url={txUrl(a.fundTx, base)} /></span> : date(a.fundedAt)],
            ["Accepted", date(a.acceptedAt)],
            ["Closed", date(a.closedAt)],
            ["Recoverable from", date(a.recoveryAt)],
            ["Cancellation", a.cancellation ? <span key="cx">Proposed {relTime(a.cancellation.createdAt)} by <Addr a={a.cancellation.proposedBy} /></span> : a.cancellations?.length ? `${a.cancellations.length} earlier` : "None"],
          ]} />
        </Section>
      </div>
      <Section title={`Milestones · ${a.paidCount}/${a.milestoneCount} paid`}>
        <div className="card mv-list">
          {a.milestones.map((m) => {
            const h = txHash(m.releaseTx) ?? txHash(m.refundTx) ?? txHash(m.approveTx);
            return (
              <div className="trow" key={m.id ?? m.position}>
                <span className="mnum">{m.position}</span>
                <div className="tx"><b>{m.title}</b><small>{m.workLink ? <a className="link" href={m.workLink} target="_blank" rel="noopener noreferrer">{m.workLink}</a> : m.description || "—"}{m.changesNote ? ` · Changes: ${m.changesNote}` : ""}</small></div>
                <span className="num">{fmtAmount(m.amount)}</span>
                <div className="col-w"><StatusBadge status={milestoneBadge(m)} /></div>
                <span className="hide-m">{h ? <Hash h={h} /> : <span className="meta">—</span>}</span>
              </div>
            );
          })}
        </div>
      </Section>
      <Section title="Transactions">
        {a.transactions?.length ? (
          <div className="card mv-list">
            {a.transactions.map((t) => (
              <div className="trow" key={t.id}>
                <div className="tx"><b>{human(String(t.kind ?? "Transaction"))}{t.milestonePosition ? ` · milestone ${t.milestonePosition}` : ""}</b><small>{relTime(t.createdAt)}{t.wallet ?? t.signer ? <> · <Addr a={String(t.wallet ?? t.signer)} /></> : null}{t.status === "failed" && t.failure ? <span className="adm-err"> · {t.failure}</span> : null}</small></div>
                {t.amount ? <span className="num hide-m">{money(t.amount, a.asset)}</span> : null}
                <div className="col-w">{t.stuck ? <StatusBadge status="cancel_requested" label="Stuck" /> : <StatusBadge status={txBadge(t.status)} />}</div>
                <span className="hide-m"><Hash h={t.hash} url={t.explorerUrl} /></span>
              </div>
            ))}
          </div>
        ) : <div className="card empty"><b>No on-chain transactions yet</b></div>}
      </Section>
      {a.activity && a.activity.length > 0 && (
        <Section title="Activity">
          <div className="card mv-list">
            {a.activity.map((x) => (
              <div className="trow" key={x.id}>
                <div className="tx"><b>{human(x.kind)}{x.milestoneTitle ? ` · ${x.milestoneTitle}` : x.milestonePosition ? ` · milestone ${x.milestonePosition}` : ""}</b><small>{relTime(x.createdAt)} · <Addr a={x.actor} /></small></div>
                {x.amount ? <span className="num hide-m">{money(x.amount, a.asset)}</span> : null}
                {x.txHash ? <span className="hide-m"><Hash h={x.txHash} url={x.explorerUrl} /></span> : null}
              </div>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
