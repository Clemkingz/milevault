import type { MetadataRoute } from "next";

/** Installable app (PWA) — scoped to the dashboard zone */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/app/",
    name: "MileVault — Milestone escrow",
    short_name: "MileVault",
    description: "Fund agreements, approve milestones and release payments from a Soroban escrow on Stellar.",
    start_url: "/app/dashboard?source=pwa",
    scope: "/app/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone"],
    orientation: "any",
    background_color: "#FDFDFC",
    theme_color: "#FDFDFC",
    categories: ["finance", "productivity", "business"],
    icons: [
      { src: "/app/pwa-icon/192", type: "image/png", sizes: "192x192", purpose: "any" },
      { src: "/app/pwa-icon/512", type: "image/png", sizes: "512x512", purpose: "any" },
      { src: "/app/pwa-icon/maskable-512", type: "image/png", sizes: "512x512", purpose: "maskable" },
      { src: "/app/icon.svg", type: "image/svg+xml", sizes: "any" },
    ],
    shortcuts: [
      { name: "New agreement", url: "/app/agreements/new", icons: [{ src: "/app/pwa-icon/192", sizes: "192x192" }] },
      { name: "Agreements", url: "/app/agreements", icons: [{ src: "/app/pwa-icon/192", sizes: "192x192" }] },
      { name: "Transactions", url: "/app/transactions", icons: [{ src: "/app/pwa-icon/192", sizes: "192x192" }] },
    ],
  };
}
