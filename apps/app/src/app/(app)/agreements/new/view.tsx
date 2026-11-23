"use client";

import { useRouter } from "next/navigation";
import { Fragment, useState, type ReactNode } from "react";
import { MAX_MILESTONES } from "@milevault/shared";
import { Button, Icon, StatusBadge } from "@milevault/ui";
import { Avatar } from "@/components/art";
import { Back, KV } from "@/components/bits";
import { Page } from "@/components/shell/page";
import { PEOPLE, personByAddr, plural, relTime, short, usd, useChain, useMe, useUI, type Draft, type Person } from "@/mock";

type Errors = Record<string, string>;

/** Prototype validate() rules */
function validate(d: Draft, step: number, myAddr: string): Errors {
  const e: Errors = {};
  if (step === 1) {
    if (!d.name.trim()) e.name = "Give the agreement a name";
    const ad = d.addr.trim();
    if (!ad) e.addr = "Paste your contributor’s Stellar address";
    else if (ad === myAddr) e.addr = "That’s your own address. Use your contributor’s.";
    else if (!/^G[A-Z2-7]{55}$/.test(ad)) e.addr = "Stellar addresses start with G and are 56 capitals and numbers";
  }
  if (step === 2)
    d.ms.forEach((m, i) => {
      if (!m.title.trim()) e[`ms.${i}.title`] = "Add a title";
      const v = parseFloat(m.amount);
      if (!m.amount || isNaN(v)) e[`ms.${i}.amount`] = "Add an amount";
      else if (v <= 0) e[`ms.${i}.amount`] = "Amount must be more than 0";
      else if (!/^\d+(\.\d{1,2})?$/.test(String(m.amount).trim())) e[`ms.${i}.amount`] = "Use up to 2 decimal places";
    });
  return e;
}

const EXAMPLE = (kayAddr: string): Omit<Draft, "step"> => ({
  name: "Website redesign",
  desc: "Redesign the marketing site in three milestones: wireframes, core pages and launch.",
  addr: kayAddr,
  ms: [
    { title: "Wireframes", desc: "Sitemap, low-fidelity wireframes for 8 pages, one round of feedback.", amount: "300.00" },
    { title: "Core functionality", desc: "Build the main pages and the CMS, responsive down to 360px.", amount: "700.00" },
    { title: "Launch and handoff", desc: "Deploy, set up analytics, and hand over the code and docs.", amount: "500.00" },
  ],
});

function Hint({ err, children }: { err?: string; children?: ReactNode }) {
  if (err) return <div className="hint err" role="alert"><Icon name="warning" size={16} />{err}</div>;
  return children ? <div className="hint"><Icon name="info" size={16} />{children}</div> : null;
}
const Lbl = ({ children, req, htmlFor }: { children: ReactNode; req?: boolean; htmlFor?: string }) => (
  <label className="lbl" htmlFor={htmlFor}>{children}{req ? <span className="req">*</span> : <span className="opt">(Optional)</span>}</label>
);

