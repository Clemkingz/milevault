//! PRD §6 test scenarios (#1–#12).
#![cfg(test)]
extern crate std;

use super::*;
use soroban_sdk::{testutils::Address as _, token, vec, Address, Env, String};

struct Setup<'a> {
    env: Env,
    client: Address,
    contributor: Address,
    usdc: token::Client<'a>,
    escrow: MileVaultEscrowClient<'a>,
}

/// 1,500 USDC in three milestones (300 / 700 / 500) — the PRD example. Client is minted `mint`.
fn setup<'a>(mint: i128) -> (Setup<'a>, u64) {
    let env = Env::default();
    env.mock_all_auths();

    let client = Address::generate(&env);
    let contributor = Address::generate(&env);
    let admin = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(admin);
    token::StellarAssetClient::new(&env, &sac.address()).mint(&client, &mint);
    let usdc = token::Client::new(&env, &sac.address());

    let escrow = MileVaultEscrowClient::new(&env, &env.register(MileVaultEscrow, ()));
    let ms = vec![
        &env,
        MilestoneInput { title: String::from_str(&env, "UI/UX implementation"), amount: 300 },
        MilestoneInput { title: String::from_str(&env, "Core functionality"), amount: 700 },
        MilestoneInput { title: String::from_str(&env, "Testing and deployment"), amount: 500 },
    ];
    let id = escrow.create_agreement(&client, &contributor, &sac.address(), &ms);
    (Setup { env, client, contributor, usdc, escrow }, id)
}

fn submit_approve(s: &Setup, id: u64, i: u32) {
    s.escrow.submit_milestone(&id, &i);
    s.escrow.approve_milestone(&id, &i);
}

#[test]
fn t01_create_valid_agreement() {
    let (s, id) = setup(1_500);
    let a = s.escrow.get_agreement(&id);
    assert_eq!(a.total, 1_500);
    assert_eq!(a.status, AgreementStatus::Created);
    assert_eq!(a.milestones.len(), 3);
}

#[test]
fn t02_fund_locks_tokens() {
    let (s, id) = setup(1_500);
    s.escrow.fund(&id);
    assert_eq!(s.usdc.balance(&s.client), 0);
    assert_eq!(s.usdc.balance(&s.escrow.address), 1_500);
    assert_eq!(s.escrow.get_agreement(&id).status, AgreementStatus::Funded);
}

#[test]
fn t03_approve_and_release_one_milestone() {
    let (s, id) = setup(1_500);
    s.escrow.fund(&id);
    s.escrow.accept(&id);
    submit_approve(&s, id, 0);
    assert_eq!(s.usdc.balance(&s.contributor), 0, "approval must not pay");
    s.escrow.release(&id, &0);
    assert_eq!(s.usdc.balance(&s.contributor), 300);
    assert_eq!(s.escrow.get_agreement(&id).escrow_balance, 1_200);
}

#[test]
fn t04_sequential_releases_complete_agreement() {
    let (s, id) = setup(1_500);
    s.escrow.fund(&id);
    s.escrow.accept(&id);
    for i in 0..3 {
        submit_approve(&s, id, i);
        s.escrow.release(&id, &i);
    }
    assert_eq!(s.usdc.balance(&s.contributor), 1_500);
    let a = s.escrow.get_agreement(&id);
    assert_eq!(a.status, AgreementStatus::Completed);
    assert_eq!(a.escrow_balance, 0);
}

#[test]
fn t05_unauthorized_approval_rejected() {
    let (s, id) = setup(1_500);
    s.escrow.fund(&id);
    s.escrow.accept(&id);
    s.escrow.submit_milestone(&id, &0);
    s.env.set_auths(&[]); // no signatures — client auth missing
    assert!(s.escrow.try_approve_milestone(&id, &0).is_err());
}

#[test]
fn t06_release_blocked_without_funding() {
    let (s, id) = setup(1_500);
    // Not funded → not accepted/active → cannot submit, approve or release
    assert_eq!(s.escrow.try_submit_milestone(&id, &0), Err(Ok(Error::InvalidStatus)));
    assert_eq!(s.escrow.try_release(&id, &0), Err(Ok(Error::InvalidStatus)));
}

#[test]
fn t07_repeated_release_rejected() {
    let (s, id) = setup(1_500);
    s.escrow.fund(&id);
    s.escrow.accept(&id);
    submit_approve(&s, id, 0);
    s.escrow.release(&id, &0);
    assert_eq!(s.escrow.try_release(&id, &0), Err(Ok(Error::AlreadyPaid)));
}

#[test]
fn t08_cancel_unfunded_agreement() {
    let (s, id) = setup(1_500);
    s.escrow.cancel(&id);
    assert_eq!(s.escrow.get_agreement(&id).status, AgreementStatus::Cancelled);
}

#[test]
fn t09_mutual_cancellation_refunds_unreleased() {
    let (s, id) = setup(1_500);
    s.escrow.fund(&id);
    s.escrow.accept(&id);
    submit_approve(&s, id, 0);
    s.escrow.release(&id, &0);
    s.escrow.request_cancel(&id, &s.client);
    // requester cannot confirm their own request
    assert_eq!(s.escrow.try_confirm_cancel(&id, &s.client), Err(Ok(Error::Unauthorized)));
    s.escrow.confirm_cancel(&id, &s.contributor);
    assert_eq!(s.usdc.balance(&s.client), 1_200);
    assert_eq!(s.usdc.balance(&s.contributor), 300);
    assert_eq!(s.escrow.get_agreement(&id).status, AgreementStatus::Cancelled);
}

#[test]
fn t10_failed_transfer_changes_nothing() {
    let (s, id) = setup(100); // client can't cover 1,500
    assert!(s.escrow.try_fund(&id).is_err());
    let a = s.escrow.get_agreement(&id);
    assert_eq!(a.status, AgreementStatus::Created);
    assert_eq!(a.escrow_balance, 0);
}

#[test]
fn t11_invalid_milestone_amount_rejected() {
    let (s, _) = setup(1_500);
    let bad = vec![&s.env, MilestoneInput { title: String::from_str(&s.env, "Zero"), amount: 0 }];
    assert_eq!(
        s.escrow.try_create_agreement(&s.client, &s.contributor, &s.usdc.address, &bad),
        Err(Ok(Error::InvalidAmount))
    );
}

#[test]
fn t12_refund_of_released_funds_rejected() {
    let (s, id) = setup(1_500);
    s.escrow.fund(&id);
    s.escrow.accept(&id);
    for i in 0..3 {
        submit_approve(&s, id, i);
        s.escrow.release(&id, &i);
    }
    // Completed agreements can't be cancelled/refunded
    assert_eq!(s.escrow.try_request_cancel(&id, &s.client), Err(Ok(Error::InvalidStatus)));
    assert_eq!(s.escrow.try_cancel(&id), Err(Ok(Error::InvalidStatus)));
}

#[test]
fn decline_refunds_full_escrow() {
    let (s, id) = setup(1_500);
    s.escrow.fund(&id);
    s.escrow.decline(&id);
    assert_eq!(s.usdc.balance(&s.client), 1_500);
    assert_eq!(s.escrow.get_agreement(&id).status, AgreementStatus::Declined);
}
