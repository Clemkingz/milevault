"use client";

import Link from "next/link";
import { money, shortAddr } from "@milevault/api";
import { Button, StatusBadge } from "@milevault/ui";
import { Ill, Slot } from "@/components/art";
import { AssetPill, Empty } from "@/components/bits";
import { Burst } from "@/components/overlays/parts";
import { Page } from "@/components/shell/page";
import { AgreementSkeleton } from "@/components/shell/skeleton";
import { useActions } from "@/components/use-actions";
import { agreementBadge } from "@/lib/domain";
import { useAgreement } from "@/lib/queries";
import { useUI } from "@/lib/ui";

/** After publishing (design createdPage) */
export function CreatedView({ id }: { id: string }) {
  const { data: a, isPending } = useAgreement(id);
  const { copy, agreementLink } = useActions();
  const open = useUI((s) => s.open);
  if (isPending) return <Page back="/dashboard" title="Agreement published"><AgreementSkeleton /></Page>;
  if (!a) return <Page back="/dashboard" title="Agreement published"><Empty k="E-01" title="Agreement not found" /></Page>;
  const k = a.contributor ? shortAddr(a.contributor.address) : "your contributor";
  const funded = a.status !== "created";
  return (
    <Page back="/dashboard" title="Agreement published">
      <div className="created" style={{ position: "relative" }}>
        <Burst /><Slot k="A-01" />
        <h2>Agreement published</h2>
        <p className="c">{a.name} ({a.reference}) is shared with {k}. Fund the escrow so they can see the money is there and accept.</p>
        <div className="card rcpt">
          <div><span>Reference</span><b>{a.reference}</b></div>
          <div><span>Status</span><StatusBadge status={agreementBadge(a)} /></div>
          <div><span>Total</span><b>{money(a.total, a.asset)}</b></div>
          <div><span>Paid in</span><AssetPill id={a.asset} /></div>
        </div>
        <div className="card next" style={{ width: "100%" }}>
          <div className="top"><Ill k={funded ? "F-02" : "F-01"} /><div className="tx"><b>{funded ? "Escrow funded" : "Next: fund escrow"}</b><p>{funded ? `Share the link so ${k} can review the terms and accept.` : `Lock ${money(a.total, a.asset)} in escrow. ${k} can’t start until it’s funded.`}</p></div></div>
          <div className="acts">
            {!funded && <Button h={40} onClick={() => open({ t: "action", ref: a.reference, kind: "fund" })}>Fund escrow</Button>}
            <Button variant="sec" h={40} onClick={() => copy(agreementLink(a.reference), "Agreement link copied")}>Copy agreement link</Button>
          </div>
        </div>
        <div className="clinks"><Link className="link" href={`/agreements/${a.reference}`}>Go to agreement</Link><Link className="mlink" href="/dashboard">Back to dashboard</Link></div>
      </div>
    </Page>
  );
}
