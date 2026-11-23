import { LandingFooter, LandingNav } from "@/components/landing-parts";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return <div className="lp"><LandingNav /><main className="legal">{children}</main><LandingFooter /></div>;
}
