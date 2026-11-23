import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MileVault",
    short_name: "MileVault",
    description: "Milestone escrow payments on Stellar.",
    start_url: "/",
    display: "standalone",
    background_color: "#FDFDFC",
    theme_color: "#2EBEF2",
    icons: [{ src: "/icon.svg", type: "image/svg+xml", sizes: "any" }, { src: "/apple-icon", type: "image/png", sizes: "180x180" }],
  };
}
