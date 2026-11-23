"use client";

import { useEffect, useState } from "react";
import { Button } from "@milevault/ui";
import { SafeList, SystemFrame } from "@/components/system";

/** Route error boundary — a UI failure never touches escrow. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [retrying, setRetrying] = useState(false);
  const ref = error.digest ?? `UI-${Date.now().toString(36).toUpperCase()}`;
  useEffect(() => { console.error(error); }, [error]);
  return (
    <SystemFrame k="W-05E" err code={`Error · ${ref}`} title="This screen hit a snag">
      <p>Something went wrong while showing this page. It’s a display problem only:</p>
      <SafeList items={["Your escrow and balances are unaffected", "No transaction was sent or signed", "Agreements stay exactly as they were on Stellar"]} />
      <Button h={44} icon="refresh" iconSize={16} loading={retrying} loadingText="Retrying…" onClick={() => { setRetrying(true); setTimeout(reset, 400); }}>Try again</Button>
      <Button h={44} variant="sec" onClick={() => window.location.assign("/app/dashboard")}>Go to dashboard</Button>
      <button className="mlink" style={{ alignSelf: "center", fontSize: 13 }} onClick={() => navigator.clipboard?.writeText(ref)}>Copy error reference</button>
    </SystemFrame>
  );
}
