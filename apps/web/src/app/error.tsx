"use client";

import { useState } from "react";
import { Icon } from "@milevault/ui";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="lp sys">
      <div className="dlwrap">
        <div className="dlcard mv-page" role="alert">
          <div className="hmedia"><img className="sky" src="/images/bg-sunset2.webp" alt="" /><img className="hil" src="/images/w-05e.webp" alt="" /><span className="knot" /></div>
          <span className="sys-code err">Error{error.digest ? ` · ${error.digest}` : ""}</span>
          <h3>This page didn’t load</h3>
          <p>Something went wrong on our side. Nothing about your agreements or escrow changed.</p>
          <button className={`btn pri h44${busy ? " is-loading" : ""}`} disabled={busy} onClick={() => { setBusy(true); setTimeout(reset, 400); }}>
            <Icon name={busy ? "loading" : "refresh"} size={16} className={busy ? "spin" : undefined} /><span>{busy ? "Retrying…" : "Try again"}</span>
          </button>
          <a className="btn sec h44" href="/"><span>Back to home</span></a>
        </div>
      </div>
    </div>
  );
}
