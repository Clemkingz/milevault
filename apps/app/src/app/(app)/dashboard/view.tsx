"use client";

import Link from "next/link";
import { assetCode } from "@milevault/api";
import { Button, Reveal } from "@milevault/ui";
import { BalanceCard } from "@/components/agreements/balance-card";
import { ActivityList, ProjectCard, WaitingRows } from "@/components/agreements/lists";
import { Empty, ErrorState, PageHeader, Section } from "@/components/bits";
import { Page } from "@/components/shell/page";
import { DashboardSkeleton } from "@/components/shell/skeleton";
import { useDashboard, useEscrowConfig } from "@/lib/queries";
import { useSession } from "@/lib/session";

const greeting = () => { const h = new Date().getHours(); return h < 5 ? "Working late" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; };

/** PRD screen 1 — GET /dashboard */
export function DashboardView() {
  const { data: d, isPending, error, refetch } = useDashboard();
  const { data: cfg } = useEscrowConfig();
  const short = useSession((s) => s.shortAddress);
  if (isPending) return <Page title="Dashboard"><DashboardSkeleton /></Page>;
  if (error || !d) return <Page title="Dashboard"><ErrorState error={error} retry={() => refetch()} /></Page>;
  const code = assetCode(cfg?.asset ?? d.activeAgreements[0]?.asset ?? "USDC");
  return (
    <Page title="Dashboard">
      <PageHeader eyebrow={`${greeting()} · ${short}`} title="Dashboard" sub={`${d.totals.agreements} agreement${d.totals.agreements === 1 ? "" : "s"} · ${d.totals.active} active · ${d.totals.pendingApprovals} waiting for approval`} />
      <BalanceCard d={d} code={code} />
      <Reveal>
        <Section title="Active agreements" href="/agreements">
          {d.activeAgreements.length
            ? <div className="agrid mv-list">{d.activeAgreements.slice(0, 4).map((a) => <ProjectCard key={a.reference} a={a} />)}</div>
            : <Empty k="E-01" title="No active agreements" body="Create an agreement to lock funds in escrow and pay by milestone." action={<Link href="/agreements/new"><Button h={36} icon="add">New agreement</Button></Link>} />}
        </Section>
      </Reveal>
      <Reveal className="dash-2">
        <Section title="Waiting on you" href={d.waitingOnYou.length ? "/agreements?filter=needs" : undefined}>
          {d.waitingOnYou.length ? <WaitingRows items={d.waitingOnYou} /> : <Empty title="All caught up" body="Nothing to publish, fund, approve, release or submit right now." />}
        </Section>
        <Section title="Recent activity" href="/transactions">
          <ActivityList items={d.recentActivity.slice(0, 5)} />
        </Section>
      </Reveal>
    </Page>
  );
}
