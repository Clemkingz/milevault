import type { NextConfig } from "next";

/**
 * Dashboard zone. Served at /app — the landing app proxies /app/* here.
 * Can also be opened directly on its own deployment URL (/ redirects to /app/dashboard).
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Authenticated dashboard: never index
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
];

const nextConfig: NextConfig = {
  basePath: "/app",
  transpilePackages: ["@milevault/ui", "@milevault/shared"],
  poweredByHeader: false,
  async redirects() {
    return [{ source: "/", destination: "/app/dashboard", basePath: false, permanent: false }];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Service worker must always revalidate and may control the /app/ scope
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/app/" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        ],
      },
      { source: "/images/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
    ];
  },
};

export default nextConfig;
