import type { Metadata } from "next";
import { NewAgreementView } from "./view";

export const metadata: Metadata = { title: "New agreement" };
export default function Page() { return <NewAgreementView />; }
