/**
 * Canonical host for this deployment. Production (livemodern.com) sets
 * NEXT_PUBLIC_SITE_URL; the fallback is the real canonical host, which is
 * www-primary to match what REW served (and what modernlivingre.com does).
 * Trailing slash is always stripped so callers can concatenate paths.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.livemodern.com"
).replace(/\/$/, "");

export const INDEXABLE = process.env.SITE_INDEXABLE === "true";
