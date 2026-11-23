import type { Metadata } from "next";
import { InviteView } from "./view";

export async function generateMetadata({ params }: { params: Promise<{ ref: string }> }): Promise<Metadata> {
  const { ref } = await params;
  return { title: `${ref.toUpperCase()} · Shared agreement`, description: "You’ve been invited to a milestone escrow agreement on MileVault." };
}
export default async function Page({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  return <InviteView refCode={ref} />;
}
