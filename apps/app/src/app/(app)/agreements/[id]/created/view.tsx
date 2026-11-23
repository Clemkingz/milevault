"use client";

import Link from "next/link";
import { Button, Icon, StatusBadge } from "@milevault/ui";
import { Ill, Slot } from "@/components/art";
import { Empty } from "@/components/bits";
import { Burst } from "@/components/overlays/parts";
import { Page } from "@/components/shell/page";
import { AgreementSkeleton } from "@/components/shell/skeleton";
import { useActions } from "@/components/use-actions";
import { getPerson, shortHash, total, usd, useAgreement, useReady, useUI } from "@/mock";

/** Design createdPage() */
export function CreatedView({ id }: { id: string }) {
  const ready = useReady();
  const a = useAgreement(id);
  const { copy, explorer, agreementLink } = useActions();
  const startTx = useUI((s) => s.startTx);
  if (!ready) return <Page back="/dashboard" title="Agreement created"><AgreementSkeleton /></Page>;
  if (!a) return <Page back="/dashboard" title="Agreement created"><Empty k="E-01" title="Agreement not found" /></Page>;
  const k = getPerson(a.contributor);
  return (
    <Page back="/dashboard" title="Agreement created">
      <div className="created" style={{ position: "relative" }}>
        <Burst />
        <Slot k="A-01" />
        <h2>Agreement created</h2>
        <p className="c">{a.name} is recorded on Stellar Testnet. Fund the escrow so {k.first} can see the money is there and start.</p>
        <div className="card rcpt">
          <div><span>Create transaction</span>{a.createHash && <button className="txh" onClick={() => explorer(a.createHash!)}>{shortHash(a.createHash)}<Icon name="external" size={14} /></button>}</div>
          <div><span>Agreement</span><b>MV-{a.id}</b></div>
          <div><span>Status</span><StatusBadge status={a.status === "created" ? "awaiting" : "funded"} /></div>
          <div><span>Total</span><b>{usd(total(a))}</b></div>
        </div>
        {a.status === "created" ? (
          <div className="card next" style={{ width: "100%" }}>
            <div className="top"><Ill k="F-01" /><div className="tx"><b>Next: fund escrow</b><p>Lock {usd(total(a))} in the contract. {k.first} can’t start until it’s funded.</p></div></div>
            <div className="acts">
              <Button h={40} onClick={() => startTx("fund", { id: a.id })}>Fund escrow</Button>
              <Button variant="sec" h={40} onClick={() => copy(agreementLink(a.id), "Agreement link copied")}>Copy agreement link</Button>
            </div>
          </div>
        ) : (
          <div className="card next" style={{ width: "100%" }}>
            <div className="top"><Ill k="F-02" /><div className="tx"><b>Escrow funded</b><p>Share the link so {k.first} can review the terms and accept.</p></div></div>
            <div className="acts"><Button variant="sec" h={40} onClick={() => copy(agreementLink(a.id), "Agreement link copied")}>Copy agreement link</Button></div>
          </div>
        )}
        <div className="clinks"><Link className="link" href={`/agreements/${a.id}`}>Go to agreement</Link><Link className="mlink" href="/dashboard">Back to dashboard</Link></div>
      </div>
    </Page>
  );
}
