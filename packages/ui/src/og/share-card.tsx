import { BRAND_SKY, LOGO_MARK_PATH } from "../icons/logo-mark";

/**
 * Social share card (1200×630) rendered with next/og's ImageResponse.
 * Uses only inline styles (Satori subset).
 */
export function ShareCard({ title, subtitle, eyebrow = "Live on Stellar Testnet" }: { title: string; subtitle: string; eyebrow?: string }) {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "linear-gradient(180deg, #FDFDFC 0%, #EAF8FE 100%)", color: "#171717", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: BRAND_SKY, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="38" height="38" viewBox="0 0 24 24"><path fill="#fff" fillRule="evenodd" clipRule="evenodd" d={LOGO_MARK_PATH} /></svg>
        </div>
        <span style={{ fontSize: 40, fontWeight: 600, letterSpacing: -1 }}>MileVault</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <span style={{ alignSelf: "flex-start", padding: "8px 18px", borderRadius: 999, background: "#EAF8FE", color: "#1A9ACB", fontSize: 24 }}>{eyebrow}</span>
        <span style={{ fontSize: 72, fontWeight: 600, letterSpacing: -2.5, lineHeight: 1.05 }}>{title}</span>
        <span style={{ fontSize: 30, color: "#7B7B7B", lineHeight: 1.35, maxWidth: 900 }}>{subtitle}</span>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        {["Create", "Fund", "Submit", "Approve", "Release"].map((s, i) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 18px", borderRadius: 999, background: "#fff", border: "1px solid rgba(0,0,0,.06)", fontSize: 22, color: "#171717" }}>
            <span style={{ width: 26, height: 26, borderRadius: 999, background: i === 4 ? "#00CE5C" : BRAND_SKY, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>{i + 1}</span>
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AppleIcon() {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: BRAND_SKY }}>
      <svg width="108" height="108" viewBox="0 0 24 24"><path fill="#fff" fillRule="evenodd" clipRule="evenodd" d={LOGO_MARK_PATH} /></svg>
    </div>
  );
}
