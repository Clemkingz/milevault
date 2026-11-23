"use client";

import { useEffect, useState } from "react";
import { Button } from "@milevault/ui";
import { KV, PageHeader, Section } from "@/components/bits";
import { env } from "@/lib/env";
import { mid } from "@/lib/format";

type Check = { state: "ok" | "warn" | "down" | "idle"; label: string; detail?: string };

async function checkRpc(): Promise<Check> {
  try {
    const t0 = performance.now();
    const r = await fetch(env.sorobanRpcUrl, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getLatestLedger" }) });
    const j = (await r.json()) as { result?: { sequence: number } };
    const ms = Math.round(performance.now() - t0);
    return j.result ? { state: ms > 1500 ? "warn" : "ok", label: `Ledger ${j.result.sequence.toLocaleString()}`, detail: `${ms} ms` } : { state: "down", label: "Unexpected response" };
  } catch { return { state: "down", label: "Unreachable" }; }
}

async function checkBackend(): Promise<Check> {
  if (!env.apiUrl) return { state: "idle", label: "Not configured", detail: "Set NEXT_PUBLIC_API_URL" };
  try {
    const t0 = performance.now();
    const r = await fetch(new URL("health", env.apiUrl.endsWith("/") ? env.apiUrl : `${env.apiUrl}/`));
    return { state: r.ok ? "ok" : "down", label: r.ok ? "Healthy" : `HTTP ${r.status}`, detail: `${Math.round(performance.now() - t0)} ms` };
  } catch { return { state: "down", label: "Unreachable" }; }
}

const Dot = ({ c }: { c: Check }) => <span className={`statusdot ${c.state === "ok" ? "" : c.state}`}><i />{c.label}{c.detail ? <span style={{ color: "var(--soft)", fontWeight: 400 }}>&nbsp;· {c.detail}</span> : null}</span>;

export function SystemStatus() {
  const [rpc, setRpc] = useState<Check>({ state: "idle", label: "Checking…" });
  const [api, setApi] = useState<Check>({ state: "idle", label: "Checking…" });
  const [busy, setBusy] = useState(false);
  const run = async () => { setBusy(true); const [a, b] = await Promise.all([checkRpc(), checkBackend()]); setRpc(a); setApi(b); setBusy(false); };
  useEffect(() => { void run(); }, []);
  return (
    <>
      <PageHeader title="System" sub="Network, contract and backend health." actions={<Button variant="sec" h={40} icon="refresh" iconSize={16} loading={busy} loadingText="Checking…" onClick={run}>Re-run checks</Button>} />
      <Section title="Health">
        <KV rows={[["Soroban RPC", <Dot key="r" c={rpc} />], ["MileVault backend", <Dot key="a" c={api} />], ["Data source", env.dataSource === "mock" ? "Demo data (mock)" : "Live backend"]]} />
      </Section>
      <Section title="Configuration">
        <KV rows={[["Network", env.network === "public" ? "Stellar Mainnet" : "Stellar Testnet"], ["Escrow contract", env.escrowContractId ? mid(env.escrowContractId) : "Not deployed"], ["RPC endpoint", new URL(env.sorobanRpcUrl).host], ["Backend URL", env.apiUrl ? new URL(env.apiUrl).host : "—"]]} />
      </Section>
    </>
  );
}
