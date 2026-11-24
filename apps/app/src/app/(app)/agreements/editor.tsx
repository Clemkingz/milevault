"use client";

import { useRouter } from "next/navigation";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { ApiError, fromCents, isValidPublicKey, money, shortAddr, toCents, type Agreement, type SaveAgreementInput } from "@milevault/api";
import { Button, Icon, StatusBadge } from "@milevault/ui";
import { Avatar } from "@/components/art";
import { AssetPill, Back, Empty, KV } from "@/components/bits";
import { Page } from "@/components/shell/page";
import { AgreementSkeleton } from "@/components/shell/skeleton";
import { useEscrowConfig, useSaveDraft } from "@/lib/queries";
import { useSession } from "@/lib/session";
import { useUI } from "@/lib/ui";

type Ms = { title: string; description: string; amount: string };
type Form = { name: string; description: string; contributorAddress: string; milestones: Ms[] };
type Errors = Record<string, string>;
const MAX = 10;
const MAX_CENTS = 900_000_000_000n * 100n;
/** Form total in integer cents (never float arithmetic on money) */
const totalCents = (f: Form) => f.milestones.reduce((s, m) => s + (toCents(m.amount) ?? 0n), 0n);
const blank = (): Ms => ({ title: "", description: "", amount: "" });

function validate(f: Form, step: number, me: string): Errors {
  const e: Errors = {};
  if (step >= 1) {
    if (!f.name.trim()) e.name = "Give the agreement a name";
    else if (f.name.trim().length > 60) e.name = "Use 60 characters or fewer";
    if (f.description.trim().length > 500) e.description = "Use 500 characters or fewer";
    const ad = f.contributorAddress.trim();
    if (!ad) e.contributorAddress = "Paste your contributor’s Stellar address";
    else if (ad === me) e.contributorAddress = "That’s your own address. Use your contributor’s.";
    else if (!isValidPublicKey(ad)) e.contributorAddress = "Enter a valid Stellar address. It starts with G and has 56 characters.";
  }
  if (step >= 2) f.milestones.forEach((m, i) => {
    if (!m.title.trim()) e[`milestones.${i}.title`] = "Add a title";
    else if (m.title.trim().length > 60) e[`milestones.${i}.title`] = "Use 60 characters or fewer";
    if (m.description.trim().length > 500) e[`milestones.${i}.description`] = "Use 500 characters or fewer";
    const c = toCents(m.amount);
    if (!m.amount.trim()) e[`milestones.${i}.amount`] = "Add an amount";
    else if (c === null) e[`milestones.${i}.amount`] = "Use a number with up to 2 decimal places, like 300.00";
    else if (c <= 0n) e[`milestones.${i}.amount`] = "Amount must be more than 0";
    else if (c > MAX_CENTS) e[`milestones.${i}.amount`] = "Use at most 900,000,000,000 per milestone";
  });
  if (step >= 2 && totalCents(f) > MAX_CENTS) e.total = "The agreement total can be at most 900,000,000,000";
  return e;
}
const toInput = (f: Form): SaveAgreementInput => ({ name: f.name.trim(), description: f.description.trim(), contributorAddress: f.contributorAddress.trim(), milestones: f.milestones.map((m) => ({ title: m.title.trim(), description: m.description.trim(), amount: m.amount.trim() })) });
const fromAgreement = (a: Agreement): Form => ({ name: a.name, description: a.description ?? "", contributorAddress: a.contributor?.address ?? "", milestones: a.milestones.length ? a.milestones.map((m) => ({ title: m.title, description: m.description ?? "", amount: m.amount && m.amount !== "0" ? m.amount : "" })) : [blank()] });

function Hint({ err, children }: { err?: string; children?: ReactNode }) {
  if (err) return <div className="hint err" role="alert"><Icon name="warning" size={16} />{err}</div>;
  return children ? <div className="hint"><Icon name="info" size={16} />{children}</div> : null;
}
const Lbl = ({ children, req, htmlFor }: { children: ReactNode; req?: boolean; htmlFor?: string }) => <label className="lbl" htmlFor={htmlFor}>{children}{req ? <span className="req">*</span> : <span className="opt">(Optional)</span>}</label>;

