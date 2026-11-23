#![no_std]
//! MileVault milestone escrow (Soroban).
//!
//! Lifecycle:
//!   create_agreement → fund → accept → (submit_milestone → approve_milestone → release)* → Completed
//!   Created  --cancel (client)-------------------------------→ Cancelled   (nothing to refund)
//!   Funded   --decline (contributor)--------------------------→ Declined    (full refund to client)
//!   Funded/Active --request_cancel + confirm_cancel (both)----→ Cancelled   (unreleased refunded)
//!
//! PRD rules enforced here (not just in the UI):
//!   1/7 only the client approves/releases · 2 releases need full funding · 3 payouts ≤ escrow balance
//!   4 each milestone paid once · 5 released funds never refunded · 6 cancellation rules on-chain
//!   8 a failed token transfer reverts the whole invocation, so no milestone is marked Paid.

mod errors;
mod events;
mod types;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contractimpl, token, Address, Env, Vec};

pub use errors::Error;
pub use types::*;
use events::*;

pub const MAX_MILESTONES: u32 = 10;
const TTL_THRESHOLD: u32 = 17_280; // ~1 day
const TTL_EXTEND_TO: u32 = 518_400; // ~30 days

#[contract]
pub struct MileVaultEscrow;

#[contractimpl]
impl MileVaultEscrow {
    /// Client creates an agreement. No funds move.
    pub fn create_agreement(
        env: Env,
        client: Address,
        contributor: Address,
        token: Address,
        milestones: Vec<MilestoneInput>,
    ) -> Result<u64, Error> {
        client.require_auth();
        if client == contributor {
            return Err(Error::SameParty);
        }
        if milestones.is_empty() {
            return Err(Error::NoMilestones);
        }
        if milestones.len() > MAX_MILESTONES {
            return Err(Error::TooManyMilestones);
        }

        let mut total: i128 = 0;
        let mut ms = Vec::new(&env);
        for m in milestones.iter() {
            if m.amount <= 0 {
                return Err(Error::InvalidAmount);
            }
            total = total.checked_add(m.amount).ok_or(Error::Overflow)?;
            ms.push_back(Milestone { title: m.title, amount: m.amount, status: MilestoneStatus::Pending });
        }

        let id: u64 = env.storage().instance().get(&DataKey::NextId).unwrap_or(1);
        env.storage().instance().set(&DataKey::NextId, &(id + 1));
        env.storage().instance().extend_ttl(TTL_THRESHOLD, TTL_EXTEND_TO);

        let agreement = Agreement {
            id,
            client: client.clone(),
            contributor,
            token,
            milestones: ms,
            total,
            escrow_balance: 0,
            released: 0,
            status: AgreementStatus::Created,
            accepted: false,
            cancel_requested_by: None,
        };
        save(&env, &agreement);
        AgreementCreated { agreement_id: id, actor: client, amount: total }.publish(&env);
        Ok(id)
    }

    /// Client locks the full agreement total in the contract.
    pub fn fund(env: Env, agreement_id: u64) -> Result<(), Error> {
        let mut a = load(&env, agreement_id)?;
        a.client.require_auth();
        expect_status(&a, AgreementStatus::Created)?;

        // Effects before interaction; a failed transfer reverts everything.
        a.escrow_balance = a.total;
        a.status = AgreementStatus::Funded;
        save(&env, &a);

        token::Client::new(&env, &a.token).transfer(&a.client, &env.current_contract_address(), &a.total);
        AgreementFunded { agreement_id, actor: a.client.clone(), amount: a.total }.publish(&env);
        Ok(())
    }

    /// Contributor accepts the funded terms.
    pub fn accept(env: Env, agreement_id: u64) -> Result<(), Error> {
        let mut a = load(&env, agreement_id)?;
        a.contributor.require_auth();
        expect_status(&a, AgreementStatus::Funded)?;
        a.status = AgreementStatus::Active;
        a.accepted = true;
        save(&env, &a);
        AgreementAccepted { agreement_id, actor: a.contributor.clone() }.publish(&env);
        Ok(())
    }

