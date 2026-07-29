import type { MetadataRoute } from "next";

/**
 * Robots is env-gated, exactly like the <meta robots> in app/layout.tsx.
 * SITE_INDEXABLE=true  -> allow crawling + declare the sitemap
 * anything else        -> disallow everything (staging posture)
 *
 * Keep this in agreement with layout.tsx's `indexable` flag; if they ever
 * disagree you get the worst case: a crawlable site with noindex pages.
 */
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.livemodern.com").replace(/\/$/, "");
const indexable = process.env.SITE_INDEXABLE === "true";

export default function robots(): MetadataRoute.Robots {
  if (!indexable) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Old REW/Plone cruft and the MiLa endpoint — no crawl value.
        disallow: ["/api/", "/mila", "/forums/", "/Members/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
