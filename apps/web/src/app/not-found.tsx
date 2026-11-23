import type { Metadata } from "next";
import { LandingFooter, LandingNav } from "@/components/landing-parts";
import { Lookup } from "@/components/lookup";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <div className="lp sys">
      <LandingNav />
      <div className="dlwrap">
        <div className="dlcard mv-page">
          <div className="hmedia"><img className="sky" src="/images/sky.webp" alt="" /><img className="hil" src="/images/e-01.webp" alt="" /><span className="knot" /></div>
          <span className="sys-code">404</span>
          <h3>Nothing in this vault</h3>
          <p>We couldn’t find that page. It may have moved, or the link is mistyped.</p>
          <Lookup />
          <div className="qlinks"><a href="/">Home</a><a href="/app/dashboard">Open the app</a><a href="/#how">How it works</a><a href="/#security">Security</a></div>
        </div>
      </div>
      <LandingFooter />
    </div>
  );
}
