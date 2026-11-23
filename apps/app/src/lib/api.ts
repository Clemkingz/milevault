import type { ActivityItem, Agreement, AgreementMetadataInput, DashboardSummary } from "@milevault/shared";
import { env } from "./env";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${env.apiUrl}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

/** Off-chain metadata + indexed activity. Balances/permissions always come from the contract. */
export const api = {
  dashboard: (address: string) => request<DashboardSummary>(`/v1/wallets/${address}/dashboard`),
  agreements: (address: string) => request<Agreement[]>(`/v1/wallets/${address}/agreements`),
  agreement: (id: string) => request<Agreement>(`/v1/agreements/${id}`),
  activity: (address: string) => request<ActivityItem[]>(`/v1/wallets/${address}/activity`),
  saveAgreementMetadata: (input: AgreementMetadataInput) =>
    request<Agreement>("/v1/agreements", { method: "POST", body: JSON.stringify(input) }),
  saveSubmission: (id: string, index: number, submissionRef?: string) =>
    request<void>(`/v1/agreements/${id}/milestones/${index}/submission`, {
      method: "PUT",
      body: JSON.stringify({ submissionRef }),
    }),
};
