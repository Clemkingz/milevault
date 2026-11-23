"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Icon, StatusBadge } from "@milevault/ui";
import { Avatar } from "@/components/art";
import { KV, PageHeader, Section } from "@/components/bits";
import { InstallCard } from "@/components/pwa/install";
import { Page } from "@/components/shell/page";
import { ListSkeleton } from "@/components/shell/skeleton";
import { useActions } from "@/components/use-actions";
import { env } from "@/lib/env";
import { PEOPLE, plural, short, useChain, useMe, useMyAgreements, useReady, useUI } from "@/mock";
import { toAvatarDataUrl } from "./image";

function Toggle({ checked, onChange, label, sub }: { checked: boolean; onChange: (v: boolean) => void; label: string; sub: string }) {
  return (
    <label className="pref">
      <span className="tx"><b>{label}</b><small>{sub}</small></span>
      <span className={`switch${checked ? " on" : ""}`}>
        <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-label={label} />
        <i />
      </span>
    </label>
  );
}

/** Profile & account settings — same page for clients and contributors (profile is per wallet). */
export function SettingsView() {
  const ready = useReady();
  const me = useMe()!;
  const mine = useMyAgreements();
  const profile = useChain((s) => s.profiles[me.key]);
  const prefs = useChain((s) => s.prefs);
  const hideBal = useChain((s) => s.hideBal);
  const { updateProfile, setPrefs, set, resetDemo } = useChain.getState();
  const { toast, open } = useUI.getState();
  const { copy } = useActions();

  const [name, setName] = useState(me.name);
  const [img, setImg] = useState<string | undefined>(profile?.img);
  const [err, setErr] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [drag, setDrag] = useState(false);
  const [processing, setProcessing] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => { setName(me.name); setImg(useChain.getState().profiles[me.key]?.img); }, [me.key]); // eslint-disable-line react-hooks/exhaustive-deps

  const asClient = mine.filter((a) => a.client === me.key).length;
  const asContrib = mine.filter((a) => a.contributor === me.key).length;
  const defaultName = PEOPLE[me.key].name;
  const dirty = name.trim() !== me.name || img !== profile?.img;
  const preview = { ...me, name: name.trim() || defaultName, img: img ?? PEOPLE[me.key].img, imgIsData: !!img };

  const pick = async (f?: File | null) => {
    if (!f) return;
    setProcessing(true);
    try { setImg(await toAvatarDataUrl(f)); }
    catch (e) { toast(e instanceof Error ? e.message : "Couldn’t read that image", { tone: "error" }); }
    finally { setProcessing(false); if (file.current) file.current.value = ""; }
  };

  const save = async () => {
    const n = name.trim().replace(/\s+/g, " ");
    if (n.length < 2) return setErr("Use at least 2 characters");
    if (n.length > 40) return setErr("Keep it under 40 characters");
    if (!/^[\p{L}\p{M}0-9 .'’-]+$/u.test(n)) return setErr("Use letters, numbers, spaces, apostrophes, dots or dashes");
    setSaving(true);
    await new Promise((r) => setTimeout(r, 650)); // simulated API round-trip
    updateProfile(me.key, { name: n === defaultName ? undefined : n, img });
    setSaving(false);
    toast("Profile updated. Everyone on your agreements sees the change.");
  };

  if (!ready) return <Page title="Settings"><ListSkeleton title={180} /></Page>;

  return (
    <Page title="Settings">
      <PageHeader title="Profile & settings" sub="How you appear to the people you work with, and how MileVault behaves for you." />
      <div className="layout-2 main-first">
        <div className="l-main">
          <Section title="Profile">
            <div className="card form">
              <div
                className={`avedit${drag ? " drag" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}
              >
                <button className="avbig" onClick={() => file.current?.click()} aria-label="Change profile photo">
                  <Avatar p={preview} size={72} />
                  <span className="cam">{processing ? <Icon name="loading" size={14} className="spin" /> : <Icon name="edit" size={14} />}</span>
                </button>
                <div className="tx">
                  <b>Profile photo</b>
                  <small>PNG, JPG or WebP up to 5 MB. We crop it to a square. Drop an image here or upload one.</small>
                  <div className="acts">
                    <Button variant="sec" h={32} icon="edit" iconSize={16} onClick={() => file.current?.click()} loading={processing}>Upload photo</Button>
                    {img && <Button variant="ghost" h={32} onClick={() => setImg(undefined)}>Remove</Button>}
                  </div>
                </div>
                <input ref={file} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(e) => pick(e.target.files?.[0])} />
              </div>
              <div className="fld">
                <label className="lbl" htmlFor="p-name">Display name<span className="req">*</span></label>
                <div className={`inp${err ? " err" : ""}`}>
                  <input id="p-name" value={name} maxLength={40} autoComplete="name" onChange={(e) => { setName(e.target.value); setErr(undefined); }} onKeyDown={(e) => e.key === "Enter" && dirty && save()} />
                  <span className="cnt-inline">{name.length}/40</span>
                </div>
                {err ? <div className="hint err" role="alert"><Icon name="warning" size={16} />{err}</div>
                  : <div className="hint"><Icon name="info" size={16} />Shown to the other side of your agreements, next to your wallet address.</div>}
              </div>
              <div className="factions">
                <span className="sp" />
                <Button variant="ghost" h={40} disabled={!dirty || saving} onClick={() => { setName(me.name); setImg(profile?.img); setErr(undefined); }}>Discard</Button>
                <Button h={40} disabled={!dirty} loading={saving} loadingText="Saving…" onClick={save}>Save changes</Button>
              </div>
            </div>
          </Section>

          <Section title="Preferences">
            <div className="card prefs">
              <Toggle checked={hideBal} onChange={(v) => set({ hideBal: v })} label="Hide balances" sub="Mask amounts on the dashboard until you tap the eye." />
              <Toggle checked={prefs.txToasts} onChange={(v) => setPrefs({ txToasts: v })} label="Transaction notifications" sub="Show a toast when an approval, submission or cancellation confirms." />
              <Toggle checked={prefs.reduceMotion} onChange={(v) => setPrefs({ reduceMotion: v })} label="Reduce motion" sub="Turn off page and money animations in MileVault." />
              <Toggle checked={prefs.compact} onChange={(v) => setPrefs({ compact: v })} label="Compact lists" sub="Tighter rows on agreements and transactions." />
            </div>
          </Section>

          <Section title="Wallet & session">
            <div className="card prefs">
              <div className="pref">
                <span className="tx"><b>Disconnect wallet</b><small>Your agreements and escrow stay on Stellar. Connect again any time.</small></span>
                <Button variant="dsoft" h={32} onClick={() => open({ t: "disconnect" })}>Disconnect</Button>
              </div>
              {env.dataSource === "mock" && (
                <div className="pref">
                  <span className="tx"><b>Reset demo data</b><small>Restore the sample agreements and balances. Your profile is kept.</small></span>
                  <Button variant="sec" h={32} onClick={() => { resetDemo(); toast("Demo data reset"); }}>Reset</Button>
                </div>
              )}
            </div>
          </Section>
        </div>

        <aside className="l-side">
          <div className="card side-card">
            <b>How others see you</b>
            <div className="party" style={{ padding: 0 }}>
              <Avatar p={preview} size={40} />
              <div className="tx"><small>{asClient >= asContrib ? "Client" : "Contributor"}</small><b>{preview.name}</b></div>
              <button className="chip" onClick={() => copy(me.addr)} title="Copy address">{short(me.addr)}<Icon name="copy" size={14} /></button>
            </div>
            <div className="div" />
            <div className="roles">
              {asClient > 0 && <span className="rchip"><Icon name="safe_lock" size={14} />Client · {plural(asClient, "agreement")}</span>}
              {asContrib > 0 && <span className="rchip"><Icon name="flag" size={14} />Contributor · {plural(asContrib, "agreement")}</span>}
              {!asClient && !asContrib && <span className="rchip">No agreements yet</span>}
            </div>
          </div>
          <KV rows={[["Wallet", short(me.addr)], ["Network", "Stellar Testnet"], ["Status", <StatusBadge key="c" status="connected" />]]} />
          <InstallCard variant="card" />
        </aside>
      </div>
    </Page>
  );
}
