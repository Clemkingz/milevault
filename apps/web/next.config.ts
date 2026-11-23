import type { NextConfig } from "next";

/**
 * Multi-zone (same pattern as the reference project):
 *   /       → this landing app
 *   /app/*  → the dashboard app (apps/app, basePath "/app"), proxied via rewrites
 *   /a/*    → shared-agreement deep links, served by the dashboard
 */
const APP_URL = process.env.APP_URL ?? "http://localhost:3001";

if (process.env.VERCEL && !process.env.APP_URL) {
  throw new Error(
    "APP_URL is not set. Set it to the dashboard deployment URL (e.g. https://milevault-app.vercel.app) in the landing project's Vercel environment variables.",
  );
}

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  transpilePackages: ["@milevault/ui", "@milevault/shared"],
  poweredByHeader: false,
  async rewrites() {
    return [
      { source: "/app", destination: `${APP_URL}/app` },
      { source: "/app/:path*", destination: `${APP_URL}/app/:path*` },
      { source: "/a/:ref", destination: `${APP_URL}/app/a/:ref` },
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
