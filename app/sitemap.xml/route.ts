import { SITE_URL } from "@/lib/site-url";
import { buildSitemapIndex, XML_HEADERS } from "@/lib/sitemap-xml";

// Sitemap INDEX at /sitemap.xml (robots.txt points here). Children:
//   /sitemap-pages.xml     — static pages, lifestyle hubs, communities, journal
//   /sitemap-listings.xml  — the live MLS inventory LiveModern actually surfaces
// Split so GSC reports indexed/discovered counts for the stable, high-value
// pages on their own instead of burying them under thousands of listing URLs.
export const revalidate = 3600;

export async function GET() {
  const now = new Date().toISOString();
  const xml = buildSitemapIndex([
    { loc: `${SITE_URL}/sitemap-pages.xml`, lastmod: now },
    { loc: `${SITE_URL}/sitemap-listings.xml`, lastmod: now },
  ]);
  return new Response(xml, { headers: XML_HEADERS });
}
