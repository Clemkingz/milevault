/**
 * Canonical public URL of the landing (used for metadata, sitemap, robots, OG images).
 * Set NEXT_PUBLIC_SITE_URL in production; falls back to Vercel's production/preview URL.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined) ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
