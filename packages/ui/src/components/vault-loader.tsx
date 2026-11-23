"use client";

import { useEffect, useState } from "react";
import { Icon } from "../icons/icon";

const LINES = ["Opening your vault", "Checking escrow balances", "Syncing milestones", "Verifying on Stellar Testnet"];

/** Branded full-area loader: the vault mark with a drawing ring + cycling status line. */
export function VaultLoader({ label, lines = LINES, fullscreen }: { label?: string; lines?: string[]; fullscreen?: boolean }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (label) return;
    const t = setInterval(() => setI((x) => (x + 1) % lines.length), 1300);
    return () => clearInterval(t);
  }, [label, lines.length]);
  return (
    <div className={`vloader${fullscreen ? " fs" : ""}`} role="status" aria-live="polite" aria-busy="true">
      <div className="vl-mark">
        <svg className="vl-ring" viewBox="0 0 64 64" aria-hidden>
          <circle cx="32" cy="32" r="29" className="vl-track" />
          <circle cx="32" cy="32" r="29" className="vl-arc" />
        </svg>
        <span className="vl-tile"><Icon name="safe_lock" size={22} /></span>
      </div>
      <p className="vl-line" key={label ?? i}>{label ?? lines[i]}<span className="dots"><i>.</i><i>.</i><i>.</i></span></p>
    </div>
  );
}
