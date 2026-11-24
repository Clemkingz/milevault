import type { Metadata } from "next";
import { Suspense } from "react";
import { Rows } from "@/components/bits";
import { TransactionsView } from "./view";

export const metadata: Metadata = { title: "Transactions" };
export default function Page() { return <Suspense fallback={<Rows />}><TransactionsView /></Suspense>; }
