import type { Metadata } from "next";
import { AgreementLookup, QuickLinks, SystemFrame } from "@/components/system";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <SystemFrame k="E-01" code="404" title="Nothing in this vault">
      <p>We couldn’t find that page. The link may be mistyped, or the page moved.</p>
      <AgreementLookup />
      <QuickLinks links={[["/app/dashboard", "Dashboard", "home"], ["/app/agreements", "Agreements", "file"], ["/app/transactions", "Transactions", "transfer"], ["/app/settings", "Settings", "user"]]} />
    </SystemFrame>
  );
}
