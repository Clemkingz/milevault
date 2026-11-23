"use client";

import Link from "next/link";
import { Button, Reveal } from "@milevault/ui";
import { BalanceCard } from "@/components/agreements/balance-card";
import { ActivityList, ProjectCard, useWaitingRows, WaitingRows } from "@/components/agreements/lists";
import { Empty, PageHeader, Section } from "@/components/bits";
import { Page } from "@/components/shell/page";
import { DashboardSkeleton } from "@/components/shell/skeleton";
import { useActivity, useMe, useMyAgreements, useReady } from "@/mock";

const greeting = () => { const h = new Date().getHours(); return h < 5 ? "Working late" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; };

/** PRD screen 1 — dashboard (design dashboard()) */
export function DashboardView() {
  const ready = useReady();
  const me = useMe()!;
  const mine = useMyAgreements();
  const rows = useWaitingRows();
  const activity = useActivity();
  if (!ready) return <Page title="Dashboard"><DashboardSkeleton /></Page>;

  const asClient = mine.filter((a) => a.client === me.key).length >= mine.filter((a) => a.contributor === me.key).length;
  const role = mine.filter((a) => (asClient ? a.client === me.key : a.contributor === me.key));
  const active = role.filter((a) => a.status === "funded" || a.status === "active" || a.status === "cancel_requested" || (asClient && a.status === "created"));
  const needsMe = (a: (typeof active)[number]) => rows.some((r) => r.a.id === a.id);
  const rank = (a: (typeof active)[number]) => (needsMe(a) && a.status !== "created" ? 0 : a.status === "created" ? 2 : 1);
  const cards = [...active].sort((x, y) => rank(x) - rank(y) || y.createdAt.localeCompare(x.createdAt)).slice(0, 4);

  return (
    <Page title="Dashboard">
      <PageHeader
        eyebrow={`${greeting()}, ${me.first}`}
        title="Dashboard"
        sub={asClient ? "What’s locked in escrow, what needs your approval, and what’s been paid." : "What you’re working on, what’s waiting for approval, and what’s been paid to you."}
      />
      <BalanceCard />
      <Reveal>
        <Section title="Active agreements" href="/agreements">
          {cards.length ? (
            <div className="agrid mv-list">{cards.map((a) => <ProjectCard key={a.id} a={a} />)}</div>
          ) : (
            <Empty k="E-01" title="No active agreements" body="Create an agreement to lock funds in escrow and pay by milestone."
              action={<Link href="/agreements/new"><Button h={36} icon="add">New agreement</Button></Link>} />
          )}
        </Section>
      </Reveal>
      <Reveal className="dash-2">
        <Section title="Milestones waiting on you" href={rows.length ? "/agreements" : undefined}>
          {rows.length ? <WaitingRows rows={rows} /> : (
            <Empty title="All caught up" body={asClient ? "Nothing to fund, approve or release right now." : "Nothing to submit right now. We’ll show it here when there is."} />
          )}
        </Section>
        <Section title="Recent activity" href="/transactions">
          <ActivityList items={activity.slice(0, rows.length > 2 ? 5 : 4)} />
        </Section>
      </Reveal>
    </Page>
  );
}
