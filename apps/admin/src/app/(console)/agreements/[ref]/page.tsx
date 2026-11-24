import type { Metadata } from "next";
import { AgreementDetail } from "./view";

export async function generateMetadata({ params }: { params: Promise<{ ref: string }> }): Promise<Metadata> {
  return { title: (await params).ref.toUpperCase() };
}
export default async function Page({ params }: { params: Promise<{ ref: string }> }) {
  return <AgreementDetail ref_={(await params).ref.toUpperCase()} />;
}