    /// Contributor declines the funded terms — the full escrow goes back to the client.
    pub fn decline(env: Env, agreement_id: u64) -> Result<(), Error> {
        let mut a = load(&env, agreement_id)?;
        a.contributor.require_auth();
        expect_status(&a, AgreementStatus::Funded)?;
        let refund = a.escrow_balance;
        a.escrow_balance = 0;
        a.status = AgreementStatus::Declined;
        save(&env, &a);
        token::Client::new(&env, &a.token).transfer(&env.current_contract_address(), &a.client, &refund);
        AgreementDeclined { agreement_id, actor: a.contributor.clone() }.publish(&env);
        AgreementRefunded { agreement_id, actor: a.contributor.clone(), amount: refund }.publish(&env);
        Ok(())
    }

    /// Contributor marks the current milestone ready for review. Milestones go in order.
    pub fn submit_milestone(env: Env, agreement_id: u64, index: u32) -> Result<(), Error> {
        let mut a = load(&env, agreement_id)?;
        a.contributor.require_auth();
        expect_status(&a, AgreementStatus::Active)?;
        if index != current_index(&a) {
            return Err(Error::OutOfSequence);
        }
        set_milestone_status(&mut a, index, MilestoneStatus::Pending, MilestoneStatus::Submitted)?;
        save(&env, &a);
        MilestoneSubmitted { agreement_id, actor: a.contributor.clone(), milestone: index }.publish(&env);
        Ok(())
    }

    /// Client approves a submitted milestone. Does NOT move funds.
    pub fn approve_milestone(env: Env, agreement_id: u64, index: u32) -> Result<(), Error> {
        let mut a = load(&env, agreement_id)?;
        a.client.require_auth();
        expect_status(&a, AgreementStatus::Active)?;
        set_milestone_status(&mut a, index, MilestoneStatus::Submitted, MilestoneStatus::Approved)?;
        save(&env, &a);
        MilestoneApproved { agreement_id, actor: a.client.clone(), milestone: index }.publish(&env);
        Ok(())
    }

    /// Client releases an approved milestone's payment to the contributor.
    pub fn release(env: Env, agreement_id: u64, index: u32) -> Result<(), Error> {
        let mut a = load(&env, agreement_id)?;
        a.client.require_auth();
        expect_status(&a, AgreementStatus::Active)?;

        let m = a.milestones.get(index).ok_or(Error::MilestoneNotFound)?;
        if m.status == MilestoneStatus::Paid {
            return Err(Error::AlreadyPaid);
        }
        if m.status != MilestoneStatus::Approved {
            return Err(Error::InvalidMilestoneStatus);
        }
        if m.amount > a.escrow_balance {
            return Err(Error::InsufficientEscrow);
        }

        set_milestone_status(&mut a, index, MilestoneStatus::Approved, MilestoneStatus::Paid)?;
        a.escrow_balance -= m.amount;
        a.released = a.released.checked_add(m.amount).ok_or(Error::Overflow)?;
        if a.milestones.iter().all(|x| x.status == MilestoneStatus::Paid) {
            a.status = AgreementStatus::Completed;
        }
        save(&env, &a);

        token::Client::new(&env, &a.token).transfer(&env.current_contract_address(), &a.contributor, &m.amount);
        MilestoneReleased { agreement_id, actor: a.client.clone(), milestone: index, amount: m.amount }.publish(&env);
        Ok(())
    }

    /// Client cancels an agreement that was never funded.
    pub fn cancel(env: Env, agreement_id: u64) -> Result<(), Error> {
        let mut a = load(&env, agreement_id)?;
        a.client.require_auth();
        expect_status(&a, AgreementStatus::Created)?;
        a.status = AgreementStatus::Cancelled;
        save(&env, &a);
        AgreementCancelled { agreement_id, actor: a.client.clone() }.publish(&env);
        Ok(())
    }

