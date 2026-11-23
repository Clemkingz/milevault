import type { Metadata } from "next";
import { AgreementsTable } from "./table";

export const metadata: Metadata = { title: "Agreements" };
export default function Page() { return <AgreementsTable />; }
