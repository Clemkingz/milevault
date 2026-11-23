"use client";

import type { ReactNode } from "react";
import { Button, type ButtonVariant } from "@milevault/ui";
import { Ill } from "../art";
import { useActions } from "../use-actions";
import { curIdx, locked, getPerson, plural, relTime, total, usd, useChain, useUI, type MockAgreement } from "@/mock";

function Box({ k, title, body, acts }: { k: string; title: ReactNode; body: ReactNode; acts?: ReactNode }) {
  return (
    <div className="card next">
      <div className="top"><Ill k={k} /><div className="tx"><b>{title}</b><p>{body}</p></div></div>
      {acts && <div className="acts">{acts}</div>}
    </div>
  );
}
const B = ({ v = "pri", onClick, children }: { v?: ButtonVariant; onClick: () => void; children: ReactNode }) => (
  <Button variant={v} h={40} onClick={onClick}>{children}</Button>
);

/** Design nextAction(): the one thing each party should do next (+ mutual cancellation states) */
export function NextAction({ a, onHistory }: { a: MockAgreement; onHistory: () => void }) {
  const me = useChain((s) => s.me)!;
  const { startTx } = useUI.getState();
  const { copy, agreementLink, openExternal } = useActions();
  const isClient = a.client === me;
  const o = getPerson(isClient ? a.contributor : a.client);
  const i = curIdx(a);
  const m = a.ms[i];
  const link = () => copy(agreementLink(a.id), "Agreement link copied");

  if (a.status === "cancelled")
    return a.refunded
      ? <Box k="C-07" title="This agreement was cancelled" body={`Both sides agreed to cancel. ${usd(a.refunded)} went back to ${isClient ? "your wallet" : getPerson(a.client).name}; paid milestones stayed paid.`} acts={<B v="sec" onClick={onHistory}>View payment history</B>} />
      : <Box k="C-02" title="This agreement was cancelled" body="It was never funded, so there was nothing to refund." />;
  if (a.status === "declined")
    return <Box k="C-06" title={isClient ? `${o.first} declined this agreement` : "You declined this agreement"} body={`The ${usd(total(a))} went back to ${isClient ? "your wallet" : getPerson(a.client).name}.`} />;
  if (a.status === "completed")
    return <Box k={isClient ? "M-10" : "M-07"} title={isClient ? "All milestones paid" : "Paid in full"}
      body={isClient ? `You released ${usd(total(a))} to ${o.name} across ${plural(a.ms.length, "milestone")}. The escrow is empty.` : `You received ${usd(total(a))} from ${o.name}. Every payment links to its Stellar transaction.`}
      acts={<B v="sec" onClick={onHistory}>View payment history</B>} />;
  if (a.status === "cancel_requested") {
    if (a.cancelRequestedBy === me)
      return <Box k="C-04" title={`Waiting for ${o.first} to confirm`} body={`You asked to cancel. If ${o.first} confirms, the ${usd(locked(a))} still in escrow goes back to ${isClient ? "you" : getPerson(a.client).name}. Until then the agreement is paused.`}
        acts={<B v="sec" onClick={() => startTx("withdraw_cancel", { id: a.id })}>Withdraw request</B>} />;
    return <Box k="C-04" title={`${o.first} asked to cancel`} body={`Confirming refunds the ${usd(locked(a))} still in escrow to ${isClient ? "you" : getPerson(a.client).name}. Paid milestones stay paid. Nothing moves unless you confirm.`}
      acts={<><B v="danger" onClick={() => startTx("confirm_cancel", { id: a.id })}>Confirm cancellation</B><B v="sec" onClick={link}>Copy agreement link</B></>} />;
  }

  if (isClient) {
    if (a.status === "created")
      return <Box k="F-04" title="Fund escrow to start" body={`${o.name} won’t start until the ${usd(total(a))} is locked in the contract.`}
        acts={<><B onClick={() => startTx("fund", { id: a.id })}>{`Fund ${usd(total(a))}`}</B><B v="sec" onClick={link}>Copy agreement link</B></>} />;
    if (a.status === "funded")
      return <Box k="F-02" title={`Waiting for ${o.first} to accept`} body={`The escrow is funded. ${o.first} reviews the terms and accepts before starting milestone 1.`} acts={<B v="sec" onClick={link}>Copy agreement link</B>} />;
    if (m?.status === "submitted")
      return <Box k="M-02" title={`Review ${m.title}`} body={`Submitted ${relTime(m.submittedAt!).toLowerCase()} with ${m.link}. Approving doesn’t pay yet; you release the ${usd(m.amount)} next.`}
        acts={<><B onClick={() => startTx("approve", { id: a.id, i })}>Approve milestone</B><B v="sec" onClick={() => openExternal(m.link!)}>Open submitted link</B></>} />;
    if (m?.status === "approved")
      return <Box k="M-04" title={`Release ${usd(m.amount)} for ${m.title}`} body={`You approved it, but ${o.first} isn’t paid yet. Releasing sends the money from escrow to their wallet.`}
        acts={<B onClick={() => startTx("release", { id: a.id, i })}>Release payment</B>} />;
    return <Box k="F-02" title={`Waiting on ${o.first} for ${m?.title}`} body={`Funds are locked. We’ll let you know when ${o.first} submits milestone ${i + 1}.`} />;
  }

  if (a.status === "created")
    return <Box k="F-04" title="Not funded yet. Don’t start work." body={`${o.name} created this agreement but hasn’t locked any money in escrow. You’ll see it here as soon as they do.`} />;
  if (a.status === "funded")
    return <Box k="O-02" title="Review the terms" body={`${o.first} locked ${usd(total(a))} in escrow for ${plural(a.ms.length, "milestone")}. Accept to start, or decline if the terms don’t work for you.`}
      acts={<><B onClick={() => startTx("accept", { id: a.id })}>Accept agreement</B><B v="sec" onClick={() => startTx("decline", { id: a.id })}>Decline</B></>} />;
  if (m?.status === "pending")
    return <Box k="M-01" title={`Ready to submit ${m.title}`} body={`When the work is done, submit a link so ${o.first} can review it. ${usd(m.amount)} is waiting in escrow for this milestone.`}
      acts={<B onClick={() => startTx("submit", { id: a.id, i })}>Submit milestone</B>} />;
  if (m?.status === "submitted")
    return <Box k="M-02" title={`Waiting for ${o.first} to review`} body={`You submitted ${m.title} ${relTime(m.submittedAt!).toLowerCase()}. Nothing to do until ${o.first} approves it.`} />;
  return <Box k="M-04" title="Approved, not paid yet" body={`${o.first} approved ${m?.title}. The ${usd(m?.amount ?? 0)} reaches your wallet when they release it.`} />;
}
