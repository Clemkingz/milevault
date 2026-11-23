import type { Metadata } from "next";
import { WalletsTable } from "./table";

export const metadata: Metadata = { title: "Wallets" };
export default function Page() { return <WalletsTable />; }
