import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy", description: "How MileVault handles data on the Stellar Testnet MVP.", alternates: { canonical: "/privacy" } };

export default function Privacy() {
  return (
    <>
      <h1>Privacy</h1>
      <p className="upd">Testnet MVP · draft for review</p>
      <h2>What we read</h2>
      <p>MileVault reads your public Stellar address when you connect a wallet. We never see or store private keys or seed phrases — every action is signed in your own wallet.</p>
      <h2>What we store</h2>
      <ul>
        <li>Agreement details you enter (project name, milestone titles and descriptions).</li>
        <li>Links you submit as milestone work.</li>
        <li>An index of public on-chain events (funding, approvals, releases, refunds) for your agreements.</li>
      </ul>
      <h2>On-chain data is public</h2>
      <p>Escrow balances, addresses and transaction hashes live on the Stellar network and are publicly visible on block explorers.</p>
      <h2>Contact</h2>
      <p>Questions about this policy can be raised with the MileVault team.</p>
    </>
  );
}
