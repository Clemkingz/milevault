"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError, assetCode, fmtAmount, fromCents, money, shortAddr, shortHash, toCents, type ActionKind, type ChainAction } from "@milevault/api";
import { Icon, StatusBadge } from "@milevault/ui";
import { KV, Note } from "../bits";
import { useActions } from "../use-actions";
import { api } from "@/lib/backend";
import { ACTION_COPY, changesRequested, otherName } from "@/lib/domain";
import { invalidateAll, useAgreement, useWalletOverview } from "@/lib/queries";
import { usePrefs } from "@/lib/prefs";
import { useSession } from "@/lib/session";
import { useUI, type ConfirmOp } from "@/lib/ui";
import { wallet, WalletDeclined, WalletMismatch } from "@/lib/wallet";
import { signOut } from "@/lib/auth";
import { BallDlg, Burst, FB, Foot, Head, HeroDlg, WalletRow } from "./parts";

type Step = "review" | "preparing" | "wallet" | "pending" | "stillPending" | "done" | "declined" | "failed";
/** Fix-it link shown with a readiness problem */
type Fix = { label: string; href: string; external?: boolean };
const FEE = "≈ 0.00001 XLM";

/** On-chain action: review → backend prepares → wallet signs → backend submits (poll if pending) */
export function ActionDialog({ refId, kind, position }: { refId: string; kind: ActionKind; position?: number }) {
  const qc = useQueryClient();
  const { data: a } = useAgreement(refId);
  const me = useSession((s) => s.address)!;
  const walletName = useSession((s) => s.walletId) ?? "Varial";
  const { data: w } = useWalletOverview();
  const close = useUI((s) => s.close);
  const toast = useUI((s) => s.toast);
  const txToasts = usePrefs((s) => s.txToasts);
  const { explorer } = useActions();
  const [step, setStep] = useState<Step>("review");
  const [error, setError] = useState<string>();
  const [fix, setFix] = useState<Fix>();
  const [cooldown, setCooldown] = useState(0);
  const [result, setResult] = useState<ChainAction>();
  const router = useRouter();
  useEffect(() => { if (cooldown <= 0) return; const t = setTimeout(() => setCooldown((c) => c - 1), 1000); return () => clearTimeout(t); }, [cooldown]);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  if (!a) return <HeroDlg k="T-03" className="waiting"><Head title="Loading agreement…">One moment.</Head></HeroDlg>;
  const ms = position ? a.milestones.find((m) => m.position === position) : undefined;
  const asset = a.asset, code = assetCode(asset);
  const o = otherName(a);
  const title = ACTION_COPY[kind].title;

  // Wallet readiness (guide §6) from GET /wallet, checked before every signature
  const faucet: Fix = { label: `Get test ${code}`, href: "https://faucet.circle.com", external: true };
  const toWallet: Fix = { label: "Open Wallet", href: "/wallets" };
  const shortfall = (() => { const bal = toCents(w?.assetBalance ? w.assetBalance.replace(/(\.\d{2})\d*$/, "$1") : "0"), need = toCents(a.total); return bal !== null && need !== null && bal < need ? need - bal : 0n; })();
  const ready: [string, Fix] | null = !w || !w.balancesAvailable ? null
    : !w.accountExists ? ["This wallet isn’t active on Stellar yet. Add test XLM (Friendbot) to activate it. Every signer pays its own small network fee.", toWallet]
    : kind === "fund" && !w.hasTrustline ? [`This wallet can’t hold ${code} yet. Enable ${code} on the Wallet page, then fund.`, toWallet]
    : kind === "fund" && shortfall > 0n ? [`You need ${money(fromCents(shortfall), asset)} more to fund this agreement.`, faucet]
    : w.xlmBalance !== null && Number(w.xlmBalance) < 1 ? ["Your XLM balance is low. Add test XLM so you can pay the network fee.", toWallet]
    : null;

  const fail = (msg: string, f?: Fix) => { setError(msg); setFix(f); setStep("failed"); };
  const run = async () => {
    setError(undefined); setFix(undefined); setResult(undefined);
    try {
      setStep("preparing");
      const p = await api.escrow.prepare(a.reference, kind, position);
      if (!alive.current) return;
      if (!p.transaction) throw new Error("The API did not return a transaction to sign.");
      setStep("wallet");
      const rows: [string, string][] = [["Agreement", `${a.name} · ${a.reference}`], ...(ms ? [["Milestone", `${ms.position} · ${ms.title}`] as [string, string]] : []), ...(p.amount ? [["Amount", money(p.amount, asset)] as [string, string]] : []), ["Network fee", FEE]];
      // Sign exactly what the backend prepared — never edit fee, memo or time bounds.
      const signed = await wallet.sign(p.transaction, { networkPassphrase: p.networkPassphrase, address: me, purpose: "action", title, fn: ACTION_COPY[kind].fn, rows });
      if (!alive.current) return;
      setStep("pending");
      let r = await api.escrow.submit(p.id, signed);
      // A 200 is not success: poll while pending, until shortly after the transaction's time bounds.
      const deadline = new Date(r.expiresAt).getTime() + 60_000;
      while (r.status === "pending" && Date.now() < deadline && alive.current) { await new Promise((x) => setTimeout(x, 3000)); r = await api.escrow.status(r.id); }
      if (!alive.current) return;
      setResult(r);
      invalidateAll(qc, a.reference);
      // The result screens read the agreement, so wait for the backend's fresh copy (it owns state)
      if (r.status === "confirmed") await qc.refetchQueries({ queryKey: ["agreement", a.reference.toUpperCase()] }).catch(() => undefined);
      if (!alive.current) return;
      if (r.status === "confirmed") {
        if (["approve", "decline", "propose_cancel"].includes(kind)) { close(); if (txToasts) toast(r.statusMessage, { hash: r.hash }); }
        else setStep("done");
      } else if (r.status === "pending") setStep("stillPending");
      else if (r.status === "expired") fail("The transaction expired. Nothing moved. Try again to prepare a new one.");
      else fail(r.failure ?? r.statusMessage, r.failureCode === "INSUFFICIENT_BALANCE" ? faucet : ["TRUSTLINE_MISSING", "ACCOUNT_NOT_ACTIVE", "INSUFFICIENT_XLM"].includes(r.failureCode ?? "") ? toWallet : undefined);
    } catch (e) {
      if (e instanceof WalletDeclined) return setStep("declined");
      if (e instanceof WalletMismatch) { close(); toast("Your wallet switched to another account. Sign in again with it.", { tone: "warning" }); void signOut({ silent: true }); return; }
      invalidateAll(qc, a.reference);
      if (!(e instanceof ApiError)) return fail(e instanceof Error ? e.message : "Something went wrong. Nothing moved.");
      switch (e.code) {
        case "INSUFFICIENT_BALANCE": return fail(e.details?.shortfall ? `You need ${money(String(e.details.shortfall), asset)} more to fund this agreement.` : e.message, faucet);
        case "TRUSTLINE_MISSING": case "ACCOUNT_NOT_ACTIVE": return fail(e.message, toWallet);
        case "RECIPIENT_TRUSTLINE_MISSING": return fail(`${e.message} Ask them to open their Wallet page and enable ${code}.`);
        case "RATE_LIMITED": setCooldown(e.retryAfterSeconds ?? 5); return fail(e.message);
        case "TRANSACTION_IN_PROGRESS": setCooldown(5); return fail(e.message);
        case "INVALID_TRANSACTION": case "TRANSACTION_MISMATCH": case "SIGNATURE_MISSING": return fail("The wallet didn’t sign the original transaction. Nothing moved. Start again.");
        default: return fail(e.message);
      }
    }
  };
  const fixBtn = fix && (fix.external
    ? <FB onClick={() => window.open(fix.href, "_blank", "noopener")}>{fix.label}</FB>
    : <FB onClick={() => { close(); router.push(fix.href); }}>{fix.label}</FB>);

  if (step === "review") {
    const block = ready && <Foot><FB onClick={close}>Cancel</FB>{ready[1].external ? <FB v="pri" onClick={() => window.open(ready[1].href, "_blank", "noopener")}>{ready[1].label}</FB> : <FB v="pri" onClick={() => { close(); router.push(ready[1].href); }}>{ready[1].label}</FB>}</Foot>;
    const footer = (label: string, danger = false) => block || <Foot><FB onClick={close}>Cancel</FB><FB v={danger ? "danger" : "pri"} onClick={run}>{label}</FB></Foot>;
    const readyNote = ready && <Note icon="warning">{ready[0]}</Note>;
    switch (kind) {
      case "fund": return (
        <HeroDlg k="F-01">
          <Head title={`Fund ${a.name}`}>Lock {money(a.total, asset)} in escrow on Stellar. Each milestone is locked separately and paid to {o} when you release it.</Head>
          <KV rows={[["Amount", money(a.total, asset)], ["Asset", `${code} · ${shortAddr(asset.split(":")[1])}`], ["Milestones", String(a.milestoneCount)], ["Your balance", !w ? "Checking…" : !w.balancesAvailable ? "Unavailable right now" : w.assetBalance != null ? `${fmtAmount(w.assetBalance)} ${code}` : "—"], ["Locked in", "Stellar escrow"], ["Network fee", FEE]]} />
          {readyNote || <Note>If both sides agree later, anything not yet released can be refunded.</Note>}
          {footer("Continue")}
        </HeroDlg>);
      case "approve": return (
        <HeroDlg k="M-03">
          <Head title={`Approve ${ms?.title}?`}>This records that you accept milestone {position} on-chain. It doesn’t pay {o} yet; you release the {money(ms?.amount, asset)} as the next step.</Head>
          <KV rows={[["Submitted link", ms?.workLink?.replace(/^https?:\/\//, "") ?? "—"], ["Amount to release next", money(ms?.amount, asset)], ["Network fee", FEE]]} />
          {ms?.workNote && <Note>“{ms.workNote}”</Note>}
          {readyNote}
          {block || <Foot><FB onClick={close}>Not yet</FB><FB v="pri" onClick={run}>Approve</FB></Foot>}
        </HeroDlg>);
      case "release": return (
        <BallDlg k="I-01" head={<Head title={`Release ${money(ms?.amount, asset)}`}>To {o} for milestone {position}, {ms?.title}.</Head>}>
          <KV rows={[["Agreement", `${a.name} · ${a.reference}`], ["To", o], ["Amount", money(ms?.amount, asset)], ["Network fee", FEE]]} />
          {readyNote}
          {footer("Release")}
        </BallDlg>);
      case "decline": return (
        <HeroDlg k="C-06">
          <Head title={`Decline ${a.name}?`}>The {money(a.locked, asset)} in escrow goes back to {o}. You can’t accept it again after declining.</Head>
          <KV rows={[["Refund to client", money(a.locked, asset)], ["Network fee", FEE]]} />
          {readyNote}
          {footer("Decline", true)}
        </HeroDlg>);
      case "propose_cancel": return (
        <HeroDlg k="C-04">
          <Head title={`Propose cancelling ${a.name}?`}>{o} has to confirm before anything moves. If they do, the {money(a.locked, asset)} still in escrow goes back to the client. Paid milestones stay paid.</Head>
          <KV rows={[["Refund if confirmed", money(a.locked, asset)], ["Already paid (stays paid)", money(a.released, asset)], ["Network fee", FEE]]} />
          <Note>They can confirm or reject. You can withdraw the proposal any time before they confirm.</Note>
          {readyNote}
          {footer("Propose cancellation", true)}
        </HeroDlg>);
      case "confirm_cancel": return (
        <HeroDlg k="C-07">
          <Head title="Confirm cancellation?">Confirming refunds the {money(a.locked, asset)} still in escrow to the client. This can’t be undone.</Head>
          <KV rows={[["Refund to client", money(a.locked, asset)], ["Already paid (stays paid)", money(a.released, asset)], ["Network fee", FEE]]} />
          {readyNote}
          {footer("Confirm and refund", true)}
        </HeroDlg>);
      case "recover": return (
        <HeroDlg k="C-07">
          <Head title="Recover the escrow?">The recovery date has passed. This returns the {money(a.locked, asset)} that wasn’t released to your wallet and closes the agreement.</Head>
          <KV rows={[["Recovered to you", money(a.locked, asset)], ["Recovery date", a.recoveryAt ? new Date(a.recoveryAt).toLocaleDateString() : "—"], ["Network fee", FEE]]} />
          {readyNote}
          {footer("Recover funds")}
        </HeroDlg>);
    }
  }
  if (step === "preparing") return (
    <HeroDlg k="T-02" className="waiting" closable={false}>
      <Head title="Preparing the transaction">MileVault is building the exact transaction for your wallet to sign.</Head>
      <Foot><FB v="pri" loading>Preparing…</FB></Foot>
    </HeroDlg>);
  if (step === "wallet") return (
    <HeroDlg k="T-02">
      <Head title="Check your wallet">Approve “{title}” in {walletName}. Nothing moves until you sign.</Head>
      <WalletRow name={walletName} sub={<small>Waiting for your signature…</small>} right={<Icon name="loading" size={20} color="#2EBEF2" className="spin" />} active />
      <Foot><FB onClick={close}>Cancel</FB><FB v="pri" loading>Waiting for signature</FB></Foot>
    </HeroDlg>);
  if (step === "pending") return (
    <HeroDlg k="T-03" closable={false} className="waiting">
      <Head title={<>Waiting for the network<span className="dots"><i>.</i><i>.</i><i>.</i></span></>}>Submitted to Stellar. This usually takes a few seconds; the agreement updates as soon as it confirms.</Head>
      <KV rows={[["Action", title], ["Status", <StatusBadge key="s" status="processing" />]]} />
      <Foot><FB v="pri" loading>Confirming on Stellar…</FB></Foot>
    </HeroDlg>);
  if (step === "stillPending") return (
    <HeroDlg k="T-03">
      <Head title="Still confirming">Stellar hasn’t confirmed it yet. You can safely close this; the agreement updates when it lands. Don’t start it again while it’s in flight.</Head>
      {result?.hash && <KV rows={[["Transaction", <button key="h" className="xl" onClick={() => explorer(result.hash)}>{shortHash(result.hash)}<Icon name="external" size={14} /></button>], ["Status", <StatusBadge key="s" status="processing" />]]} />}
      <Foot><FB v="pri" onClick={close}>Close</FB></Foot>
    </HeroDlg>);
  if (step === "declined") return (
    <HeroDlg k="T-06E" err>
      <Head title={`You declined in ${walletName}`}>Nothing was signed and nothing changed.</Head>
      <Foot><FB onClick={close}>Close</FB><FB v="pri" onClick={run}>Try again</FB></Foot>
    </HeroDlg>);
  if (step === "failed") return (
    <HeroDlg k="W-05E" err>
      <Head title="Transaction didn’t go through">{error}</Head>
      {result?.status === "failed" && <KV rows={[["Transaction", <button key="h" className="xl" onClick={() => explorer(result.hash)}>{shortHash(result.hash)}<Icon name="external" size={14} /></button>], ["Status", <StatusBadge key="s" status="failed" />]]} />}
      <Note>Failed transactions never move funds or mark milestones paid.</Note>
      <Foot>{fixBtn ?? <FB onClick={close}>Close</FB>}<FB v="pri" onClick={run} disabled={cooldown > 0}>{cooldown > 0 ? `Try again in ${cooldown}s` : "Try again"}</FB></Foot>
    </HeroDlg>);

  // done
  const fresh = a; // refetched after the outcome (backend owns state)
  const hashRow: [string, React.ReactNode] = ["Transaction", result?.hash ? <button key="h" className="xl" onClick={() => explorer(result.hash)}>{shortHash(result.hash)}<Icon name="external" size={14} /></button> : "—"];
  if (kind === "fund") return (
    <HeroDlg k="F-02">
      <Head title="Escrow funded">{result?.statusMessage ?? `${money(a.total, asset)} is locked in escrow. ${o} can see it’s funded and accept the terms.`}</Head>
      <KV rows={[["Locked", money(a.total, asset)], hashRow]} />
      <Foot><FB v="pri" onClick={close}>Done</FB></Foot>
    </HeroDlg>);
  if (kind === "release") { const all = fresh.status === "completed"; return (
    <HeroDlg k={all ? "M-10" : "M-06"}>
      <Burst />
      <Head title={all ? "Agreement completed" : "Payment released"}>{money(ms?.amount, asset)} was paid to {o}.{all ? " Every milestone is paid and the escrow is empty." : ` Milestone ${position} is now paid.`}</Head>
      <KV rows={[["Amount", money(ms?.amount, asset)], ["Left in escrow", money(fresh.locked, asset)], hashRow]} />
      <Foot><FB v="pri" onClick={close}>Done</FB></Foot>
    </HeroDlg>); }
  return (
    <HeroDlg k="C-07">
      <Head title={kind === "recover" ? "Escrow recovered" : "Agreement cancelled"}>{money(fresh.refunded, asset)} went back to the client. Paid milestones stay paid.</Head>
      <KV rows={[["Refunded", money(fresh.refunded, asset)], ["Paid out earlier", money(fresh.released, asset)], hashRow]} />
      <Foot><FB v="pri" onClick={close}>Done</FB></Foot>
    </HeroDlg>);
}

/** Off-chain operations (no wallet signature) */
export function ConfirmDialog({ op, refId, position }: { op: ConfirmOp; refId: string; position?: number }) {
  const qc = useQueryClient();
  const router = useRouter();
  const { data: a } = useAgreement(refId);
  const close = useUI((s) => s.close);
  const toast = useUI((s) => s.toast);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>();
  const [link, setLink] = useState(""); const [note, setNote] = useState(""); const [linkErr, setLinkErr] = useState<string>();
  if (!a) return <HeroDlg k="T-03" className="waiting"><Head title="Loading agreement…">One moment.</Head></HeroDlg>;
  const ms = position ? a.milestones.find((m) => m.position === position) : undefined;
  const o = otherName(a);

  const exec = async (fn: () => Promise<unknown>, done: string, after?: () => void) => {
    setBusy(true); setErr(undefined);
    try { await fn(); invalidateAll(qc, a.reference); close(); toast(done); after?.(); }
    catch (e) {
      invalidateAll(qc, a.reference); // the agreement may have changed: refetch (guide §3)
      if (e instanceof ApiError && e.code === "DRAFT_INCOMPLETE") {
        const step = e.fields.some((x) => x.field.startsWith("milestones")) && !e.fields.some((x) => ["name", "contributorAddress", "description"].includes(x.field)) ? 2 : 1;
        close(); toast(e.fields[0]?.message ?? e.message, { tone: "warning" }); router.push(`/agreements/${a.reference}/edit?step=${step}`); return;
      }
      if (e instanceof ApiError) { const f = e.fieldMessage("link"); if (f) setLinkErr(f); setErr(e.fields.length > 1 ? e.fields.map((x) => x.message).join(" · ") : e.message); }
      else setErr("Something went wrong. Try again.");
    } finally { setBusy(false); }
  };
  const errNote = err && <Note icon="warning">{err}</Note>;

  switch (op) {
    case "publish": return (
      <HeroDlg k="O-02">
        <Head title={`Publish ${a.name}?`}>Publishing fixes the terms and shares the agreement with {o}. You can’t edit it afterwards; the next step is funding the escrow.</Head>
        <KV rows={[["Contributor", o], ["Milestones", String(a.milestoneCount)], ["Total", money(a.total, a.asset)], ["Asset", assetCode(a.asset)]]} />
        {errNote}
        <Foot><FB onClick={close}>Keep editing</FB><FB v="pri" loading={busy} onClick={() => exec(() => api.agreements.publish(a.reference), `${a.name} published`, () => router.push(`/agreements/${a.reference}/created`))}>Publish</FB></Foot>
      </HeroDlg>);
    case "accept": return (
      <HeroDlg k="O-02">
        <Head title={`Accept ${a.name}?`}>{money(a.total, a.asset)} is locked in escrow for {a.milestoneCount} milestone{a.milestoneCount === 1 ? "" : "s"}. Accepting tells {o} you’re starting milestone 1.</Head>
        <KV rows={[["Client", o], ["Escrow", `${money(a.locked, a.asset)} · funded`], ["Milestones", String(a.milestoneCount)]]} />
        {errNote}
        <Foot><FB onClick={close}>Not yet</FB><FB v="pri" loading={busy} onClick={() => exec(() => api.agreements.accept(a.reference), "Accepted. The client can see you’ve started.")}>Accept agreement</FB></Foot>
      </HeroDlg>);
    case "cancel": return (
      <HeroDlg k="C-01">
        <Head title={`Cancel ${a.name}?`}>It isn’t funded, so no money moves. {o} sees it as cancelled and you can’t reopen it.</Head>
        {errNote}
        <Foot><FB onClick={close}>Keep it</FB><FB v="danger" loading={busy} onClick={() => exec(() => api.agreements.cancel(a.reference), `${a.name} was cancelled`)}>Cancel agreement</FB></Foot>
      </HeroDlg>);
    case "delete_draft": return (
      <HeroDlg k="C-01">
        <Head title={`Delete “${a.name || "Untitled draft"}”?`}>This draft was never published, so nobody else has seen it. It can’t be restored.</Head>
        {errNote}
        <Foot><FB onClick={close}>Keep it</FB><FB v="danger" loading={busy} onClick={() => exec(() => api.agreements.remove(a.reference), "Draft deleted", () => router.push("/agreements"))}>Delete draft</FB></Foot>
      </HeroDlg>);
    case "withdraw_cancel": return (
      <HeroDlg k="C-04">
        <Head title="Withdraw your cancellation proposal?">{a.name} carries on as agreed. Nothing moves.</Head>
        {errNote}
        <Foot><FB onClick={close}>Keep proposal</FB><FB v="pri" loading={busy} onClick={() => exec(() => api.agreements.withdrawCancellation(a.reference), "Cancellation withdrawn. The agreement continues.")}>Withdraw</FB></Foot>
      </HeroDlg>);
    case "reject_cancel": return (
      <HeroDlg k="C-04">
        <Head title="Reject the cancellation?">{a.name} carries on as agreed and the escrow stays locked.</Head>
        {errNote}
        <Foot><FB onClick={close}>Not now</FB><FB v="pri" loading={busy} onClick={() => exec(() => api.agreements.rejectCancellation(a.reference), "Cancellation rejected. The agreement continues.")}>Reject cancellation</FB></Foot>
      </HeroDlg>);
    case "submit": {
      const submit = () => {
        const l = link.trim();
        if (!l) return setLinkErr("Add a link so the client can review your work");
        // The API requires a full URL with its protocol (the prototype's bare domains are rejected).
        if (!/^https?:\/\//i.test(l)) return setLinkErr("Include the full link, starting with https://");
        if (!/^https?:\/\/[\w-]+(\.[\w-]+)+(:\d+)?(\/\S*)?$/i.test(l)) return setLinkErr("That doesn’t look like a link. Try https://…");
        if (l.length > 500) return setLinkErr("Use a link of 500 characters or fewer");
        void exec(() => api.agreements.submit(a.reference, position!, { link: l, note: note.trim() || undefined }), `${ms?.title} submitted. The client can review it now.`);
      };
      return (
        <HeroDlg k="M-01">
          <Head title={ms && changesRequested(ms) ? "Resubmit your work" : "Add your work"}>Milestone {position} of {a.milestoneCount}, {ms?.title}. The client reviews it before releasing {money(ms?.amount, a.asset)}.</Head>
          {ms?.changesNote && <Note icon="edit">Requested changes: “{ms.changesNote}”</Note>}
          <div className="fld">
            <label className="lbl" htmlFor="sub-link">Link to your work<span className="req">*</span></label>
            <div className={`inp${linkErr ? " err" : ""}`}><Icon name="link" size={16} color="#A3A3A3" /><input id="sub-link" autoFocus value={link} placeholder="https://" inputMode="url" onChange={(e) => { setLink(e.target.value); setLinkErr(undefined); }} onKeyDown={(e) => e.key === "Enter" && submit()} /></div>
            {linkErr ? <div className="hint err" role="alert"><Icon name="warning" size={16} />{linkErr}</div> : <div className="hint"><Icon name="info" size={16} />A Figma file, staging URL or repo.</div>}
          </div>
          <div className="fld">
            <label className="lbl" htmlFor="sub-note">Note for the client<span className="opt">(Optional)</span></label>
            <div className="inp ta" style={{ height: 88 }}><textarea id="sub-note" maxLength={300} value={note} placeholder="Anything they should know?" onChange={(e) => setNote(e.target.value)} /><span className="cnt">{note.length}/300</span></div>
          </div>
          {err && !linkErr && <Note icon="warning">{err}</Note>}
          <Foot><FB onClick={close}>Cancel</FB><FB v="pri" loading={busy} onClick={submit}>Submit</FB></Foot>
        </HeroDlg>);
    }
    case "request_changes": return (
      <HeroDlg k="M-02">
        <Head title={`Request changes on ${ms?.title}?`}>It goes back to {o} with your note. Nothing is paid or released.</Head>
        <div className="fld">
          <label className="lbl" htmlFor="rc-note">What should change?<span className="req">*</span></label>
          <div className={`inp ta${err ? " err" : ""}`} style={{ height: 108 }}><textarea id="rc-note" autoFocus maxLength={300} value={note} placeholder="Please add the mobile layouts." onChange={(e) => { setNote(e.target.value); setErr(undefined); }} /><span className="cnt">{note.length}/300</span></div>
          {err && <div className="hint err" role="alert"><Icon name="warning" size={16} />{err}</div>}
        </div>
        <Foot><FB onClick={close}>Cancel</FB><FB v="pri" loading={busy} onClick={() => note.trim() ? exec(() => api.agreements.requestChanges(a.reference, position!, note.trim()), "Changes requested. The contributor has been notified.") : setErr("Tell the contributor what to change")}>Send back</FB></Foot>
      </HeroDlg>);
  }
}