    /// Either party proposes mutual cancellation of a funded agreement.
    pub fn request_cancel(env: Env, agreement_id: u64, caller: Address) -> Result<(), Error> {
        caller.require_auth();
        let mut a = load(&env, agreement_id)?;
        expect_party(&a, &caller)?;
        match a.status {
            AgreementStatus::Funded | AgreementStatus::Active => {}
            AgreementStatus::CancelRequested => return Err(Error::CancelAlreadyRequested),
            _ => return Err(Error::InvalidStatus),
        }
        a.status = AgreementStatus::CancelRequested;
        a.cancel_requested_by = Some(caller.clone());
        save(&env, &a);
        CancelRequested { agreement_id, actor: caller }.publish(&env);
        Ok(())
    }

    /// The *other* party confirms — unreleased funds are refunded to the client.
    /// Already-released payments are never refunded (PRD rule 5).
    pub fn confirm_cancel(env: Env, agreement_id: u64, caller: Address) -> Result<(), Error> {
        caller.require_auth();
        let mut a = load(&env, agreement_id)?;
        expect_party(&a, &caller)?;
        expect_status(&a, AgreementStatus::CancelRequested)?;
        match &a.cancel_requested_by {
            Some(requester) if *requester != caller => {}
            Some(_) => return Err(Error::Unauthorized),
            None => return Err(Error::NoCancelRequest),
        }
        let refund = a.escrow_balance;
        a.escrow_balance = 0;
        a.status = AgreementStatus::Cancelled;
        save(&env, &a);
        if refund > 0 {
            token::Client::new(&env, &a.token).transfer(&env.current_contract_address(), &a.client, &refund);
        }
        AgreementCancelled { agreement_id, actor: caller.clone() }.publish(&env);
        AgreementRefunded { agreement_id, actor: caller, amount: refund }.publish(&env);
        Ok(())
    }

    /// Either party withdraws a pending cancellation request; the agreement resumes.
    pub fn withdraw_cancel(env: Env, agreement_id: u64, caller: Address) -> Result<(), Error> {
        caller.require_auth();
        let mut a = load(&env, agreement_id)?;
        expect_party(&a, &caller)?;
        expect_status(&a, AgreementStatus::CancelRequested)?;
        a.status = if a.accepted { AgreementStatus::Active } else { AgreementStatus::Funded };
        a.cancel_requested_by = None;
        save(&env, &a);
        Ok(())
    }

    pub fn get_agreement(env: Env, agreement_id: u64) -> Result<Agreement, Error> {
        load(&env, agreement_id)
    }
}

// ── helpers ────────────────────────────────────────────────────────────────

fn load(env: &Env, id: u64) -> Result<Agreement, Error> {
    let key = DataKey::Agreement(id);
    let a: Agreement = env.storage().persistent().get(&key).ok_or(Error::AgreementNotFound)?;
    env.storage().persistent().extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND_TO);
    Ok(a)
}

fn save(env: &Env, a: &Agreement) {
    let key = DataKey::Agreement(a.id);
    env.storage().persistent().set(&key, a);
    env.storage().persistent().extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND_TO);
}

fn expect_status(a: &Agreement, s: AgreementStatus) -> Result<(), Error> {
    if a.status == s { Ok(()) } else { Err(Error::InvalidStatus) }
}

fn expect_party(a: &Agreement, who: &Address) -> Result<(), Error> {
    if *who == a.client || *who == a.contributor { Ok(()) } else { Err(Error::Unauthorized) }
}

/// First milestone that isn't paid.
fn current_index(a: &Agreement) -> u32 {
    a.milestones.iter().position(|m| m.status != MilestoneStatus::Paid).map(|i| i as u32).unwrap_or(a.milestones.len())
}

fn set_milestone_status(a: &mut Agreement, index: u32, from: MilestoneStatus, to: MilestoneStatus) -> Result<(), Error> {
    let mut m = a.milestones.get(index).ok_or(Error::MilestoneNotFound)?;
    if m.status != from {
        return Err(Error::InvalidMilestoneStatus);
    }
    m.status = to;
    a.milestones.set(index, m);
    Ok(())
}
