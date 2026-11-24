import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms", description: "Terms for using the MileVault Stellar Testnet MVP.", alternates: { canonical: "/terms" } };

export default function Terms() {
  return (
    <>
      <h1>Terms</h1>
      <p className="upd">Testnet MVP · draft for review</p>
      <h2>Testnet only</h2>
      <p>MileVault currently runs on Stellar Testnet. Assets used are test tokens with no real-world value. Do not send Mainnet funds.</p>
      <h2>How funds are held</h2>
      <p>Funds are locked on Stellar in claimable balances, one per milestone, under the terms both parties agree to. Every payout starts with the client’s wallet signature. MileVault co-signs escrow transactions but never holds or sees your wallet keys.</p>
      <h2>No dispute resolution</h2>
      <p>The MVP does not include arbitration. A funded agreement can be cancelled, with unpaid milestones refunded, only when both parties confirm. After an agreement’s recovery date, the client can reclaim any milestone that hasn’t been paid.</p>
      <h2>No advice</h2>
      <p>Nothing in MileVault is legal, tax or financial advice.</p>
    </>
  );
}
