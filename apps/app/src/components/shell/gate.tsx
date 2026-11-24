"use client";

import { useEffect } from "react";
import { Button, Icon, Logo } from "@milevault/ui";
import { env } from "@/lib/env";
import { useSession } from "@/lib/session";
import { useUI } from "@/lib/ui";
import { HeroMediaStatic } from "./hero-static";

/** Disconnected / session-expired state for every app route */
export function ConnectGate() {
  const open = useUI((s) => s.open);
  const expired = useSession((s) => s.expired);
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
          <HeroMediaStatic k={expired ? "T-03" : "W-01"} />
          {expired && <span className="sys-code">Session ended</span>}
          <h3>{expired ? "Sign in again to continue" : "Connect your wallet"}</h3>
          <p>{expired
            ? "Your wallet session expired or was signed out. Sign the sign-in message again — it moves no funds."
            : "MileVault signs you in with your Stellar wallet. You’ll approve one sign-in message — it can’t move funds and isn’t sent to the network."}</p>
          <Button h={44} icon="wallet" iconSize={16} onClick={() => open({ t: "connect" })}>{expired ? "Sign in" : "Connect wallet"}</Button>
          <div className="note"><Icon name="lock" size={16} /><span>MileVault only stores your public address. We never see your keys.</span></div>
        </div>
      </div>
    </div>
  );
}
