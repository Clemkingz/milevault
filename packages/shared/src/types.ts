import type {
  AgreementStatus,
  EscrowEventType,
  MilestoneStatus,
} from "./status";

/** Stellar G... account address */
export type StellarAddress = string;
/** Token amounts are i128 stroop-style integers on-chain; carried as strings to avoid precision loss. */
export type TokenAmount = string;

export interface Milestone {
  /** Zero-based sequence within the agreement */
  index: number;
  title: string;
  description?: string;
  amount: TokenAmount;
  status: MilestoneStatus;
  /** Optional link / reference supplied by the contributor on submission (off-chain) */
  submissionRef?: string;
  releasedTxHash?: string;
}

export interface Agreement {
  /** On-chain agreement ID (u64 from the contract) */
  id: string;
  projectName: string;
  description?: string;
  client: StellarAddress;
  contributor: StellarAddress;
  token: string;
  totalAmount: TokenAmount;
  releasedAmount: TokenAmount;
  /** Locked, unreleased balance held by the contract */
  escrowBalance: TokenAmount;
  status: AgreementStatus;
  milestones: Milestone[];
  createdTxHash?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityItem {
  id: string;
  agreementId: string;
  type: EscrowEventType;
  milestoneIndex?: number;
  amount?: TokenAmount;
  actor?: StellarAddress;
  txHash: string;
  ledger: number;
  occurredAt: string;
}

export interface DashboardSummary {
  totalAgreements: number;
  activeAgreements: number;
  fundsInEscrow: TokenAmount;
  pendingApprovals: number;
  recentActivity: ActivityItem[];
}
