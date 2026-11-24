import type { Metadata } from "next";
import { AgreementsView } from "./view";

export const metadata: Metadata = { title: "Agreements" };
import { Suspense } from "react";

export default function Page() { return <Suspense><AgreementsView /></Suspense>; }
