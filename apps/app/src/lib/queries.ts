"use client";

import { QueryClient, useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import type { AgreementFilter, SaveAgreementInput, TxType } from "@milevault/api";
import { api } from "./backend";
import { useSession } from "./session";

export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 15_000, retry: (n, e) => { const st = (e as unknown as { status?: number }).status; return n < 2 && !(st && st < 500); }, refetchOnWindowFocus: true } },
});

const useAuthed = () => !!useSession((s) => s.token);

/* ---------- reads (no WebSocket: refetch on focus, after actions, and poll open agreements / notifications) ---------- */
export const useNetwork = () => useQuery({ queryKey: ["network"], queryFn: api.stellar.network, staleTime: Infinity });
export const useEscrowConfig = () => useQuery({ queryKey: ["escrow-config"], queryFn: api.escrow.config, staleTime: 10 * 60_000, enabled: useAuthed() });
export const useSessionCheck = () => useQuery({ queryKey: ["session"], queryFn: api.auth.session, enabled: useAuthed(), staleTime: 5 * 60_000, retry: false });
export const useDashboard = () => useQuery({ queryKey: ["dashboard"], queryFn: api.overview.dashboard, enabled: useAuthed() });
export const useWalletOverview = () => useQuery({ queryKey: ["wallet"], queryFn: api.overview.wallet, enabled: useAuthed() });
export const useAccount = (address?: string | null) => useQuery({ queryKey: ["account", address], queryFn: () => api.stellar.account(address!), enabled: !!address, staleTime: 30_000 });
export const useAgreements = (p: { filter: AgreementFilter; search: string; page: number; limit?: number }) =>
  useQuery({ queryKey: ["agreements", p], queryFn: () => api.agreements.list({ filter: p.filter, search: p.search || undefined, limit: p.limit ?? 20, offset: (p.page - 1) * (p.limit ?? 20) }), enabled: useAuthed(), placeholderData: keepPreviousData });
export const useAgreement = (ref: string) => useQuery({ queryKey: ["agreement", ref.toUpperCase()], queryFn: () => api.agreements.get(ref), enabled: useAuthed() && !!ref, refetchInterval: 20_000, retry: (n, e) => n < 1 && (e as unknown as { status?: number }).status !== 404 });
export const useActivity = (ref: string) => useQuery({ queryKey: ["activity", ref.toUpperCase()], queryFn: () => api.agreements.activity(ref), enabled: useAuthed() && !!ref, refetchInterval: 20_000 });
export const useTransactions = (p: { type: TxType; search: string; page: number; limit?: number }) =>
  useQuery({ queryKey: ["transactions", p], queryFn: () => api.overview.transactions({ type: p.type, search: p.search || undefined, limit: p.limit ?? 20, offset: (p.page - 1) * (p.limit ?? 20) }), enabled: useAuthed(), placeholderData: keepPreviousData });
export const useNotifications = (limit = 20) => useQuery({ queryKey: ["notifications", limit], queryFn: () => api.overview.notifications({ limit }), enabled: useAuthed(), refetchInterval: 45_000 });

/** After anything changes an agreement, refresh everything derived from it */
export function invalidateAll(qc: QueryClient, ref?: string) {
  for (const k of ["agreements", "dashboard", "wallet", "transactions", "notifications", "demo-sim"]) qc.invalidateQueries({ queryKey: [k] });
  if (ref) { qc.invalidateQueries({ queryKey: ["agreement", ref.toUpperCase()] }); qc.invalidateQueries({ queryKey: ["activity", ref.toUpperCase()] }); }
}

/* ---------- writes ---------- */
export function useSaveDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ref, input }: { ref?: string; input: SaveAgreementInput }) => (ref ? api.agreements.update(ref, input) : api.agreements.create(input)),
    onSuccess: (a) => { qc.setQueryData(["agreement", a.reference.toUpperCase()], a); qc.invalidateQueries({ queryKey: ["agreements"] }); },
  });
}
export function useReadNotifications() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id?: string) => (id ? api.overview.read(id) : api.overview.readAll()), onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }) });
}
