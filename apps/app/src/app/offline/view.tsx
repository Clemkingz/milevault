"use client";

import { Button, Icon, Logo } from "@milevault/ui";
import { HeroMediaStatic } from "@/components/shell/hero-static";

/** Offline fallback served by the service worker */
export function OfflineView() {
  return (
    <div className="lp dl sys">
      <div className="lnav dl"><Logo /></div>
      <div className="dlwrap">
        <div className="dlcard mv-page">
          <HeroMediaStatic k="W-05E" err />
          <span className="sys-code">Offline</span>
          <h3>You’re offline</h3>
          <p>MileVault needs a connection to read escrow balances and sign transactions. Your funds are safe on Stellar — nothing changes while you’re away.</p>
          <Button h={44} icon="refresh" iconSize={16} onClick={() => window.location.reload()}>Try again</Button>
          <div className="note"><Icon name="info" size={16} /><span>Transactions you started are either confirmed on-chain or never happened — there’s no half-state.</span></div>
        </div>
      </div>
    </div>
  );
}
