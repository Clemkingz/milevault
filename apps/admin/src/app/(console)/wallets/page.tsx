import type { Metadata } from "next";
import { Suspense } from "react";
import { Rows } from "@/components/bits";
import { WalletsView } from "./view";

export const metadata: Metadata = { title: "Wallets" };
export default function Page() { return <Suspense fallback={<Rows />}><WalletsView /></Suspense>; }
