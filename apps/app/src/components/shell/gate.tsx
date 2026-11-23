"use client";

import { useEffect } from "react";
import { Button, Icon, Logo } from "@milevault/ui";
import { env } from "@/lib/env";
import { useUI } from "@/mock";
import { HeroMediaStatic } from "./hero-static";

/** Wallet-disconnected state for any app route (design deeplink card pattern) */
export function ConnectGate() {
  const open = useUI((s) => s.open);
  // Landing "Connect wallet" links arrive with ?connect=1 → open the wallet picker straight away
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("connect") === "1") open({ t: "connect" });
  }, [open]);
  return (
    <div className="lp dl">
      <div className="lnav dl">
        <a href={env.landingUrl} aria-label="MileVault home"><Logo /></a>
        <Button h={36} icon="wallet" iconSize={16} onClick={() => open({ t: "connect" })} className="gate-btn">Connect wallet</Button>
      </div>
      <div className="dlwrap">
        <div className="dlcard mv-page">
          <HeroMediaStatic k="W-01" />
          <h3>Connect your wallet</h3>
          <p>MileVault uses your Stellar wallet to sign every action. Connect it to see your agreements, escrow and payments.</p>
          <Button h={44} icon="wallet" iconSize={16} onClick={() => open({ t: "connect" })}>Connect wallet</Button>
          <div className="note"><Icon name="lock" size={16} /><span>We only read your public address and never see your keys. Stellar Testnet.</span></div>
        </div>
      </div>
    </div>
  );
}
