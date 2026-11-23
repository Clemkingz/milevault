import type { Metadata } from "next";
import { TransactionsView } from "./view";

export const metadata: Metadata = { title: "Transactions" };
export default function Page() { return <TransactionsView />; }
