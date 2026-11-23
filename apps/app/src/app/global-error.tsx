"use client";

/** Last-resort boundary (root layout failed) — self-contained markup and styles. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100dvh", display: "grid", placeItems: "center", background: "#FDFDFC", color: "#171717", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ maxWidth: 400, padding: 24, textAlign: "center" }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "#2EBEF2", margin: "0 auto 16px" }} />
          <h1 style={{ fontSize: 20, fontWeight: 500, margin: "0 0 8px" }}>MileVault couldn’t load</h1>
          <p style={{ color: "#7B7B7B", margin: "0 0 20px", lineHeight: "20px", fontSize: 14 }}>Your agreements and escrow are safe on Stellar. Reload to try again.</p>
          <button onClick={reset} style={{ height: 44, padding: "0 20px", borderRadius: 999, border: 0, background: "#2EBEF2", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>Reload</button>
        </div>
      </body>
    </html>
  );
}
