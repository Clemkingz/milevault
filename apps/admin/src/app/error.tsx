"use client";

import { useState } from "react";
import { Button, Logo } from "@milevault/ui";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="lp dl sys">
      <div className="lnav dl"><Logo /><span className="adm-chip">Operator console</span></div>
      <div className="dlwrap">
        <div className="dlcard mv-page" role="alert">
          <div className="hmedia"><img className="sky" src="/admin/images/bg-sunset2.webp" alt="" /><img className="hil" src="/admin/images/w-05e.webp" alt="" /><span className="knot" /></div>
          <span className="sys-code err">Error{error.digest ? ` · ${error.digest}` : ""}</span>
          <h3>This view failed to load</h3>
          <p>The console hit an unexpected error. No data was changed.</p>
          <Button h={44} icon="refresh" iconSize={16} loading={busy} loadingText="Retrying…" onClick={() => { setBusy(true); setTimeout(reset, 400); }}>Try again</Button>
        </div>
      </div>
    </div>
  );
}
