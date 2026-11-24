"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fmtAmount, assetCode, relTime } from "@milevault/api";
import { Icon, StatusBadge } from "@milevault/ui";
import { DataView, ErrorState, Hash, PageHeader, Rows, Section, pick } from "@/components/bits";
import { api } from "@/lib/backend";
import { AGREEMENT_STATUSES, human, txBadge } from "@/lib/badge";

const n = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v)) ? Number(v) : null);
/** camelCase keys the backend may use for each agreement status */
const STATUS_KEY: Record<string, string[]> = { in_progress: ["inProgress", "in_progress"] };

export function OverviewView() {
  const ov = useQuery({ queryKey: ["admin", "overview"], queryFn: api.admin.overview });
  const tx = useQuery({ queryKey: ["admin", "transactions", "recent"], queryFn: () => api.admin.transactions({ limit: 6 }) });
  const d = ov.data;
  const asset = assetCode(String(pick(d, "funds.asset") ?? "USDC"));
  const money = (p: string) => { const v = pick(d, p); return v === undefined ? "—" : `${fmtAmount(v as string)} ${asset}`; };
  const failed = (n(pick(d, "transactions.failed")) ?? 0) + (n(pick(d, "transactions.stuck")) ?? 0);
  const kpis: [string, string, string, string, string?][] = [
    ["Locked in escrow", money("funds.locked"), "#2EBEF2", "Across open agreements"],
    ["Released", money("funds.released"), "#00CE5C", `Refunded: ${money("funds.refunded")}`],
    ["Agreements", String(pick(d, "agreements.total") ?? "—"), "#4797F6", `${pick(d, "wallets") ?? "—"} wallets involved`, "/agreements"],
    ["Failed or stuck tx", d ? String(failed) : "—", failed ? "#FE393B" : "#A3A3A3", `${pick(d, "transactions.pending") ?? 0} pending · ${pick(d, "transactions.confirmed") ?? 0} confirmed`, "/transactions?status=failed"],
  ];
  const byStatus = AGREEMENT_STATUSES.map((s) => [s, n((STATUS_KEY[s] ?? [s]).map((k) => pick(d, `agreements.${k}`)).find((v) => v !== undefined))] as const).filter(([, c]) => c !== null);

  return (
    <>
      <PageHeader title="Overview" sub="Platform-wide escrow, agreements and on-chain activity." />
      {ov.error ? <ErrorState error={ov.error} retry={() => void ov.refetch()} /> : (
        <div className="kpis mv-list">
          {kpis.map(([k, v, c, hint, href]) => {
            const body = <><small><i style={{ background: c }} />{k}</small>{ov.isPending ? <span className="sk" style={{ width: 120, height: 26 }} /> : <b>{v}</b>}<em>{ov.isPending ? " " : hint}</em></>;
            return href ? <Link className="card kpi link-card" key={k} href={href}>{body}</Link> : <div className="card kpi" key={k}>{body}</div>;
          })}
        </div>
      )}
      {byStatus.length > 0 && (
        <Section title="Agreements by status" href="/agreements">
          <div className="filters">
            {byStatus.map(([s, c]) => <Link key={s} className="tag" href={`/agreements?status=${s}`}><b>{human(s)}</b><small>{c}</small></Link>)}
          </div>
        </Section>
      )}
      <Section title="Recent transactions" href="/transactions">
        {tx.isPending ? <Rows n={4} /> : tx.error ? <ErrorState error={tx.error} retry={() => void tx.refetch()} /> : tx.data.result.length === 0 ? (
          <div className="card empty"><b>No transactions yet</b></div>
        ) : (
          <div className="card mv-list">
            {tx.data.result.map((t) => (
              <div className="trow" key={t.id}>
                <span className="typ" style={{ background: "#EAF8FE" }}><Icon name="transfer" size={18} color="#2EBEF2" /></span>
                <div className="tx"><b>{human(String(t.kind ?? "Transaction"))}{t.milestonePosition ? ` · milestone ${t.milestonePosition}` : ""}</b><small>{t.agreementName ?? t.agreement?.name ?? t.reference ?? "—"}{t.reference ? ` · ${t.reference}` : ""} · {relTime(t.createdAt)}</small></div>
                {t.amount ? <span className="num hide-m">{fmtAmount(t.amount)} {assetCode(String(pick(ov.data, "funds.asset") ?? "USDC"))}</span> : null}
                <div className="col-w">{t.stuck ? <StatusBadge status="cancel_requested" label="Stuck" /> : <StatusBadge status={txBadge(t.status)} />}</div>
                <span className="hide-m"><Hash h={t.hash} url={t.explorerUrl} /></span>
              </div>
            ))}
          </div>
        )}
      </Section>
      {d && (
        <details className="adm-raw">
          <summary>All metrics from the backend</summary>
          <DataView data={d} />
        </details>
      )}
    </>
  );
}
