import type { ReactNode } from "react";
import { Icon, Logo, type IconName } from "@milevault/ui";
import { ScrollHeader } from "./scroll-header";

export const APP = "/app/dashboard";
export const CONNECT = "/app/dashboard?connect=1";
export const FAUCET = "https://faucet.circle.com";

export function ConnectBtn({ size = "l", children = "Connect wallet" }: { size?: "s" | "l"; children?: ReactNode }) {
  return (
    <a className={`lbtn ${size} p`} href={CONNECT}>
      <Icon name="wallet" size={size === "s" ? 16 : 20} />
      {children}
    </a>
  );
}

export function Step({ k, title, body }: { k: string; title: string; body: string }) {
  return (
    <div className="lcard">
      <div className="ilw"><img src={`/images/${k.toLowerCase()}.webp`} alt="" width={36} height={48} loading="lazy" /></div>
      <div><h4>{title}</h4><p>{body}</p></div>
    </div>
  );
}

export function Feature({ icon, title, body }: { icon: IconName; title: string; body: string }) {
  return (
    <div className="lcard">
      <div className="itile"><Icon name={icon} size={24} /></div>
      <div><h4>{title}</h4><p>{body}</p></div>
    </div>
  );
}

export function Bullets({ items }: { items: string[] }) {
  return <div className="bullets">{items.map((x) => <div key={x}><Icon name="check_circle" size={22} />{x}</div>)}</div>;
}

export const NAV: [string, string][] = [["#how", "How it works"], ["#clients", "For clients"], ["#contributors", "For contributors"], ["#security", "Security"]];

export function LandingNav() {
  return <ScrollHeader>{NAV_INNER}</ScrollHeader>;
}

const NAV_INNER = (
  <>
      <a href="#top" aria-label="MileVault home"><Logo /></a>
      <nav className="links" aria-label="Sections">{NAV.map(([h, l]) => <a key={h} href={h}>{l}</a>)}</nav>
      <ConnectBtn size="s"><span className="cw-l">Connect wallet</span><span className="cw-s">Connect</span></ConnectBtn>
  </>
);

export function LandingFooter() {
  return (
    <footer className="lfoot">
      <div className="t">
        <div className="brand"><Logo />Milestone escrow for contributors and clients, on Stellar.</div>
        <div className="cols">
          <div><b>Product</b>{NAV.map(([h, l]) => <a key={h} href={`/${h}`}>{l}</a>)}</div>
          <div><b>Developers</b><a href="https://stellar.expert/explorer/testnet" target="_blank" rel="noopener">Stellar explorer</a><a href={FAUCET} target="_blank" rel="noopener">Testnet faucet</a></div>
          <div><b>Legal</b><a href="/privacy">Privacy</a><a href="/terms">Terms</a></div>
        </div>
      </div>
      <div className="b"><span>© {new Date().getFullYear()} MileVault</span><span>Running on Stellar Testnet · test USDC only</span></div>
    </footer>
  );
}
