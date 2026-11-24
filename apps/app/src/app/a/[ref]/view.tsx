"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button, Icon, Logo } from "@milevault/ui";
import { HeroMediaStatic } from "@/components/shell/hero-static";
import { useMounted } from "@/components/shell/app-shell";
import { DemoPanel } from "@/components/shell/demo-panel";
import { env } from "@/lib/env";
import { useSession } from "@/lib/session";
import { useUI } from "@/lib/ui";

/**
 * Share link — milevault.app/a/MV-1042. Agreements are private to their two wallets
 * (the backend returns 404 to anyone else), so this page asks the visitor to sign in first.
 */
export function InviteView({ refCode }: { refCode: string }) {
  const mounted = useMounted();
  const router = useRouter();
  const ref = refCode.toUpperCase().startsWith("MV-") ? refCode.toUpperCase() : `MV-${refCode}`;
  const token = useSession((s) => s.token);
  const { open, setAfterConnect } = useUI.getState();
  useEffect(() => { if (mounted && token) router.replace(`/agreements/${ref}`); }, [mounted, token, ref, router]);
  const connect = () => { setAfterConnect(`/agreements/${ref}`); open({ t: "connect" }); };
  return (
    <div className="lp dl" style={{ minHeight: "100dvh" }}>
      <div className="lnav dl"><a href={env.landingUrl} aria-label="MileVault home"><Logo /></a><Button h={36} icon="wallet" iconSize={16} onClick={connect} className="gate-btn">Connect wallet</Button></div>
      <div className="dlwrap">
        <div className="dlcard mv-page">
          <HeroMediaStatic k="D-10" />
          <span className="sys-code">{ref}</span>
          <h3>Connect to view this agreement</h3>
          <p>Someone shared agreement {ref} with you. Sign in with the wallet that’s part of it to see its milestones and payments.</p>
          <Button h={44} icon="wallet" iconSize={16} onClick={connect}>Connect wallet</Button>
          <div className="note"><Icon name="info" size={16} /><span>Only the client and contributor wallets can open this agreement. Anyone else sees “not found”.</span></div>
        </div>
      </div>
      {env.dataSource === "mock" && <DemoPanel />}
    </div>
  );
}
