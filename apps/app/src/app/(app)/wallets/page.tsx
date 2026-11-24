import type { Metadata } from "next";
import { WalletsView } from "./view";

export const metadata: Metadata = { title: "Wallet" };
export default function Page() { return <WalletsView />; }
