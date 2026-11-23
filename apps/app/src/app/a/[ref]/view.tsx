"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button, Icon, Logo } from "@milevault/ui";
import { Folder } from "@/components/art";
import { HeroMediaStatic } from "@/components/shell/hero-static";
import { useBoot } from "@/components/shell/app-shell";
import { Sk } from "@/components/shell/skeleton";
import { DemoPanel } from "@/components/shell/demo-panel";
import { env } from "@/lib/env";
import { involves, getPerson, plural, total, usd, useAgreement, useChain, useUI } from "@/mock";

/** Contributor deep link — milevault.app/a/MV-1042 (design deeplinkPage()) */
export function InviteView({ refCode }: { refCode: string }) {
  const hydrated = useBoot();
  const router = useRouter();
  const id = refCode.replace(/^MV-/i, "");
  const a = useAgreement(id);
  const me = useChain((s) => s.me);
  const { open, setAfterConnect } = useUI.getState();

  useEffect(() => {
    if (hydrated && me && a && involves(a, me)) router.replace(`/agreements/${a.id}`);
  }, [hydrated, me, a, router]);

  const connect = () => { setAfterConnect(`/agreements/${id}`); open({ t: "connect", sw: !!me }); };
  const wrongWallet = hydrated && me && a && !involves(a, me);

  return (
    <div className="lp dl" style={{ minHeight: "100dvh" }}>
      <div className="lnav dl">
        <a href={env.landingUrl} aria-label="MileVault home"><Logo /></a>
        <Button h={36} icon="wallet" iconSize={16} onClick={connect} className="gate-btn">Connect wallet</Button>
      </div>
      <div className="dlwrap">
        <div className="dlcard mv-page">
          <HeroMediaStatic k={a ? "D-10" : "E-01"} />
          {!hydrated ? (
            <><Sk w="70%" h={22} /><Sk h={14} /><Sk h={64} r={12} /></>
          ) : a ? (
            <>
              <h3>{wrongWallet ? "This wallet isn’t on this agreement" : "Connect to view this agreement"}</h3>
              <p>{wrongWallet
                ? `You’re connected as ${getPerson(me!).name}. Switch to the wallet that’s part of ${a.name} to open it.`
                : `${getPerson(a.client).name} shared ${a.name} with you. Connect the wallet that’s part of this agreement to see its milestones and payments.`}</p>
              <div className="dlag"><Folder color={a.color} w={40} /><div className="tx"><b>{a.name}</b><small>MV-{a.id} · {usd(total(a))} · {plural(a.ms.length, "milestone")}</small></div></div>
              <Button h={44} icon="wallet" iconSize={16} onClick={connect}>{wrongWallet ? "Switch wallet" : "Connect wallet"}</Button>
            </>
          ) : (
            <>
              <h3>Agreement not found</h3>
              <p>There’s no agreement {refCode.toUpperCase()}. The link may be mistyped, or the agreement was created on a different network.</p>
              <Button h={44} variant="sec" onClick={() => router.push("/dashboard")}>Go to dashboard</Button>
            </>
          )}
          <div className="note"><Icon name="info" size={16} /><span>Only the client and contributor wallets can open this agreement. Stellar Testnet.</span></div>
        </div>
      </div>
      {env.dataSource === "mock" && <DemoPanel />}
    </div>
  );
}
