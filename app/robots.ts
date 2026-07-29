import type { MetadataRoute } from "next";
import { SITE_URL, INDEXABLE } from "@/lib/site-url";

// Mirrors mlg-site's robots policy (Patrick 2026-07-27, crawl-budget + cost fix):
// do NOT blanket-allow. Indexing is OFF unless SITE_INDEXABLE=true, so preview
// and staging hosts stay out of the index.
//
// DISALLOW rules. On mlg-site, GSC showed Google burning the bulk of its crawl
// on machine-generated, non-indexable URLs — ~62% on /_next/image variants plus
// /search?loc={…JSON} permutations. LiveModern's equivalents:
//   /api/     — all API routes (/api/leads, /api/mila, /api/track). A crawler
//               hitting these is pure function invocation + Supabase reads.
//   /mila     — the AI assistant surface: dynamic, per-session, no crawl value.
//   /forums/, /Members/, /*blogs/ — leftovers from the domain's pre-REW Plone
//               life that bots still probe by the hundred.
//
// LiveModern does NOT need /_next/image (images go through Cloudflare
// transforms) and has no searchParams surfaces, so those two mlg rules don't
// apply here.
//
// /listing/* stays ALLOWED and is submitted in sitemap-listings.xml — same
// split modernlivingre.com uses. robots disallow affects ONLY crawler fetches;
// it never changes how pages render for real users.
export default function robots(): MetadataRoute.Robots {
  if (!INDEXABLE) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/mila", "/forums/", "/Members/"],
    },
    sitemap: [
      `${SITE_URL}/sitemap.xml`,
      `${SITE_URL}/sitemap-pages.xml`,
      `${SITE_URL}/sitemap-listings.xml`,
    ],
    host: SITE_URL,
  };
}
