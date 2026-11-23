"use client";

import { Icon, StatusBadge } from "@milevault/ui";
import { KV, Note } from "../bits";
import {
  andList, ESCROW_CONTRACT, fmt, locked, mid, num, PEOPLE, personByAddr, plural, released, short, shortHash, total, usd,
  useChain, useUI, type MockAgreement, type TxModal, getPerson
} from "@/mock";
import { Burst, FB, Foot, Head, HeroDlg, BallDlg, WalletRow } from "./parts";

type Row = [string, string, string?];

/** Rows shown in the review dialog AND the wallet popup (design txInfo) */
export function txInfo(md: TxModal, a: MockAgreement | undefined): { what: string; fn: string; ext: string; rows: Row[] } {
  const c = useChain.getState();
  const m = a && md.i !== undefined ? a.ms[md.i] : undefined;
  const k = a ? getPerson(a.contributor) : undefined;
  const cl = a ? getPerson(a.client) : undefined;
  const fee: Row = ["Network fee", "≈ 0.00001 XLM"];
  switch (md.kind) {
    case "create": {
      const d = c.draft; const t = d.ms.reduce((s, x) => s + parseFloat(x.amount || "0"), 0); const kp = personByAddr(d.addr);
      return { what: `create ${d.name}`, fn: "create_agreement", ext: "Create agreement",
        rows: [["Agreement", d.name], ["Contributor", kp ? `${kp.name} · ${short(kp.addr)}` : short(d.addr.trim())], ["Milestones", `${d.ms.length} · ${andList(d.ms.map((x) => num(parseFloat(x.amount))))}`], ["Total", `${fmt(t)} test USDC`], fee] };
    }
    case "fund": return { what: `lock ${usd(total(a!))}`, fn: "fund", ext: "Fund escrow", rows: [["Agreement", a!.name], ["Amount", `${fmt(total(a!))} test USDC`], ["To", `Escrow contract · ${short(ESCROW_CONTRACT)}`], fee] };
    case "approve": return { what: `approve ${m!.title}`, fn: "approve_milestone", ext: "Approve milestone", rows: [["Agreement", a!.name], ["Milestone", `${md.i! + 1} of ${a!.ms.length} · ${m!.title}`], ["Moves funds", "No"], fee] };
    case "release": return { what: `release ${usd(m!.amount)}`, fn: "release", ext: "Release payment", rows: [["Milestone", `${md.i! + 1} of ${a!.ms.length} · ${m!.title}`], ["To", `${k!.name} · ${mid(k!.addr)}`], ["Amount", `${fmt(m!.amount)} test USDC`], fee] };
    case "submit": return { what: `submit ${m!.title}`, fn: "submit_milestone", ext: "Submit milestone", rows: [["Agreement", a!.name], ["Milestone", `${md.i! + 1} of ${a!.ms.length} · ${m!.title}`], ["Link", (md.link || "").replace(/^https?:\/\//, "")], fee] };
    case "accept": return { what: `accept ${a!.name}`, fn: "accept", ext: "Accept agreement", rows: [["Agreement", a!.name], ["Client", `${cl!.name} · ${short(cl!.addr)}`], ["Escrow", `${fmt(total(a!))} USDC · funded`], fee] };
    case "decline": return { what: `decline ${a!.name}`, fn: "decline", ext: "Decline agreement", rows: [["Agreement", a!.name], ["Refund to client", usd(locked(a!))], fee] };
    case "cancel": return { what: `cancel ${a!.name}`, fn: "cancel", ext: "Cancel agreement", rows: [["Agreement", a!.name], ["Funds moved", "None"], fee] };
    case "request_cancel": return { what: `ask to cancel ${a!.name}`, fn: "request_cancel", ext: "Request cancellation", rows: [["Agreement", a!.name], ["Refund if confirmed", usd(locked(a!))], ["Already paid (stays paid)", usd(released(a!))], fee] };
    case "confirm_cancel": return { what: `cancel ${a!.name} and refund ${usd(locked(a!))}`, fn: "confirm_cancel", ext: "Confirm cancellation", rows: [["Agreement", a!.name], ["Refund to client", usd(locked(a!))], ["Already paid (stays paid)", usd(released(a!))], fee] };
    case "withdraw_cancel": return { what: `withdraw your cancellation request`, fn: "withdraw_cancel", ext: "Withdraw cancellation", rows: [["Agreement", a!.name], ["Funds moved", "None"], fee] };
  }
}

function declinedText(md: TxModal, a: MockAgreement | undefined, bal: number) {
  const m = a && md.i !== undefined ? a.ms[md.i] : undefined;
  switch (md.kind) {
    case "fund": return `Nothing changed. ${a!.name} is still awaiting funding and your ${usd(bal)} stays in your wallet.`;
    case "release": return `Nothing changed. Milestone ${md.i! + 1} is still Approved and the ${usd(m!.amount)} stays in escrow.`;
    case "approve": return `Nothing changed. ${m!.title} is still waiting for your review.`;
    case "create": return "Nothing was created. Your draft is saved, so you can try again whenever you’re ready.";
    case "submit": return `Nothing was submitted. ${m!.title} is still ready for you to submit.`;
    default: return "Nothing was signed and nothing changed.";
  }
}

export function TxContent({ md }: { md: TxModal }) {
  const a = useChain((s) => (md.id ? s.agreements.find((x) => x.id === md.id) : undefined));
  const me = useChain((s) => s.me)!;
  const draft = useChain((s) => s.draft);
  const bal = useChain((s) => s.balances[me].usdc);
  const wallet = useChain((s) => s.wallet) ?? "Freighter";
  const { close, sign, patchTx } = useUI.getState();
  const info = txInfo(md, a);
  const m = a && md.i !== undefined ? a.ms[md.i] : undefined;
  const k = a ? getPerson(a.contributor) : PEOPLE.kay;
  const cl = a ? getPerson(a.client) : getPerson(me);
  const other = a ? getPerson(a.client === me ? a.contributor : a.client) : k;

  if (md.step === "review") {
    switch (md.kind) {
      case "create":
        return (
          <BallDlg k="I-01" head={<Head title={`Create ${draft.name}`}>This records the agreement and its {plural(draft.ms.length, "milestone")} on Stellar Testnet. No USDC moves yet.</Head>}>
            <KV rows={info.rows} />
            <Note>You confirm this in {wallet}. Stellar Testnet only, no real money moves.</Note>
            <Foot><FB onClick={close}>Cancel</FB><FB v="pri" onClick={sign}>Confirm in {wallet}</FB></Foot>
          </BallDlg>
        );
      case "fund": {
        const need = total(a!); const shortBy = bal < need;
        return (
          <HeroDlg k="F-01">
            <Head title={`Fund ${a!.name}`}>Lock {fmt(need)} test USDC in the escrow contract. It’s released to {k.name} one milestone at a time.</Head>
            <KV rows={[["Amount", `${fmt(need)} test USDC`], ["Milestones", `${a!.ms.length} · ${andList(a!.ms.map((x) => num(x.amount)))}`], ["Your balance", `${fmt(bal)} → ${shortBy ? "—" : usd(bal - need)}`], ["Network fee", "≈ 0.00001 XLM"]]} />
            {shortBy
              ? <Note icon="warning">You need {usd(need - bal)} more. Get test USDC from the faucet, then try again.</Note>
              : <Note>You can request cancellation later. Anything not yet released is refundable if both agree.</Note>}
            <Foot><FB onClick={close}>Cancel</FB><FB v="pri" onClick={sign} disabled={shortBy}>Confirm</FB></Foot>
          </HeroDlg>
        );
      }
      case "approve":
        return (
          <HeroDlg k="M-03">
            <Head title={`Approve ${m!.title}?`}>This records that you accept milestone {md.i! + 1}. It doesn’t pay {k.name} yet; you release the {usd(m!.amount)} as the next step.</Head>
            <KV rows={[["Submitted link", m!.link ?? "—"], ["Amount to release next", usd(m!.amount)], ["Network fee", "≈ 0.00001 XLM"]]} />
            <Foot><FB onClick={close}>Not yet</FB><FB v="pri" onClick={sign}>Approve</FB></Foot>
          </HeroDlg>
        );
      case "release":
        return (
          <BallDlg k="I-01" head={<Head title={`Release ${usd(m!.amount)}`}>To {k.name} for milestone {md.i! + 1}, {m!.title}. This pays from the escrow for {a!.name}.</Head>}>
            <KV rows={[["Agreement", a!.name], ...info.rows]} />
            <Note>You confirm this in {wallet}. Stellar Testnet only, no real money moves.</Note>
            <Foot><FB onClick={close}>Cancel</FB><FB v="pri" onClick={sign}>Release</FB></Foot>
          </BallDlg>
        );
      case "submit": {
        const submit = () => {
          const link = (md.link || "").trim();
          if (!link) return patchTx({ linkError: `Add a link so ${cl.first} can review your work` });
          if (!/^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(link)) return patchTx({ linkError: "That doesn’t look like a link. Try https://…" });
          sign();
        };
        const examples = ["figma.com/proto/website-v1", "figma.com/proto/website-v2", "github.com/kay/website/releases/v1.0"];
        const notes = ["Wireframes for all 8 pages, with notes on each.", "All pages built and the CMS is live on staging.", "Deployed, analytics on, docs in the README."];
        return (
          <HeroDlg k="M-01">
            <Head title="Add your work">Milestone {md.i! + 1} of {a!.ms.length}, {m!.title}. {cl.first} reviews it before releasing {usd(m!.amount)}.</Head>
            <div className="fld">
              <label className="lbl" htmlFor="sub-link">Link to your work<span className="req">*</span></label>
              <div className={`inp${md.linkError ? " err" : ""}`}>
                <Icon name="link" size={16} color="#A3A3A3" />
                <input id="sub-link" autoFocus value={md.link ?? ""} placeholder="https://" inputMode="url"
                  onChange={(e) => patchTx({ link: e.target.value, linkError: undefined })}
                  onKeyDown={(e) => e.key === "Enter" && submit()} />
              </div>
              {md.linkError
                ? <div className="hint err" role="alert"><Icon name="warning" size={16} />{md.linkError}</div>
                : <div className="hint"><Icon name="info" size={16} /><span>A Figma file, staging URL or repo. <button className="link" onClick={() => patchTx({ link: `https://${examples[md.i!] ?? "figma.com/proto/work"}`, note: notes[md.i!] ?? "" })}>Use an example</button></span></div>}
            </div>
            <div className="fld">
              <label className="lbl" htmlFor="sub-note">Note for {cl.first}<span className="opt">(Optional)</span></label>
              <div className="inp ta" style={{ height: 88 }}>
                <textarea id="sub-note" maxLength={300} value={md.note ?? ""} placeholder="Anything they should know?" onChange={(e) => patchTx({ note: e.target.value })} />
              </div>
            </div>
            <Foot><FB onClick={close}>Cancel</FB><FB v="pri" onClick={submit}>Submit</FB></Foot>
          </HeroDlg>
        );
      }
      case "decline":
        return (
          <HeroDlg k="C-06">
            <Head title={`Decline ${a!.name}?`}>{cl.name} gets the {usd(total(a!))} back from escrow. You can’t accept it again after declining.</Head>
            <KV rows={info.rows} />
            <Foot><FB onClick={close}>Keep it</FB><FB v="danger" onClick={sign}>Decline</FB></Foot>
          </HeroDlg>
        );
      case "cancel":
        return (
          <HeroDlg k="C-01">
            <Head title={`Cancel ${a!.name}?`}>It isn’t funded, so no money moves. {k.first} sees it as cancelled and you can’t reopen it.</Head>
            <KV rows={info.rows} />
            <Foot><FB onClick={close}>Keep it</FB><FB v="danger" onClick={sign}>Cancel agreement</FB></Foot>
          </HeroDlg>
        );
      case "request_cancel":
        return (
          <HeroDlg k="C-04">
            <Head title={`Ask to cancel ${a!.name}?`}>{other.first} has to confirm before anything moves. When they do, the {usd(locked(a!))} still in escrow goes back to {a!.client === me ? "you" : cl.name}. Paid milestones stay paid.</Head>
            <KV rows={info.rows} />
            <Note>Until {other.first} confirms, the agreement is paused. You can withdraw the request any time.</Note>
            <Foot><FB onClick={close}>Keep it</FB><FB v="danger" onClick={sign}>Request cancellation</FB></Foot>
          </HeroDlg>
        );
      case "confirm_cancel":
        return (
          <HeroDlg k="C-07">
            <Head title="Confirm cancellation?">{other.name} asked to cancel {a!.name}. Confirming refunds the {usd(locked(a!))} still in escrow to {a!.client === me ? "you" : cl.name}. This can’t be undone.</Head>
            <KV rows={info.rows} />
            <Foot><FB onClick={close}>Not now</FB><FB v="danger" onClick={sign}>Confirm and refund</FB></Foot>
          </HeroDlg>
        );
      default:
        return null;
    }
  }

  if (md.step === "wait")
    return (
      <HeroDlg k="T-02">
        <Head title="Check your wallet">Approve the request in {wallet} to {info.what}. Nothing moves until you sign.</Head>
        <WalletRow name={wallet} sub={<small>Waiting for your signature…</small>} right={<Icon name="loading" size={20} color="#2EBEF2" className="spin" />} active />
        <Foot><FB onClick={close}>Cancel</FB><FB v="pri" loading>Waiting for signature</FB></Foot>
      </HeroDlg>
    );

  if (md.step === "pending")
    return (
      <HeroDlg k="T-03" closable={false} className="waiting">
        <Head title={<>Waiting for the network<span className="dots"><i>.</i><i>.</i><i>.</i></span></>}>Submitted to Stellar Testnet. This usually takes a few seconds. MileVault updates the agreement as soon as it confirms.</Head>
        <KV rows={[["Transaction", shortHash(md.hash!), md.hash], ["Status", <StatusBadge key="s" status="processing" />]]} />
        <Foot><FB v="pri" loading>Confirming on Stellar…</FB></Foot>
      </HeroDlg>
    );

  if (md.step === "declined")
    return (
      <HeroDlg k="T-06E" err>
        <Head title={`You declined in ${wallet}`}>{declinedText(md, a, bal)}</Head>
        <Foot><FB onClick={close}>Cancel</FB><FB v="pri" onClick={sign}>Try again</FB></Foot>
      </HeroDlg>
    );

  if (md.step === "failed")
    return (
      <HeroDlg k="W-05E" err>
        <Head title="Transaction failed">{md.error}</Head>
        <KV rows={[["Transaction", shortHash(md.hash!), md.hash], ["Status", <StatusBadge key="s" status="failed" />]]} />
        <Note icon="info">Failed transactions never move funds or mark milestones paid.</Note>
        <Foot><FB onClick={close}>Close</FB><FB v="pri" onClick={sign}>Try again</FB></Foot>
      </HeroDlg>
    );

  if (md.step === "done") {
    if (md.kind === "fund")
      return (
        <HeroDlg k="F-02">
          <Head title="Escrow funded">{usd(total(a!))} is locked in the contract. {k.first} can see it’s funded and start on milestone 1.</Head>
          <KV rows={[["Locked", usd(total(a!))], ["Your balance", usd(bal)], ["Transaction", shortHash(md.hash!), md.hash]]} />
          <Foot><FB v="pri" onClick={close}>Done</FB></Foot>
        </HeroDlg>
      );
    if (md.kind === "release") {
      const done = a!.status === "completed";
      return (
        <HeroDlg k={done ? "M-10" : "M-06"}>
          <Burst />
          <Head title={done ? "Agreement completed" : "Payment released"}>
            {done ? `${usd(m!.amount)} is in ${k.name}’s wallet. Every milestone of ${a!.name} is paid and the escrow is empty.` : `${usd(m!.amount)} is in ${k.name}’s wallet. Milestone ${md.i! + 1} is now Paid.`}
          </Head>
          <KV rows={[["Amount", usd(m!.amount)], ["Left in escrow", usd(locked(a!))], ["Transaction", shortHash(md.hash!), md.hash]]} />
          <Foot><FB v="pri" onClick={close}>Done</FB></Foot>
        </HeroDlg>
      );
    }
    if (md.kind === "confirm_cancel")
      return (
        <HeroDlg k="C-07">
          <Head title="Agreement cancelled">{a!.refunded ? `${usd(a!.refunded)} went back to ${a!.client === me ? "your wallet" : cl.name}.` : "There was nothing left in escrow to refund."} Paid milestones stay paid.</Head>
          <KV rows={[["Refunded", usd(a!.refunded ?? 0)], ["Paid out earlier", usd(released(a!))], ["Transaction", shortHash(md.hash!), md.hash]]} />
          <Foot><FB v="pri" onClick={close}>Done</FB></Foot>
        </HeroDlg>
      );
  }
  return null;
}
