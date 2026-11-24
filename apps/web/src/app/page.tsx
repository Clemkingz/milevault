import { Reveal } from "@milevault/ui";
import { Bullets, ConnectBtn, FAUCET, Feature, LandingFooter, LandingNav, Step } from "@/components/landing-parts";

export default function LandingPage() {
  return (
    <div className="lp">
      <LandingNav />
      <main>
        <section className="lhero" id="top">
          <span className="eyebrow">Live on Stellar Testnet</span>
          <h1>Pay contributors,<br className="br-d" /> milestone by milestone.</h1>
          <p>Lock test USDC in escrow on Stellar and release each payment when the work is approved. MileVault never holds your keys.</p>
          <div className="ctas"><ConnectBtn /><a className="lbtn l o" href="#how">See how it works</a></div>
          <small>No sign-up. Connect a Stellar wallet to start.</small>
        </section>

        <div className="pstage" aria-hidden>
          <div className="pframe scroll-tilt">
            <div className="chrome"><i style={{ background: "#FF5F57" }} /><i style={{ background: "#FEBC2E" }} /><i style={{ background: "#28C840" }} /><span className="url">🔒 milevault.app</span></div>
            <img src="/images/dashboard-preview.jpg" alt="" width={1440} height={1000} fetchPriority="high" />
          </div>
        </div>

        <div className="lcontent">
          <Reveal as="section" id="how">
            <div className="shead" style={{ width: 720 }}><span className="eyebrow">How it works</span><h2>Escrow in five steps.</h2><p>A 1,500.00 USDC agreement in three milestones.</p></div>
            <div className="steps5">
              <Reveal stagger className="r">
                <Step k="O-02" title="1. Create" body="The client sets up Website redesign with 3 milestones: 300, 700 and 500 USDC." />
                <Step k="O-03" title="2. Fund" body="The client locks 1,500.00 test USDC in escrow on Stellar, one balance per milestone." />
                <Step k="O-04" title="3. Submit" body="The contributor finishes milestone 1 and submits it with a link to the work." />
              </Reveal>
              <Reveal stagger className="r">
                <Step k="O-05" title="4. Approve" body="The client reviews and approves. Approved means ready to pay, not paid." />
                <Step k="O-06" title="5. Release" body="The client releases 300.00 USDC to the contributor. 1,200.00 stays locked." />
              </Reveal>
            </div>
          </Reveal>

          <Reveal as="section" className="split" id="clients">
            <div className="tx">
              <div className="shead l"><span className="eyebrow">For clients</span><h2>Pay only for work you approve.</h2><p>Funds sit in escrow until you release them, one milestone at a time.</p></div>
              <Bullets items={["Pay only for approved work", "Funds stay locked until you release", "Cancel and refund what isn’t paid yet"]} />
              <div><ConnectBtn /></div>
            </div>
            <div className="ppanel parallax"><img src="/images/phone-client.webp" alt="MileVault on iPhone: approving Core functionality" width={600} height={620} loading="lazy" /></div>
          </Reveal>

          <Reveal as="section" className="split rev" id="contributors">
            <div className="ppanel parallax"><img src="/images/phone-contrib.webp" alt="MileVault on iPhone: a funded agreement for the contributor" width={600} height={620} loading="lazy" /></div>
            <div className="tx">
              <div className="shead l"><span className="eyebrow">For contributors</span><h2>See the money before you start.</h2><p>The USDC is locked on Stellar before you begin, so every milestone is already funded.</p></div>
              <Bullets items={["See the money is there before you start", "Submit each milestone with your work", "Get paid straight to your wallet"]} />
              <div><ConnectBtn /></div>
            </div>
          </Reveal>

          <Reveal as="section" id="security">
            <div className="shead" style={{ width: 900 }}><span className="eyebrow">Security</span><h2>Your keys. Your funds. On-chain.</h2><p>Funds are locked on Stellar, and every payout starts with your wallet’s signature.</p></div>
            <div className="steps5"><Reveal stagger className="r">
              <Feature icon="safe_lock" title="Funds are locked in Stellar claimable balances" body="Each milestone is locked separately and paid when the client releases it." />
              <Feature icon="lock" title="MileVault never holds your keys" body="Every on-chain action is signed in your own wallet. MileVault never sees your keys." />
              <Feature icon="link" title="Every movement has a hash" body="Create, fund, release and refund all link to the Stellar explorer." />
            </Reveal></div>
          </Reveal>

          <Reveal as="section" className="notice">
            <img src="/images/bg-cta.webp" alt="" loading="lazy" />
            <div className="scrim" />
            <span className="eyebrow">This is Stellar Testnet</span>
            <h2>Try it with test USDC.</h2>
            <p>Amounts are test USDC with no real value. Get free test funds from the faucet before you fund an agreement.</p>
            <div className="ctas"><ConnectBtn /><a className="lbtn l o" href={FAUCET} target="_blank" rel="noopener">Open faucet</a></div>
          </Reveal>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
