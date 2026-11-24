"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, relTime } from "@milevault/api";
import { Button } from "@milevault/ui";
import { DataView, ErrorState, KV, PageHeader, Rows, Section, pick } from "@/components/bits";
import { ARBITER } from "@/lib/badge";
import { api, mock } from "@/lib/backend";
import { env } from "@/lib/env";
import { toast } from "@/lib/toast";

export function SystemView() {
  const qc = useQueryClient();
  const sys = useQuery({ queryKey: ["admin", "system"], queryFn: api.admin.system, refetchInterval: 30_000 });
  const health = useQuery({ queryKey: ["health"], queryFn: api.health, retry: false });
  const net = useQuery({ queryKey: ["network"], queryFn: api.stellar.network, staleTime: Infinity });
  const run = useMutation({
    mutationFn: api.admin.runIndexer,
    onSuccess: (r) => {
      // POST /admin/indexer/run returns the system status after one sync
      qc.setQueryData(["admin", "system"], r);
      const ledger = pick(r, "indexer.lastLedger");
      toast(typeof ledger === "number" ? `Indexer ran · ledger ${ledger.toLocaleString()}` : "Indexer ran");
      void qc.invalidateQueries({ queryKey: ["admin", "overview"] });
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : "Couldn’t start the indexer.", "error"),
  });
  const lastRun = pick(sys.data, "indexer.lastRunAt");

  return (
    <>
      <PageHeader title="System" sub="Backend services, arbiter account and the on-chain indexer."
        actions={<>
          <Button variant="sec" h={40} icon="refresh" iconSize={16} loading={sys.isFetching && !sys.isPending} loadingText="Refreshing…" onClick={() => { void sys.refetch(); void health.refetch(); }}>Refresh</Button>
          <Button h={40} icon="history" iconSize={16} loading={run.isPending} loadingText="Running…" onClick={() => run.mutate()}>Run indexer</Button>
        </>} />
      <Section title="Connection">
        <KV rows={[
          ["Backend", health.isPending ? "Checking…" : health.error ? <span key="h" className="statusdot down"><i />Unreachable</span> : <span key="h" className="statusdot"><i />Healthy</span>],
          ["Data source", mock ? "Demo (in-browser mock backend)" : env.apiUrl ? new URL(env.apiUrl).host : "Not configured"],
          ["Network", net.data ? `${net.data.network === "mainnet" ? "Stellar Mainnet" : "Stellar Testnet"}` : "—"],
          ["Indexer last run", typeof lastRun === "string" ? relTime(lastRun) : "—"],
          ["Arbiter", (() => { const st = String(pick(sys.data, "arbiter.status") ?? ""); const [tone, label] = ARBITER[st] ?? (st ? ["idle", st] : ["idle", "—"]); return <span key="arb" className={`statusdot ${tone === "ok" ? "" : tone}`}><i />{label}</span>; })()],
        ]} />
      </Section>
      {sys.isPending ? <Rows n={3} /> : sys.error ? <ErrorState error={sys.error} retry={() => void sys.refetch()} /> : <DataView data={sys.data} />}
    </>
  );
}
