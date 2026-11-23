use soroban_sdk::{contracttype, Address, String, Vec};

/// Mirrors `packages/shared/src/status.ts` — keep in sync.
#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum AgreementStatus {
    /// Exists on-chain, not funded. Client may fund or cancel.
    Created,
    /// Full escrow locked; waiting for the contributor to accept or decline.
    Funded,
    /// Contributor accepted; milestones can be submitted.
    Active,
    /// One party proposed mutual cancellation of a funded agreement.
    CancelRequested,
    /// Every milestone paid.
    Completed,
    /// Cancelled (unfunded by client, or funded by mutual consent). Unreleased funds refunded.
    Cancelled,
    /// Contributor declined a funded agreement; full escrow refunded to client.
    Declined,
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum MilestoneStatus {
    Pending,
    Submitted,
    /// Approved by the client — NOT yet paid. Release is a separate call.
    Approved,
    Paid,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MilestoneInput {
    pub title: String,
    pub amount: i128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Milestone {
    pub title: String,
    pub amount: i128,
    pub status: MilestoneStatus,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Agreement {
    pub id: u64,
    pub client: Address,
    pub contributor: Address,
    /// SAC address of the escrow token (testnet USDC)
    pub token: Address,
    pub milestones: Vec<Milestone>,
    pub total: i128,
    /// Amount currently held by the contract for this agreement
    pub escrow_balance: i128,
    pub released: i128,
    pub status: AgreementStatus,
    /// Contributor has accepted the funded terms
    pub accepted: bool,
    /// Party that requested mutual cancellation, if any
    pub cancel_requested_by: Option<Address>,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    NextId,
    Agreement(u64),
}
