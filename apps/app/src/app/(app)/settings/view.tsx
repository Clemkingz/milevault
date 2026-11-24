"use client";

import { shortAddr } from "@milevault/api";
import { Button, StatusBadge } from "@milevault/ui";
import { KV, PageHeader, Section } from "@/components/bits";
import { InstallCard } from "@/components/pwa/install";
import { Page } from "@/components/shell/page";
import { mock } from "@/lib/backend";
import { usePrefs } from "@/lib/prefs";
import { useSession } from "@/lib/session";
import { useUI } from "@/lib/ui";

function Toggle({ checked, onChange, label, sub }: { checked: boolean; onChange: (v: boolean) => void; label: string; sub: string }) {
  return (
    <label className="pref">
      <span className="tx"><b>{label}</b><small>{sub}</small></span>
      <span className={`switch${checked ? " on" : ""}`}><input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-label={label} /><i /></span>
    </label>
  );
}

/** Preferences + wallet session (MileVault stores only your address — no profile) */
export function SettingsView() {
  const p = usePrefs();
  const address = useSession((s) => s.address)!;
  const expiresAt = useSession((s) => s.expiresAt);
  const walletId = useSession((s) => s.walletId);
  const { open, toast } = useUI.getState();
  return (
    <Page title="Settings">
      <PageHeader title="Settings" sub="Preferences for this device, and your wallet session." />
      <div className="layout-2 main-first">
        <div className="l-main">
          <Section title="Preferences">
            <div className="card prefs">
              <Toggle checked={p.hideBal} onChange={(v) => p.set({ hideBal: v })} label="Hide balances" sub="Mask amounts on the dashboard until you tap the eye." />
              <Toggle checked={p.txToasts} onChange={(v) => p.set({ txToasts: v })} label="Confirmation toasts" sub="Show a toast when an approval, submission or cancellation confirms." />
              <Toggle checked={p.reduceMotion} onChange={(v) => p.set({ reduceMotion: v })} label="Reduce motion" sub="Turn off page and money animations." />
              <Toggle checked={p.compact} onChange={(v) => p.set({ compact: v })} label="Compact lists" sub="Tighter rows on agreements and transactions." />
            </div>
          </Section>
          <Section title="Wallet session">
            <div className="card prefs">
              <div className="pref"><span className="tx"><b>Disconnect wallet</b><small>Ends your session now. Your agreements and escrow stay on Stellar.</small></span><Button variant="dsoft" h={32} onClick={() => open({ t: "disconnect" })}>Disconnect</Button></div>
              {mock && <div className="pref"><span className="tx"><b>Reset demo data</b><small>Restore the sample agreements in the demo backend.</small></span><Button variant="sec" h={32} onClick={() => { mock!.reset(); window.location.reload(); toast("Demo data reset"); }}>Reset</Button></div>}
            </div>
          </Section>
        </div>
        <aside className="l-side">
          <KV rows={[["Wallet", walletId ?? "—"], ["Address", shortAddr(address)], ["Status", <StatusBadge key="c" status="connected" />], ["Session ends", expiresAt ? new Date(expiresAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—"]]} />
          <div className="card side-card"><b>Privacy</b><p style={{ color: "var(--sub)" }}>MileVault stores only your public address — no name, email or profile. The other side of an agreement sees your address.</p></div>
          <InstallCard variant="card" />
        </aside>
      </div>
    </Page>
  );
}
