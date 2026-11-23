import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms", description: "Terms for using the MileVault Stellar Testnet MVP.", alternates: { canonical: "/terms" } };

export default function Terms() {
  return (
    <>
      <h1>Terms</h1>
      <p className="upd">Testnet MVP · draft for review</p>
      <h2>Testnet only</h2>
      <p>MileVault currently runs on Stellar Testnet. Assets used are test tokens with no real-world value. Do not send Mainnet funds.</p>
      <h2>Non-custodial</h2>
      <p>Funds are held by a Soroban smart contract under the rules both parties agree to. MileVault cannot move, freeze or redirect escrowed funds.</p>
      <h2>No dispute resolution</h2>
      <p>The MVP does not include arbitration. Funded agreements can be cancelled and unreleased funds refunded only when both parties confirm.</p>
      <h2>No advice</h2>
      <p>Nothing in MileVault is legal, tax or financial advice.</p>
    </>
  );
}
