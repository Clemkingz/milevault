/** MileVault logo — single source for the mark (sky tile + shield-lock) and wordmark. */
export const LOGO_MARK_PATH = "M11.298 2.195a2 2 0 0 1 1.404 0l7 2.625A2 2 0 0 1 21 6.693v5.363a9 9 0 0 1-4.975 8.05l-3.354 1.676a1.5 1.5 0 0 1-1.342 0l-3.354-1.677A9 9 0 0 1 3 12.055V6.694A2 2 0 0 1 4.298 4.82zM13 11.732A2 2 0 0 0 12 8a2 2 0 0 0-1 3.732V15a1 1 0 1 0 2 0z";
export const BRAND_SKY = "#2EBEF2";

/** Standalone SVG of the mark (favicons, OG images, manifest icons) */
export function logoMarkSvg(size = 64, radius = 0.29): string {
  const r = Math.round(size * radius);
  const inner = size * 0.6, off = (size - inner) / 2, s = inner / 24;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" rx="${r}" fill="${BRAND_SKY}"/><path fill="#fff" fill-rule="evenodd" clip-rule="evenodd" transform="translate(${off} ${off}) scale(${s})" d="${LOGO_MARK_PATH}"/></svg>`;
}
