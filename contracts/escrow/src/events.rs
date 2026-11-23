//! Event layout consumed by `apps/api/src/indexer/decode.ts`:
//!   topics: [Symbol(<name>), u64 agreement_id]
//!   data:   map { actor, milestone?, amount? }
use soroban_sdk::{contractevent, Address};

#[contractevent(topics = ["agreement_created"], data_format = "map")]
pub struct AgreementCreated { #[topic] pub agreement_id: u64, pub actor: Address, pub amount: i128 }

#[contractevent(topics = ["agreement_funded"], data_format = "map")]
pub struct AgreementFunded { #[topic] pub agreement_id: u64, pub actor: Address, pub amount: i128 }

#[contractevent(topics = ["agreement_accepted"], data_format = "map")]
pub struct AgreementAccepted { #[topic] pub agreement_id: u64, pub actor: Address }

#[contractevent(topics = ["agreement_declined"], data_format = "map")]
pub struct AgreementDeclined { #[topic] pub agreement_id: u64, pub actor: Address }

#[contractevent(topics = ["milestone_submitted"], data_format = "map")]
pub struct MilestoneSubmitted { #[topic] pub agreement_id: u64, pub actor: Address, pub milestone: u32 }

#[contractevent(topics = ["milestone_approved"], data_format = "map")]
pub struct MilestoneApproved { #[topic] pub agreement_id: u64, pub actor: Address, pub milestone: u32 }

#[contractevent(topics = ["milestone_released"], data_format = "map")]
pub struct MilestoneReleased { #[topic] pub agreement_id: u64, pub actor: Address, pub milestone: u32, pub amount: i128 }

#[contractevent(topics = ["cancel_requested"], data_format = "map")]
pub struct CancelRequested { #[topic] pub agreement_id: u64, pub actor: Address }

#[contractevent(topics = ["agreement_cancelled"], data_format = "map")]
pub struct AgreementCancelled { #[topic] pub agreement_id: u64, pub actor: Address }

#[contractevent(topics = ["agreement_refunded"], data_format = "map")]
pub struct AgreementRefunded { #[topic] pub agreement_id: u64, pub actor: Address, pub amount: i128 }
