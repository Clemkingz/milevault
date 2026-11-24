"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { ApiError, mockWallets, shortAddr } from "@milevault/api";
import { Button, Icon, Logo, VaultLoader, useScrolled, type IconName } from "@milevault/ui";
import { signIn, signOut, type SignInResult } from "@/lib/auth";
import { api, mock } from "@/lib/backend";
import { env } from "@/lib/env";
import { useSession } from "@/lib/session";
import { device, walletChoices, walletLabel, type WalletName } from "@/lib/wallet";

const NAV: [string, string, IconName][] = [
  ["/overview", "Overview", "home"],
  ["/agreements", "Agreements", "file"],
  ["/transactions", "Transactions", "transfer"],
  ["/wallets", "Wallets", "wallet"],
  ["/system", "System", "shield"],
];
const on = (p: string, h: string) => p === h || p.startsWith(`${h}/`);
const useMounted = () => useSyncExternalStore(() => () => {}, () => true, () => false);

function Frame({ children, img = "w-01" }: { children: ReactNode; img?: string }) {
  return (
    <div className="lp dl sys">
      <div className="lnav dl"><Logo /><span className="adm-chip">Operator console</span></div>
      <div className="dlwrap">
        <div className="dlcard mv-page">
          <div className="hmedia"><img className="sky" src="/admin/images/sky.webp" alt="" /><img className="hil" src={`/admin/images/${img}.webp`} alt="" /><span className="knot" /></div>
          {children}
        </div>
      </div>
    </div>
  );
}

const MSG: Record<Exclude<SignInResult, "ok" | "error">, string> = {
  declined: "You declined the sign-in request in your wallet. Nothing was signed.",
  wrong_network: `Your wallet is on another network. Switch it to Stellar ${env.network === "mainnet" || env.network === "public" ? "Mainnet" : "Testnet"} and try again.`,
};

/** Sign in with an operator wallet (SEP-10). The backend decides who is an operator. */
function Gate({ expired }: { expired: boolean }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);
  const [choices, setChoices] = useState<Awaited<ReturnType<typeof walletChoices>> | null>(null);
  useEffect(() => { if (!mock) walletChoices().then(setChoices).catch(() => setChoices({ mobile: device().mobile, list: [] })); }, []);
  const go = async (key: string, name: WalletName, demo?: string) => {
    setBusy(key); setWarn(null);
    const r = await signIn(name, demo);
    setBusy(null);
    if (r === "declined" || r === "wrong_network") setWarn(MSG[r]);
  };
  return (
    <Frame>
      <span className="sys-code">{expired ? "Session ended" : "Restricted"}</span>
      <h3>{expired ? "Sign in again" : "Sign in to the operator console"}</h3>
      <p>{expired ? "Your operator session expired. Sign the request in your wallet again to continue." : "Monitor agreements, escrow and on-chain activity across MileVault. Sign in with an operator wallet; the backend checks it against the admin allowlist."}</p>
      {warn && <div className="warnbox"><Icon name="alert" size={16} /><span>{warn}</span></div>}
      {mock ? (
        <div className="adm-wallets">
          <Button h={44} icon="key" iconSize={16} loading={busy === "op"} loadingText="Signing in…" disabled={!!busy} onClick={() => go("op", "Varial", mockWallets[2]!.address)}>Sign in as demo operator</Button>
          <Button h={40} variant="sec" loading={busy === "user"} loadingText="Signing in…" disabled={!!busy} onClick={() => go("user", "Varial", mockWallets[0]!.address)}>Try a non-operator wallet</Button>
        </div>
      ) : (
        <div className="adm-wallets">
          {!choices ? <Button h={44} variant="sec" loading loadingText="Finding your wallets…">Finding your wallets…</Button>
            : choices.list.map(({ option: o, available, note }) => (
              <Button key={o.name} h={44} className="adm-wbtn" variant={available ? "sec" : "ghost"} loading={busy === o.name} loadingText="Check your wallet…" disabled={!!busy}
                onClick={() => (available ? go(o.name, o.name) : o.install && window.open(o.install, "_blank", "noopener"))}>
                <span className="adm-wopt"><b>{walletLabel(o.name, choices.mobile)}</b><small className={available ? (note.startsWith("Detected") ? "ok" : "") : "no"}>{available ? note : "Not installed · Install"}</small></span>
              </Button>
            ))}
          {choices?.footnote && <div className="adm-wfoot">{choices.footnote}</div>}
        </div>
      )}
      <div className="note"><Icon name="lock" size={16} /><span>{mock ? "Demo mode: an in-browser mock backend, no network calls." : "Signing proves you own the wallet. It can’t move funds and is never sent to the network."}</span></div>
    </Frame>
  );
}

