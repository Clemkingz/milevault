import type { NextConfig } from "next";

/**
 * Landing ("web" service). On Vercel, top-level routing in /vercel.json sends
 *   /app/*, /a/*  → app service      /admin/*  → admin service      everything else → here.
 * Locally (`pnpm dev`, no Vercel routing) these rewrites stand in for that, proxying to
 * the other dev servers so the whole product works from http://localhost:3000.
 * The backend is an external service (NEXT_PUBLIC_API_URL) — not routed through here.
 * (`vercel dev` runs all services with the real routing; the rewrites are skipped there.)
 */
const LOCAL_APP = process.env.LOCAL_APP_URL ?? "http://localhost:3001";
const LOCAL_ADMIN = process.env.LOCAL_ADMIN_URL ?? "http://localhost:3002";
const onVercel = !!process.env.VERCEL;

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  transpilePackages: ["@milevault/ui"],
  poweredByHeader: false,
  async rewrites() {
    if (onVercel) return [];
    return [
      { source: "/app", destination: `${LOCAL_APP}/app` },
      { source: "/app/:path*", destination: `${LOCAL_APP}/app/:path*` },
      { source: "/a/:ref", destination: `${LOCAL_APP}/app/a/:ref` },
      { source: "/admin", destination: `${LOCAL_ADMIN}/admin` },
      { source: "/admin/:path*", destination: `${LOCAL_ADMIN}/admin/:path*` },
    ];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/images/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
    ];
  },
};

export default nextConfig;
