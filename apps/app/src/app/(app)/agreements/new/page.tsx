import type { Metadata } from "next";
import { AgreementEditor } from "../editor";

export const metadata: Metadata = { title: "New agreement" };
export default function Page() { return <AgreementEditor />; }
