import type { Metadata } from "next";
import { WalletDetail } from "./view";

export async function generateMetadata({ params }: { params: Promise<{ address: string }> }): Promise<Metadata> {
  const a = (await params).address;
  return { title: `Wallet ${a.slice(0, 4)}…${a.slice(-4)}` };
}
export default async function Page({ params }: { params: Promise<{ address: string }> }) {
  return <WalletDetail address={(await params).address.toUpperCase()} />;
}
