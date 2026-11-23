import type { Metadata } from "next";
import { AgreementView } from "./view";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: `Agreement MV-${id}` };
}
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AgreementView id={id} />;
}
