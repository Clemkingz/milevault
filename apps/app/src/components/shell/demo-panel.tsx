"use client";

import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { Icon } from "@milevault/ui";
import { Avatar } from "../art";
import { counterpartAction, DEMO_PERSONAS, getPerson, useChain, useUI } from "@/mock";

/**
 * Demo controls (mock data source only). Mirrors the prototype's side panel:
 * switch persona, play the other side's next step, and force edge cases.
 */
export function DemoPanel() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const me = useChain((s) => s.me);
  const persona = useChain((s) => s.persona);
  const agreements = useChain((s) => s.agreements);
  const demo = useChain((s) => s.demo);
  const { setPersona, setDemo, resetDemo } = useChain.getState();
  const toast = useUI((s) => s.toast);

  // The agreement in focus: the one on screen, else the most relevant open one
  const focus = useMemo(() => {
    const id = pathname.match(/^\/agreements\/(\d+)/)?.[1];
    if (id) return agreements.find((a) => a.id === id);
    if (!me) return undefined;
    return agreements.find((a) => counterpartAction(a, me) && (a.client === me || a.contributor === me));
  }, [pathname, agreements, me]);
  const sim = focus && me ? counterpartAction(focus, me) : null;

  return (
    <div className={`demo${open ? " open" : ""}`}>
      {open ? (
        <div className="demo-card" role="dialog" aria-label="Demo controls">
          <div className="demo-h">
            <span className="mk"><Icon name="safe_lock" size={14} /></span>
            <b>Demo mode</b>
            <button className="xs" onClick={() => setOpen(false)} aria-label="Close demo controls"><Icon name="close" size={14} /></button>
          </div>
          <p className="lead">Mock data, simulated wallet and network. Nothing touches Stellar.</p>

          <label className="dl-lbl">Play as</label>
          <div className="seg">
            {DEMO_PERSONAS.map(({ key, role }) => (
              <button key={key} className={persona === key ? "on" : ""} onClick={() => { setPersona(key); toast(`Now acting as ${getPerson(key).name} (${role.toLowerCase()})`, { tone: "info" }); }}>
                {getPerson(key).first} · {role}
              </button>
            ))}
          </div>

          <label className="dl-lbl">{focus ? `Other side · ${focus.name}` : "Other side"}</label>
          {sim ? (
            <button className="simbtn" onClick={sim.run}>
              <Avatar p={getPerson(sim.who)} size={28} />
              <span><b>{sim.label}</b><small>{sim.sub}</small></span>
            </button>
          ) : (
            <div className="note"><Icon name="info" size={16} /><span>{!me ? "Connect a wallet to start." : focus ? `Nothing for the other side to do on ${focus.name} right now.` : "When the other side has something to do, a button appears here."}</span></div>
          )}

          <label className="dl-lbl">Edge cases</label>
          <label className="tg"><input type="checkbox" checked={demo.failNext} onChange={(e) => setDemo({ failNext: e.target.checked })} /><span>Fail the next transaction</span></label>
          <label className="tg"><input type="checkbox" checked={demo.wrongNetwork} onChange={(e) => setDemo({ wrongNetwork: e.target.checked })} /><span>Wallet on Mainnet (wrong network)</span></label>
          <label className="tg sel"><span>Network confirmation</span>
            <select value={demo.latencyMs} onChange={(e) => setDemo({ latencyMs: +e.target.value })}>
              <option value={600}>Fast (0.6s)</option><option value={1900}>Normal (1.9s)</option><option value={5000}>Slow (5s)</option>
            </select>
          </label>

          <button className="btn sec h32" style={{ width: "100%", marginTop: 12 }} onClick={() => { resetDemo(); toast("Demo data reset"); }}>
            <Icon name="refresh" size={16} /><span>Reset demo data</span>
          </button>
        </div>
      ) : (
        <button className="demo-pill" onClick={() => setOpen(true)} aria-label="Open demo controls">
          {sim && <span className="demo-dot" />}
          <Icon name="safe_lock" size={14} />Demo
        </button>
      )}
    </div>
  );
}
