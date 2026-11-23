import type { Metadata } from "next";
import { AgreementsView } from "./view";

export const metadata: Metadata = { title: "Agreements" };
export default function Page() { return <AgreementsView />; }
