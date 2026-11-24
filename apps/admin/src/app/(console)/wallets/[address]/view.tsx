"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ApiError, money, relTime, shortAddr } from "@milevault/api";
import { Icon, StatusBadge } from "@milevault/ui";
import { Addr, DataView, Empty, ErrorState, PageHeader, Rows, Section, useExplorer } from "@/components/bits";
import { api } from "@/lib/backend";
import { agreementBadge } from "@/lib/badge";

export function WalletDetail({ address }: { address: string }) {
  const base = useExplorer();
  const q = useQuery({ queryKey: ["admin", "wallet", address], queryFn: () => api.admin.wallet(address) });
  const back: [string, string] = ["/wallets", "Wallets"];
  if (q.isPending) return <><PageHeader back={back} title={shortAddr(address)} /><Rows n={4} /></>;
  if (q.error instanceof ApiError && q.error.status === 404) return <><PageHeader back={back} title={shortAddr(address)} /><Empty img="e-01" title="Unknown wallet" body="This wallet isn’t a party to any MileVault agreement." /></>;
  if (q.error) return <><PageHeader back={back} title={shortAddr(address)} /><ErrorState error={q.error} retry={() => void q.refetch()} /></>;
  const { agreements, address: _a, shortAddress: _s, ...rest } = q.data;
  void _a; void _s;
  const list = Array.isArray(agreements) ? agreements : [];
  return (
    <>
      <PageHeader back={back} title={shortAddr(address)} sub={<Addr a={address} link={false} />}
        actions={<a className="btn-link" href={`${base}/account/${address}`} target="_blank" rel="noopener">View on explorer <Icon name="external" size={14} /></a>} />
      {Object.keys(rest).length > 0 && <Section title="Wallet"><DataView data={rest} /></Section>}
      <Section title={`Agreements · ${list.length}`}>
        {list.length === 0 ? <div className="card empty"><b>No agreements</b></div> : (
          <div className="card mv-list">
            {list.map((a) => (
              <Link className="trow" key={a.reference} href={`/agreements/${a.reference}`}>
                <div className="tx"><b>{a.name}</b><small>{a.reference} · {a.client.address === address ? "Client" : "Contributor"} · created {relTime(a.createdAt)}</small></div>
                <span className="num">{money(a.total, a.asset)}</span>
                <div className="col-w"><StatusBadge status={agreementBadge(a)} /></div>
              </Link>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
