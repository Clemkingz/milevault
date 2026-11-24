"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createApi, mockWallets, shortAddr, type Agreement } from "@milevault/api";
import { Icon } from "@milevault/ui";
import { Avatar } from "../art";
import { signIn, signOut } from "@/lib/auth";
import { mock } from "@/lib/backend";
import { useDemo } from "@/lib/demo";
import { invalidateAll } from "@/lib/queries";
import { useSession } from "@/lib/session";
import { useUI } from "@/lib/ui";

const SIM_LABEL: Record<string, string> = {
  publish: "publishes the draft", fund: "funds the escrow", accept: "accepts the agreement", submit: "submits the milestone",
  approve: "approves the milestone", release: "releases the payment", confirm_cancel: "confirms the cancellation", recover: "recovers the escrow",
};

/** Demo controls (mock backend only): switch wallet, play the other side, force edge cases. */
export function DemoPanel() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const qc = useQueryClient();
  const me = useSession((s) => s.address);
  const demoAddr = useDemo((s) => s.address);
  const setDemo = useDemo((s) => s.setAddress);
  const ui = useUI.getState();
  const wrong = useUI((s) => s.demoWrongNetwork);
  const [settings, setSettings] = useState(() => mock?.settings() ?? { failNext: false, latencyMs: 1200 });
  const ref = pathname.match(/^\/agreements\/(MV-\d+)/i)?.[1];

  // What the other party would do next on the agreement in focus — asked as them, via the same API
  const sim = useQuery({
    queryKey: ["demo-sim", ref, me, pathname],
    enabled: !!mock && !!ref && !!me,
    queryFn: async () => {
      const mine = qc.getQueryData<Agreement>(["agreement", ref!.toUpperCase()]);
      if (!mine) return null;
      const other = mine.role === "client" ? mine.contributor?.address : mine.client.address;
      if (!other) return null;
      const as = createApi({ transport: mock!.transport, getToken: () => `mock.${other}` });
      const a = await as.agreements.get(ref!).catch(() => null);
      const t = a?.nextAction.type;
      if (!a || !t || !SIM_LABEL[t]) return null;
      return { other, type: t, position: a.nextAction.milestonePosition, as };
    },
  });

  const run = async () => {
    const s = sim.data; if (!s || !ref) return;
    try {
      const signRun = async (kind: Parameters<typeof s.as.escrow.prepare>[1], pos?: number) => {
        const p = await s.as.escrow.prepare(ref, kind, pos);
        let r = await s.as.escrow.submit(p.id, mock!.sign(p.transaction!));
        while (r.status === "pending") { await new Promise((x) => setTimeout(x, 400)); r = await s.as.escrow.status(r.id); }
        if (r.status !== "confirmed") throw new Error(r.failure ?? r.statusMessage);
      };
      if (s.type === "publish") await s.as.agreements.publish(ref);
      if (s.type === "fund") await signRun("fund");
      if (s.type === "accept") await s.as.agreements.accept(ref);
      if (s.type === "submit") await s.as.agreements.submit(ref, s.position!, { link: "https://figma.com/proto/website-v1", note: "Ready for review." });
      if (s.type === "approve") await signRun("approve", s.position);
      if (s.type === "release") await signRun("release", s.position);
      if (s.type === "confirm_cancel") await signRun("confirm_cancel");
      if (s.type === "recover") await signRun("recover");
      invalidateAll(qc, ref); qc.invalidateQueries({ queryKey: ["demo-sim"] });
      ui.toast(`Other side ${SIM_LABEL[s.type]}`, { tone: s.type === "release" || s.type === "fund" ? "money" : "info" });
    } catch (e) { ui.toast(`Simulation failed: ${e instanceof Error ? e.message : e}`, { tone: "error" }); }
  };

  const switchTo = async (address: string) => {
    if (address === me) return;
    setDemo(address);
    if (me) await signOut({ silent: true });
    void signIn("Varial");
  };
  const upd = (p: Partial<typeof settings>) => { mock?.setSettings(p); setSettings({ ...settings, ...p }); };

  return (
    <div className={`demo${open ? " open" : ""}`}>
      {open ? (
        <div className="demo-card" role="dialog" aria-label="Demo controls">
          <div className="demo-h"><span className="mk"><Icon name="safe_lock" size={14} /></span><b>Demo mode</b><button className="xs" onClick={() => setOpen(false)} aria-label="Close demo controls"><Icon name="close" size={14} /></button></div>
          <p className="lead">Mock backend with the real API’s routes and shapes, plus a simulated wallet. Nothing touches Stellar.</p>
          <label className="dl-lbl">Wallet</label>
          <div className="seg">
            {mockWallets.filter((w) => w.role !== "operator").map((w) => (
              <button key={w.address} className={(me ?? demoAddr) === w.address ? "on" : ""} onClick={() => switchTo(w.address)} title={w.address}>{w.role === "client" ? "Client" : "Contributor"} · {shortAddr(w.address).slice(-4)}</button>
            ))}
          </div>
          <label className="dl-lbl">Other side{ref ? ` · ${ref}` : ""}</label>
          {sim.data ? (
            <button className="simbtn" onClick={run}><Avatar address={sim.data.other} size={28} /><span><b>{shortAddr(sim.data.other)} {SIM_LABEL[sim.data.type]}</b><small>Plays the other wallet through the API</small></span></button>
          ) : <div className="note"><Icon name="info" size={16} /><span>{ref ? "Nothing for the other side to do here right now." : "Open an agreement to play the other side."}</span></div>}
          <label className="dl-lbl">Edge cases</label>
          <label className="tg"><input type="checkbox" checked={settings.failNext} onChange={(e) => upd({ failNext: e.target.checked })} /><span>Fail the next on-chain action</span></label>
          <label className="tg"><input type="checkbox" checked={wrong} onChange={(e) => ui.set({ demoWrongNetwork: e.target.checked })} /><span>Wallet on Mainnet (wrong network)</span></label>
          <label className="tg sel"><span>Network confirmation</span>
            <select value={settings.latencyMs} onChange={(e) => upd({ latencyMs: +e.target.value })}><option value={400}>Fast</option><option value={1200}>Normal</option><option value={4000}>Slow</option></select>
          </label>
          <button className="btn sec h32" style={{ width: "100%", marginTop: 12 }} onClick={() => { mock?.reset(); qc.invalidateQueries(); ui.toast("Demo backend reset"); }}><Icon name="refresh" size={16} /><span>Reset demo data</span></button>
        </div>
      ) : (
        <button className="demo-pill" onClick={() => setOpen(true)} aria-label="Open demo controls">{sim.data && <span className="demo-dot" />}<Icon name="safe_lock" size={14} />Demo</button>
      )}
    </div>
  );
}