export function NewAgreementView() {
  const router = useRouter();
  const me = useMe()!;
  const d = useChain((s) => s.draft);
  const setDraft = useChain((s) => s.setDraft);
  const resetDraft = useChain((s) => s.resetDraft);
  const { startTx, toast } = useUI.getState();
  const [e, setE] = useState<Errors>({});

  const tot = d.ms.reduce((s, x) => s + (parseFloat(x.amount) || 0), 0);
  const anyFilled = !!(d.name || d.addr || d.ms.some((x) => x.title));
  const setMs = (i: number, k: "title" | "desc" | "amount", v: string) => {
    setDraft({ ms: d.ms.map((m, j) => (j === i ? { ...m, [k]: v } : m)) });
    if (e[`ms.${i}.${k}`]) setE(({ [`ms.${i}.${k}`]: _, ...r }) => r);
  };
  const goStep = (n: 1 | 2 | 3) => {
    if (n > d.step) { const errs = validate(d, d.step, me.addr); setE(errs); if (Object.keys(errs).length) { document.querySelector(".inp.err input")?.scrollIntoView({ block: "center", behavior: "smooth" }); return; } }
    setE({}); setDraft({ step: n }); window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const fillExample = () => { setDraft({ ...EXAMPLE(PEOPLE.kay.addr === me.addr ? PEOPLE.rhea.addr : PEOPLE.kay.addr) }); setE({}); };
  const saveDraft = () => { setDraft({}); toast("Draft saved on this device"); };
  const stp = (n: 1 | 2 | 3, l: string) => {
    const cls = d.step === n ? "cur" : d.step > n ? "done" : "fut";
    return (
      <button className={`stp ${cls}`} disabled={cls !== "done"} onClick={() => goStep(n)} aria-current={cls === "cur" ? "step" : undefined}>
        <span className="d">{cls === "done" ? <Icon name="check" size={14} /> : n}</span><span className="lb">{l}</span>
      </button>
    );
  };
  const kp: Person = personByAddr(d.addr) ?? { key: "kay", name: "Contributor", first: "Contributor", addr: d.addr.trim(), bg: "#F5F5F5", fg: "#7B7B7B" };

  return (
    <Page back="/agreements" title="New agreement">
      <Back href="/agreements" label="Agreements" />
      <div className="titlerow"><span className="pt" style={{ padding: 0 }}>New agreement</span>{anyFilled && d.savedAt && <small>Draft saved {relTime(d.savedAt).toLowerCase()}</small>}</div>
      <div className="stepper">
        {stp(1, "Project")}<div className={`conn${d.step > 1 ? " done" : ""}`} />{stp(2, "Milestones")}<div className={`conn${d.step > 2 ? " done" : ""}`} />{stp(3, "Preview")}
      </div>

      <div className="layout-2 main-first">
      <div className="l-main">
      {d.step === 1 && (
        <Fragment key="s1">
          <div className="card form">
            <div className="fld">
              <Lbl req htmlFor="f-name">Project name</Lbl>
              <div className={`inp${e.name ? " err" : ""}`}><input id="f-name" value={d.name} onChange={(x) => { setDraft({ name: x.target.value }); setE(({ name: _, ...r }) => r); }} placeholder="e.g. Website redesign" maxLength={60} aria-invalid={!!e.name} /></div>
              <Hint err={e.name}>Up to 60 characters</Hint>
            </div>
            <div className="fld">
              <Lbl htmlFor="f-desc">Description</Lbl>
              <div className="inp ta"><textarea id="f-desc" value={d.desc} onChange={(x) => setDraft({ desc: x.target.value })} maxLength={500} placeholder="What is this agreement for?" /><span className="cnt">{d.desc.length}/500</span></div>
              <Hint>Shown to your contributor</Hint>
            </div>
            <div className="fld">
              <Lbl req htmlFor="f-addr">Contributor’s Stellar address</Lbl>
              <div className={`inp${e.addr ? " err" : ""}`}>
                <input id="f-addr" value={d.addr} onChange={(x) => { setDraft({ addr: x.target.value.trim() }); setE(({ addr: _, ...r }) => r); }} placeholder="G…" spellCheck={false} autoCapitalize="characters" aria-invalid={!!e.addr} />
                <button className="link" style={{ fontSize: 13 }} onClick={async () => { try { setDraft({ addr: (await navigator.clipboard.readText()).trim() }); setE(({ addr: _, ...r }) => r); } catch { toast("Clipboard access was blocked. Paste with ⌘V.", { tone: "error" }); } }}>Paste</button>
              </div>
              <Hint err={e.addr}>Starts with G. Paste it from their wallet.</Hint>
            </div>
          </div>
          <div className="factions">
            <button className="mlink" onClick={anyFilled ? saveDraft : fillExample}>{anyFilled ? "Save draft" : "Fill with example"}</button>
            <span className="sp" />
            <Button variant="ghost" h={44} onClick={() => router.push("/dashboard")}>Cancel</Button>
            <Button h={44} trailingIcon="right" onClick={() => goStep(2)}>Continue</Button>
          </div>
        </Fragment>
      )}

      {d.step === 2 && (
        <Fragment key="s2">
          <div className="mv-list" style={{ display: "contents" }}>
            {d.ms.map((x, i) => (
              <div className="card mse" key={i}>
                <div className="tp">
                  <Icon name="menu" size={16} />Milestone {i + 1}
                  <span className="acts">
                    <button className="rm del" title="Remove milestone" aria-label={`Remove milestone ${i + 1}`} onClick={() => d.ms.length <= 1 ? toast("An agreement needs at least one milestone", { tone: "info" }) : (setDraft({ ms: d.ms.filter((_, j) => j !== i) }), setE({}))}><Icon name="delete" size={18} /></button>
                    <button className="rm" title="Duplicate milestone" aria-label={`Duplicate milestone ${i + 1}`} disabled={d.ms.length >= MAX_MILESTONES} onClick={() => { setDraft({ ms: [...d.ms.slice(0, i + 1), { ...x }, ...d.ms.slice(i + 1)] }); setE({}); }}><Icon name="copy_line" size={18} /></button>
                  </span>
                </div>
                <div className="fld">
                  <Lbl req htmlFor={`m-t-${i}`}>Title</Lbl>
                  <div className={`inp${e[`ms.${i}.title`] ? " err" : ""}`}><input id={`m-t-${i}`} autoFocus={i === d.ms.length - 1 && i > 0 && !x.title} value={x.title} onChange={(v) => setMs(i, "title", v.target.value)} placeholder="e.g. Wireframes" maxLength={60} /></div>
                  <Hint err={e[`ms.${i}.title`]}>Up to 60 characters</Hint>
                </div>
                <div className="fld">
                  <Lbl htmlFor={`m-d-${i}`}>Description</Lbl>
                  <div className="inp ta"><textarea id={`m-d-${i}`} value={x.desc} onChange={(v) => setMs(i, "desc", v.target.value)} maxLength={500} placeholder="What does done look like?" /><span className="cnt">{x.desc.length}/500</span></div>
                  <Hint>Shown to your contributor</Hint>
                </div>
                <div className="fld amtin">
                  <Lbl req htmlFor={`m-a-${i}`}>Amount</Lbl>
                  <div className={`inp${e[`ms.${i}.amount`] ? " err" : ""}`}>
                    <div className="a"><span>$</span><input id={`m-a-${i}`} value={x.amount} onChange={(v) => setMs(i, "amount", v.target.value.replace(/[^\d.]/g, ""))} placeholder="0.00" inputMode="decimal" /></div>
                    <span className="vr" />
                    <span className="sx"><Icon name="usdc" size={16} color="#2775CA" />USDC</span>
                  </div>
                  <Hint err={e[`ms.${i}.amount`]}>Paid when you release it</Hint>
                </div>
              </div>
            ))}
          </div>
          {d.ms.length < MAX_MILESTONES
            ? <Button variant="sec" h={40} icon="add" style={{ width: "100%" }} onClick={() => setDraft({ ms: [...d.ms, { title: "", desc: "", amount: "" }] })}>Add milestone</Button>
            : <div className="hint" style={{ padding: "0 8px" }}><Icon name="info" size={16} />That’s the {MAX_MILESTONES} milestone limit</div>}
          <div className="card total only-narrow">
            <div className="tr"><div><small>Agreement total</small><b>{usd(tot)}</b></div><small>{plural(d.ms.length, "milestone")}</small></div>
            <div className="nt"><Icon name="info" size={16} /><span>You’ll fund the full {usd(tot)} in one step after creating.</span></div>
          </div>
          <div className="factions">
            <button className="mlink" onClick={d.ms.some((x) => x.title) ? saveDraft : fillExample}>{d.ms.some((x) => x.title) ? "Save draft" : "Fill with example"}</button>
            <span className="sp" />
            <Button variant="sec" h={44} onClick={() => goStep(1)}>Back</Button>
            <Button h={44} trailingIcon="right" onClick={() => goStep(3)}>Continue</Button>
          </div>
        </Fragment>
      )}

      {d.step === 3 && (
        <Fragment key="s3">
          <div className="card pv">
            <div><h4>{d.name}</h4><p>{d.desc || "No description"}</p></div>
            <div className="card sub-card">
              <div className="party"><Avatar p={me} size={40} /><div className="tx"><small>Client</small><b>{me.name} (you)</b></div><span className="chip">{short(me.addr)}</span></div>
              <div className="party"><Avatar p={kp} size={40} /><div className="tx"><small>Contributor</small><b>{kp.name}</b></div><span className="chip">{short(kp.addr)}</span></div>
            </div>
            <div className="card sub-card rows ms">
              {d.ms.map((x, i) => (
                <div className="row ms-row" key={i}>
                  <span className="seq">{i + 1}</span>
                  <div className="tx"><b>{x.title}</b><small>{x.desc || "No description"}</small>
                    <div className="ab w-m"><span className="amt">{usd(parseFloat(x.amount))}</span><button onClick={() => goStep(2)} aria-label="Edit milestones"><StatusBadge status="draft" /></button></div>
                  </div>
                  <span className="amt w-d">{usd(parseFloat(x.amount))}</span>
                  <div className="bcol w-d" style={{ width: 110 }}><button onClick={() => goStep(2)} aria-label="Edit milestones"><StatusBadge status="draft" /></button></div>
                </div>
              ))}
            </div>
            <KV rows={[["Agreement total", usd(tot)], ["Network", "Stellar Testnet"], ["Network fee", "≈ 0.00001 XLM"]]} />
            <div className="pvnote"><Icon name="info" size={16} />Creating only records the agreement on-chain. No USDC moves until you fund escrow in the next step.</div>
          </div>
          <div className="factions">
            <button className="mlink" onClick={saveDraft}>Save draft</button>
            <span className="sp" />
            <Button variant="sec" h={44} onClick={() => goStep(2)}>Back</Button>
            <Button h={44} onClick={() => startTx("create")}>Create agreement</Button>
          </div>
          <button className="mlink" style={{ alignSelf: "center", fontSize: 13 }} onClick={() => { resetDraft(); toast("Draft cleared"); }}>Start over</button>
        </Fragment>
      )}
      </div>
      <aside className="l-side only-wide" aria-label="Agreement summary">
        <div className="card side-card">
          <b>Agreement summary</b>
          <div>
            <small style={{ color: "var(--sub)", fontSize: 13 }}>Total to fund</small>
            <div className="big">{usd(tot)}</div>
          </div>
          <div className="sumrow"><span>Project</span><b>{d.name.trim() || "—"}</b></div>
          <div className="sumrow"><span>Contributor</span><b>{d.addr.trim() ? (personByAddr(d.addr)?.name ?? short(d.addr.trim())) : "—"}</b></div>
          <div className="div" />
          {d.ms.map((m, i) => (
            <div className="sumrow" key={i}><span>{i + 1}. {m.title.trim() || "Untitled milestone"}</span><b>{usd(parseFloat(m.amount) || 0)}</b></div>
          ))}
          <div className="div" />
          <div className="nt" style={{ display: "flex", gap: 8, fontSize: 13, lineHeight: "20px", color: "var(--sub)" }}>
            <Icon name="info" size={16} color="#A3A3A3" /><span>Creating records the agreement on Stellar Testnet. You fund the full {usd(tot)} in the next step.</span>
          </div>
        </div>
      </aside>
      </div>
    </Page>
  );
}