/** Create / edit a draft (POST /agreements, PATCH /agreements/{ref}), preview, publish */
export function AgreementEditor({ draft, loading }: { draft?: Agreement; loading?: boolean }) {
  const router = useRouter();
  const me = useSession((s) => s.address)!;
  const { data: cfg } = useEscrowConfig();
  const save = useSaveDraft();
  const { open, toast } = useUI.getState();
  const [ref, setRef] = useState(draft?.reference);
  const [f, setF] = useState<Form>(() => (draft ? fromAgreement(draft) : { name: "", description: "", contributorAddress: "", milestones: [blank()] }));
  // ?step=2 when the API sent us back with DRAFT_INCOMPLETE on milestone fields
  const [step, setStep] = useState<1 | 2 | 3>(() => (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("step") === "2" ? 2 : 1));
  const [e, setE] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(draft ? "saved" : "idle");
  const dirty = useRef(false);
  const published = useRef(false);
  useEffect(() => { if (draft && !ref) { setRef(draft.reference); setF(fromAgreement(draft)); } }, [draft, ref]);

  const persist = async (form = f) => {
    setStatus("saving");
    try {
      const a = await save.mutateAsync({ ref, input: toInput(form) });
      dirty.current = false; setStatus("saved");
      if (!ref) { setRef(a.reference); window.history.replaceState(null, "", `/app/agreements/${a.reference}/edit`); }
      return a;
    } catch (err) {
      setStatus("error");
      if (err instanceof ApiError && err.fields.length) setE(err.fieldErrors);
      else if (err instanceof ApiError && err.code === "AGREEMENT_TOTAL_TOO_LARGE") setE({ total: err.message });
      else toast(err instanceof ApiError ? err.message : "Couldn’t save the draft", { tone: "error" });
      throw err;
    }
  };
  // Autosave edits once the draft exists
  useEffect(() => {
    if (!ref || !dirty.current) return;
    // Re-check at fire time: a step change or publish may already have saved (and published) it
    const t = setTimeout(() => { if (dirty.current && !published.current) void persist().catch(() => undefined); }, 1200);
    return () => clearTimeout(t);
  }, [f]); // eslint-disable-line react-hooks/exhaustive-deps

  const upd = (p: Partial<Form>) => { dirty.current = true; published.current = false; setF((x) => ({ ...x, ...p })); };
  const setMs = (i: number, k: keyof Ms, v: string) => { upd({ milestones: f.milestones.map((m, j) => (j === i ? { ...m, [k]: v } : m)) }); setE(({ [`milestones.${i}.${k}`]: _, ...r }) => r); };
  const goStep = async (n: 1 | 2 | 3) => {
    if (n > step) { const errs = validate(f, step, me); setE(errs); if (Object.keys(errs).length) return; }
    setE({}); setStep(n); window.scrollTo({ top: 0, behavior: "smooth" });
    if (n > 1) void persist().catch(() => undefined);
  };
  const publish = async () => {
    const errs = validate(f, 2, me); setE(errs); if (Object.keys(errs).length) { setStep(Object.keys(errs).some((k) => k.startsWith("milestones")) ? 2 : 1); return; }
    try { const a = await persist(); published.current = true; open({ t: "confirm", op: "publish", ref: a.reference }); } catch { /* errors shown */ }
  };

  const tot = fromCents(totalCents(f));
  const asset = cfg?.asset ?? draft?.asset ?? "USDC";
  const anyFilled = !!(f.name || f.contributorAddress || f.milestones.some((m) => m.title));
  const savedLabel = status === "saving" ? "Saving…" : status === "saved" ? "Draft saved" : status === "error" ? "Couldn’t save" : anyFilled ? "Not saved yet" : "";
  const stp = (n: 1 | 2 | 3, l: string) => { const c = step === n ? "cur" : step > n ? "done" : "fut"; return <button className={`stp ${c}`} disabled={c !== "done"} onClick={() => goStep(n)}><span className="d">{c === "done" ? <Icon name="check" size={14} /> : n}</span><span className="lb">{l}</span></button>; };

  if (loading) return <Page back="/agreements" title="Edit draft"><AgreementSkeleton /></Page>;
  if (draft && (draft.status !== "draft" || draft.role !== "client"))
    return <Page back="/agreements" title="Edit draft"><Empty k="E-01" title="This agreement can’t be edited" body="Only drafts can be edited, by their client. Published terms are fixed." action={<Button variant="sec" h={36} onClick={() => router.push(`/agreements/${draft.reference}`)}>Open agreement</Button>} /></Page>;

  return (
    <Page back="/agreements" title={ref ? "Edit draft" : "New agreement"}>
      <Back href="/agreements" label="Agreements" />
      <div className="titlerow"><span className="pt" style={{ padding: 0 }}>{ref ? `Draft ${ref}` : "New agreement"}</span>{savedLabel && <small>{status === "saving" && <Icon name="loading" size={12} className="spin" />} {savedLabel}</small>}</div>
      <div className="stepper">{stp(1, "Project")}<div className={`conn${step > 1 ? " done" : ""}`} />{stp(2, "Milestones")}<div className={`conn${step > 2 ? " done" : ""}`} />{stp(3, "Preview")}</div>

      <div className="layout-2 main-first">
        <div className="l-main">
          {step === 1 && (
            <Fragment key="s1">
              <div className="card form">
                <div className="fld"><Lbl req htmlFor="f-name">Project name</Lbl>
                  <div className={`inp${e.name ? " err" : ""}`}><input id="f-name" value={f.name} maxLength={60} placeholder="e.g. Website redesign" onChange={(x) => { upd({ name: x.target.value }); setE(({ name: _, ...r }) => r); }} /></div>
                  <Hint err={e.name}>Up to 60 characters</Hint></div>
                <div className="fld"><Lbl htmlFor="f-desc">Description</Lbl>
                  <div className="inp ta"><textarea id="f-desc" value={f.description} maxLength={500} placeholder="What is this agreement for?" onChange={(x) => upd({ description: x.target.value })} /><span className="cnt">{f.description.length}/500</span></div>
                  <Hint err={e.description}>Shown to your contributor</Hint></div>
                <div className="fld"><Lbl req htmlFor="f-addr">Contributor’s Stellar address</Lbl>
                  <div className={`inp${e.contributorAddress ? " err" : ""}`}>
                    <input id="f-addr" value={f.contributorAddress} placeholder="G…" spellCheck={false} autoCapitalize="characters" onChange={(x) => { upd({ contributorAddress: x.target.value.trim() }); setE(({ contributorAddress: _, ...r }) => r); }} />
                    <button className="link" style={{ fontSize: 13 }} onClick={async () => { try { upd({ contributorAddress: (await navigator.clipboard.readText()).trim() }); } catch { toast("Clipboard access was blocked. Paste with ⌘V.", { tone: "error" }); } }}>Paste</button>
                  </div>
                  <Hint err={e.contributorAddress}>Starts with G. Ask them to copy it from their wallet.</Hint></div>
                <div className="fld"><span className="lbl">Paid in</span><div><AssetPill id={asset} /></div><Hint>Set by MileVault’s escrow configuration. Funds are held in Stellar claimable balances until released.</Hint></div>
              </div>
              <div className="factions">
                <button className="mlink" onClick={() => void persist().then(() => toast("Draft saved")).catch(() => undefined)}>Save draft</button>
                <span className="sp" />
                <Button variant="ghost" h={44} onClick={() => router.push("/agreements")}>Cancel</Button>
                <Button h={44} trailingIcon="right" onClick={() => goStep(2)}>Continue</Button>
              </div>
            </Fragment>
          )}
          {step === 2 && (
            <Fragment key="s2">
              {f.milestones.map((m, i) => (
                <div className="card mse" key={i}>
                  <div className="tp"><Icon name="menu" size={16} />Milestone {i + 1}
                    <span className="acts">
                      <button className="rm del" title="Remove milestone" aria-label={`Remove milestone ${i + 1}`} onClick={() => f.milestones.length <= 1 ? toast("An agreement needs at least one milestone", { tone: "info" }) : (upd({ milestones: f.milestones.filter((_, j) => j !== i) }), setE({}))}><Icon name="delete" size={18} /></button>
                      <button className="rm" title="Duplicate milestone" disabled={f.milestones.length >= MAX} onClick={() => upd({ milestones: [...f.milestones.slice(0, i + 1), { ...m }, ...f.milestones.slice(i + 1)] })}><Icon name="copy_line" size={18} /></button>
                    </span></div>
                  <div className="fld"><Lbl req htmlFor={`m-t-${i}`}>Title</Lbl><div className={`inp${e[`milestones.${i}.title`] ? " err" : ""}`}><input id={`m-t-${i}`} value={m.title} maxLength={60} placeholder="e.g. Wireframes" onChange={(x) => setMs(i, "title", x.target.value)} /></div><Hint err={e[`milestones.${i}.title`]}>Up to 60 characters</Hint></div>
                  <div className="fld"><Lbl htmlFor={`m-d-${i}`}>Description</Lbl><div className="inp ta"><textarea id={`m-d-${i}`} value={m.description} maxLength={500} placeholder="What does done look like?" onChange={(x) => setMs(i, "description", x.target.value)} /><span className="cnt">{m.description.length}/500</span></div><Hint err={e[`milestones.${i}.description`]}>Shown to your contributor</Hint></div>
                  <div className="fld amtin"><Lbl req htmlFor={`m-a-${i}`}>Amount</Lbl>
                    <div className={`inp${e[`milestones.${i}.amount`] ? " err" : ""}`}><div className="a"><input id={`m-a-${i}`} value={m.amount} placeholder="0.00" inputMode="decimal" onChange={(x) => setMs(i, "amount", x.target.value.replace(/[^\d.]/g, ""))} /></div><span className="vr" /><span className="sx"><Icon name="usdc" size={16} color="#2775CA" />{asset.split(":")[0]}</span></div>
                    <Hint err={e[`milestones.${i}.amount`]}>Paid when you release it</Hint></div>
                </div>
              ))}
              {f.milestones.length < MAX ? <Button variant="sec" h={40} icon="add" style={{ width: "100%" }} onClick={() => upd({ milestones: [...f.milestones, blank()] })}>Add milestone</Button> : <div className="hint" style={{ padding: "0 8px" }}><Icon name="info" size={16} />That’s the {MAX} milestone limit</div>}
              <div className="card total only-narrow"><div className="tr"><div><small>Agreement total</small><b>{money(tot, asset)}</b></div><small>{f.milestones.length} milestone{f.milestones.length === 1 ? "" : "s"}</small></div></div>
              {e.total && <Hint err={e.total} />}
              <div className="factions"><span className="sp" /><Button variant="sec" h={44} onClick={() => goStep(1)}>Back</Button><Button h={44} trailingIcon="right" onClick={() => goStep(3)}>Continue</Button></div>
            </Fragment>
          )}
          {step === 3 && (
            <Fragment key="s3">
              <div className="card pv">
                <div><h4>{f.name}</h4><p>{f.description || "No description"}</p></div>
                <div className="card sub-card">
                  <div className="party"><Avatar address={me} size={40} /><div className="tx"><small>Client</small><b style={{ fontFamily: "var(--inter)" }}>{shortAddr(me)} (you)</b></div></div>
                  <div className="party"><Avatar address={f.contributorAddress} size={40} /><div className="tx"><small>Contributor</small><b style={{ fontFamily: "var(--inter)" }}>{shortAddr(f.contributorAddress)}</b></div></div>
                </div>
                <div className="card sub-card rows ms">
                  {f.milestones.map((m, i) => (
                    <div className="row ms-row" key={i}><span className="seq">{i + 1}</span><div className="tx"><b>{m.title}</b><small>{m.description || "No description"}</small><div className="ab w-m"><span className="amt">{money(m.amount, asset)}</span><StatusBadge status="draft" /></div></div><span className="amt w-d">{money(m.amount, asset)}</span><div className="bcol w-d" style={{ width: 110 }}><StatusBadge status="draft" /></div></div>
                  ))}
                </div>
                <KV rows={[["Agreement total", money(tot, asset)], ["Paid in", <AssetPill key="a" id={asset} />], ["Network", cfg?.network === "mainnet" ? "Stellar Mainnet" : "Stellar Testnet"], ["Recovery period", cfg ? `${cfg.recoveryDays} days after funding` : "—"]]} />
                <div className="pvnote"><Icon name="info" size={16} />Publishing fixes these terms and shares them with your contributor. No money moves until you fund the escrow.</div>
              </div>
              <div className="factions">{ref && <button className="mlink" onClick={() => open({ t: "confirm", op: "delete_draft", ref })}>Delete draft</button>}<span className="sp" /><Button variant="sec" h={44} onClick={() => goStep(2)}>Back</Button><Button h={44} loading={status === "saving"} onClick={publish}>Publish agreement</Button></div>
            </Fragment>
          )}
        </div>
        <aside className="l-side only-wide" aria-label="Agreement summary">
          <div className="card side-card">
            <b>Agreement summary</b>
            <div><small style={{ color: "var(--sub)", fontSize: 13 }}>Total to fund</small><div className="big">{money(tot, asset)}</div></div>
            <div className="sumrow"><span>Project</span><b>{f.name.trim() || "—"}</b></div>
            <div className="sumrow"><span>Contributor</span><b style={{ fontFamily: "var(--inter)" }}>{f.contributorAddress ? shortAddr(f.contributorAddress) : "—"}</b></div>
            <div className="sumrow"><span>Paid in</span><b><AssetPill id={asset} /></b></div>
            <div className="div" />
            {f.milestones.map((m, i) => <div className="sumrow" key={i}><span>{i + 1}. {m.title.trim() || "Untitled milestone"}</span><b>{money(m.amount || 0, asset)}</b></div>)}
            <div className="div" />
            <div className="nt" style={{ display: "flex", gap: 8, fontSize: 13, lineHeight: "20px", color: "var(--sub)" }}><Icon name="info" size={16} color="#A3A3A3" /><span>Drafts save automatically. Only you can see a draft until you publish it.</span></div>
          </div>
        </aside>
      </div>
    </Page>
  );
}
