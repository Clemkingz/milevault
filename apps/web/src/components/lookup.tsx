"use client";

import { useState } from "react";
import { Icon } from "@milevault/ui";

/** Jump to a shared agreement by MV number (opens the dashboard zone) */
export function Lookup() {
  const [v, setV] = useState("");
  const [err, setErr] = useState(false);
  const go = () => {
    const id = v.trim().toUpperCase().replace(/^MV-?/, "");
    if (!/^\d{1,10}$/.test(id)) return setErr(true);
    window.location.assign(`/a/MV-${id}`);
  };
  return (
    <div className="fld">
      <label className="lbl" htmlFor="lookup">Opening a shared agreement?</label>
      <div className={`inp${err ? " err" : ""}`} style={{ padding: "6px 6px 6px 11px" }}>
        <Icon name="search" size={16} color="#A3A3A3" />
        <input id="lookup" value={v} placeholder="MV-1042" onChange={(e) => { setV(e.target.value); setErr(false); }} onKeyDown={(e) => e.key === "Enter" && go()} />
        <button className="btn pri h32" onClick={go}><span>Open</span></button>
      </div>
      {err && <div className="hint err"><Icon name="warning" size={16} />Enter a number like MV-1042</div>}
    </div>
  );
}
