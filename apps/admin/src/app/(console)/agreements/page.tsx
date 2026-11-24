import type { Metadata } from "next";
import { Suspense } from "react";
import { Rows } from "@/components/bits";
import { AgreementsTable } from "./table";

export const metadata: Metadata = { title: "Agreements" };
export default function Page() { return <Suspense fallback={<Rows />}><AgreementsTable /></Suspense>; }
