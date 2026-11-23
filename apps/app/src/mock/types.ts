import type { AgreementStatus, MilestoneStatus } from "@milevault/shared";
import type { FolderColor } from "@milevault/ui";

export type PersonKey = "aryan" | "kay" | "rhea" | "abbas" | "sophia";

export interface Person {
  key: PersonKey;
  name: string;
  first: string;
  addr: string;
  img?: string;
  /** img is a data URL (uploaded photo) rather than a bundled image key */
  imgIsData?: boolean;
  bg: string;
  fg?: string;
}

export interface MockMilestone {
  title: string;
  desc: string;
  /** USDC (2-decimal display; base units handled by the real integration) */
  amount: number;
  status: MilestoneStatus;
  submittedAt?: string;
  link?: string;
  note?: string;
  approvedAt?: string;
  paidAt?: string;
  releaseHash?: string;
}

export interface MockAgreement {
  /** On-chain id (u64) — shown as MV-<id> */
  id: string;
  name: string;
  desc: string;
  client: PersonKey;
  contributor: PersonKey;
  status: AgreementStatus;
  color: FolderColor;
  createdAt: string;
  createHash?: string;
  fundHash?: string;
  /** Set while a mutual cancellation is pending */
  cancelRequestedBy?: PersonKey;
  cancelPrevStatus?: AgreementStatus;
  refunded?: number;
  ms: MockMilestone[];
}

export type EventKind =
  | "create" | "fund" | "accept" | "decline" | "submit" | "approve" | "release"
  | "cancel" | "cancel_request" | "cancel_withdraw" | "refund";

export interface MockEvent {
  id: string;
  kind: EventKind;
  agreementId: string;
  /** Milestone index */
  i?: number;
  amount?: number;
  actor: PersonKey;
  hash?: string;
  at: string;
}

export interface Draft {
  step: 1 | 2 | 3;
  name: string;
  desc: string;
  addr: string;
  ms: { title: string; desc: string; amount: string }[];
  savedAt?: string;
}

export type WalletId = "Freighter" | "xBull" | "Albedo" | "LOBSTR" | "Hana";