function NotAdmin({ address }: { address: string | null }) {
  return (
    <Frame img="w-05e">
      <span className="sys-code">403 · Not an operator</span>
      <h3>This wallet doesn’t have admin access</h3>
      <p>{address ? shortAddr(address) : "This wallet"} signed in, but the backend didn’t recognise it as an operator. Sign in with an allowlisted wallet.</p>
      <Button h={44} icon="exit" iconSize={16} onClick={() => void signOut()}>Use another wallet</Button>
      <div className="flinks" style={{ justifyContent: "center" }}><a href="/app/dashboard">Open the MileVault app instead</a></div>
    </Frame>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const mounted = useMounted();
  const { token, address, expired } = useSession();
  const top = useScrolled<HTMLDivElement>();
  const me = useQuery({ queryKey: ["admin", "me", address], queryFn: api.admin.me, enabled: mounted && !!token, staleTime: 5 * 60_000, retry: false });
  useEffect(() => { if (me.error instanceof ApiError && me.error.status === 401) useSession.getState().expire(); }, [me.error]);

  if (!mounted) return <VaultLoader fullscreen label="Opening the operator console" />;
  if (!token) return <Gate expired={expired} />;
  if (me.isPending) return <VaultLoader fullscreen label="Checking operator access" />;
  if (me.error instanceof ApiError && me.error.status === 403) return <NotAdmin address={address} />;
  if (me.error) return (
    <Frame img="w-05e">
      <span className="sys-code">Backend unreachable</span>
      <h3>Couldn’t check your access</h3>
      <p>{me.error.message}</p>
      <Button h={44} icon="refresh" iconSize={16} onClick={() => void me.refetch()}>Try again</Button>
    </Frame>
  );

  const title = NAV.find(([h]) => on(pathname, h))?.[1] ?? "Admin";
  const short = shortAddr(address);
  return (
    <div className="app">
      <a href="#main" className="skip">Skip to content</a>
      <aside className="side" aria-label="Admin navigation">
        <div className="top">
          <Link href="/overview" className="side-brand" aria-label="Admin overview">
            <Logo className="full" /><Logo className="mark" markOnly />
          </Link>
          <span className="adm-chip side-adm">Operator console</span>
          <nav className="nav" aria-label="Main">
            <div className="nav-g">
              <span className="nav-l">Monitor</span>
              {NAV.map(([h, l, i]) => (
                <Link key={h} href={h} className={on(pathname, h) ? "on" : undefined} aria-current={on(pathname, h) ? "page" : undefined} title={l}>
                  <Icon name={i} size={24} /><span className="nl">{l}</span>
                </Link>
              ))}
            </div>
          </nav>
        </div>
        <div className="bot">
          <div className="user" style={{ cursor: "default" }}>
            <span className="av" style={{ width: 36, height: 36, background: "#EAF8FE", color: "#1A9ACB" }}><Icon name="shield" size={18} /></span>
            <div className="ut"><div className="nm" title={address ?? ""}>{short}</div><div className="wl"><span className="gdot" /><span className="ad">{mock ? "Demo backend" : "Operator"}</span></div></div>
            <button className="chev" onClick={() => void signOut()} title="Sign out" aria-label="Sign out"><Icon name="exit" size={16} /></button>
          </div>
          <div className="flinks"><a href="/app/dashboard">Open app</a><span>·</span><a href="/">Website</a></div>
        </div>
      </aside>
      <div className="main">
        <div className="mtop" ref={top}>
          <h2>{title}</h2>
          <button className="wchip" onClick={() => void signOut()} aria-label="Sign out"><Icon name="exit" size={16} />{short}</button>
        </div>
        <div className="scroll"><main id="main" className="col mv-page" key={pathname}>{children}</main></div>
      </div>
      <nav className="tabbar adm-tabs" aria-label="Main">
        {NAV.map(([h, l, i]) => (
          <Link key={h} href={h} className={on(pathname, h) ? "on" : undefined}><Icon name={i} size={24} /><span>{l}</span></Link>
        ))}
      </nav>
    </div>
  );
}
